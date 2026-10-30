# ATK — Two-VM Docker Compose Deployment

Split of the single-host `../ATK` stack across two Linux VMs, with one DNS
record per component instead of one hostname using path routing (`/api`,
`/auth`, …).

---

## 1. Topology

| DNS record | IP | VM | Served by |
|---|---|---|---|
| `sso-atkdev.familydollar.com` | 10.106.6.15 | core | Keycloak (`/auth`) |
| `vault-atkdev.familydollar.com` | 10.106.6.15 | core | HashiCorp Vault |
| `backend-atkdev.familydollar.com` | 10.106.6.15 | core | Backend API + Grafana + LiteLLM + Agent Gateway |
| `autonomousitopstoolkitdev.familydollar.com` | 10.106.6.228 | frontend | React SPA |

```
                   Browser
                      │
      ┌───────────────┴────────────────────────────────┐
      │                                                │
      ▼                                                ▼
 autonomousitopstoolkitdev                   sso-atkdev   ─┐
 (10.106.6.228)                              vault-atkdev  ├─ (10.106.6.15)
 ┌──────────────────────┐                    backend-atkdev┘
 │ nginx :443           │                    ┌─────────────────────────────┐
 │  └─ static SPA       │                    │ nginx :443 (3 vhosts)       │
 │ frontend-builder     │                    │  ├─ keycloak:8080           │
 └──────────────────────┘                    │  ├─ vault:8200              │
                                             │  └─ backend:8000            │
                                             │     grafana:3000  /grafana  │
                                             │     litellm:4000  /litellm  │
                                             │     agw-ui:19000  /ui       │
                                             │     agw-engine    /mcp      │
                                             │ postgres:5432               │
                                             └─────────────────────────────┘
```

**Grafana, LiteLLM and Agent Gateway have no DNS record of their own**, so they
stay as sub-paths of the backend hostname. Both VMs run their own nginx
container with its own config — nothing is shared between the two hosts.

### Why only 4 records, and what that means

The browser now talks to two origins, so these are cross-origin calls:

- SPA → `https://backend-atkdev.familydollar.com/api` (REST + WebSocket)
- SPA → `https://sso-atkdev.familydollar.com/auth` (Keycloak JS adapter)

No code change was needed for this: the backend already runs
`CORSMiddleware(allow_origins=["*"], allow_credentials=True)` and the SPA uses
bearer tokens (`withCredentials: false`), so preflight succeeds as-is. What
*does* need attention is Keycloak client configuration — see §4.

If you would rather avoid cross-origin entirely, the frontend nginx has a
commented-out same-origin proxy block; see §7.

---

## 2. What changed vs. the single-host `../ATK` stack

### Split

| Component | Single host | Core VM (.15) | Frontend VM (.228) |
|---|---|---|---|
| postgres, vault, keycloak, litellm, agentgateway ×2, backend, grafana | ✓ | ✓ | — |
| frontend-builder | ✓ | — | ✓ |
| nginx | 1 | 1 (3 vhosts) | 1 (1 vhost) |
| `frontend_dist` volume | shared | removed | local to this VM |

### Config edits

| File | Change |
|---|---|
| `core-server/.env` | `DNS_NAME` replaced by `KEYCLOAK_DNS` / `VAULT_DNS` / `BACKEND_DNS` / `FRONTEND_DNS`; added `DB_*`/`PGDB_*` and `GRAFANA_ADMIN_*` (were hard-coded in compose) |
| `core-server/docker-compose.yml` | `KC_HOSTNAME` → `https://${KEYCLOAK_DNS}/auth`; backend + agentgateway-ui `KEYCLOAK_URL` → `https://${KEYCLOAK_DNS}/auth` (was the shared `integration.autonomousitopstoolkit.com`); `LITELLM_PUBLIC_BASE_URL` / `GF_SERVER_ROOT_URL` → `${BACKEND_DNS}`; backend CORS envs → frontend origin; Grafana embedding allowed; frontend-builder removed; nginx no longer publishes `:8443` |
| `core-server/config/nginx.conf` | Rewritten: name-based vhosts. `/auth` is now a dedicated vhost proxying the **local** keycloak container (the old config proxied to an external Keycloak); Vault moved from `:8443` to its own vhost on `:443`; backend vhost keeps the original `/api`, `/litellm`, `/grafana`, `/ui`, `/agentgateway`, `/mcp`, `/iac_assist_socket`, `/openapi.json` locations; catch-all vhost returns 444 |
| `core-server/config/grafana.ini` | `root_url` → backend DNS; admin creds read from env; `allow_embedding`/`cookie_samesite=none` for cross-origin iframe |
| `core-server/config/config-agent-gateway.yaml` | MCP `issuer` + `jwks.url` → `sso-atkdev`; `resourceMetadata.resource` → `https://backend-atkdev…/mcp` |
| `core-server/config/.keycloak_env` | Added `KEYCLOAK_URL`, `KEYCLOAK_REDIRECTION_URL` |
| `core-server/config/.vault_env` | `VAULT_URL=http://vault:8200` (container-to-container, no TLS hop) |
| `frontend-server/config/app-config.json` | `backend.api.baseUrl` → `https://backend-atkdev…/api`; `auth.keycloak.url` → `https://sso-atkdev…/auth`; `clientId` → `aiot-frontend`; `externalLinks.*` → `https://backend-atkdev…/grafana`; `iframes.agentGateway` → `https://backend-atkdev…/ui/`; entraId redirect URIs → frontend DNS |
| `frontend-server/config/config.json` | Same substitutions for the legacy endpoint map, incl. `iac_socket_url` → `wss://backend-atkdev…` |
| `frontend-server/config/nginx.conf` | New: static SPA vhost, SPA fallback, split asset caching (see below), `no-store` on `app-config.json` / `config.json` / `license.txt`, `text/javascript` in `gzip_types` |
| `core-server/config/vite.config.ts` | `preview.allowedHosts` updated. Inert — mounted into the *backend* container by the original compose; kept only for parity |

### Asset caching on the frontend host

`dist/assets/` holds two different kinds of file and they must not share a
caching policy:

| Path | Origin | Filenames | Policy |
|---|---|---|---|
| `assets/js/`, `assets/css/`, `assets/img/`, `assets/fonts/` | vite `rolldownOptions.output` | content-hashed | `1y, immutable` |
| `assets/knowledge-ai/`, `assets/module-icons/`, `assets/shared/` | copied verbatim from `public/` | **stable** | `1h, must-revalidate` |

Marking the second group `immutable` would mean a replaced category or module
icon never reaches a browser that has already loaded the old one — `immutable`
suppresses revalidation even on a manual reload.

### The frontend builder does not get `vite.config.ts`

The `frontend_2.3.4` image already contains the build config matching its own
source tree. Mounting a repo snapshot over `/app/vite.config.ts` would risk
breaking the build whenever the image moves ahead of the checkout, and buys
nothing: the only difference is a `preview` block, which `npm run build` never
reads. The original `../ATK` compose mounts that file into the **backend**
container instead — almost certainly a copy/paste slip, harmless there.

**No application source code was modified.** Everything above is config.

---

## 3. Deploy

### 3.1 Core server — 10.106.6.15

```bash
scp -r ATK-MultiHost/core-server  user@10.106.6.15:/opt/atk/
ssh user@10.106.6.15
cd /opt/atk/core-server

# TLS — see ssl/README.md (cert must cover all three *-atkdev names)
cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.pem   ssl/
chmod 600 ssl/privkey.pem

# Fill in every <YOUR_...> placeholder
vi .env
vi config/.keycloak_env config/.vault_env config/.itsm_env
vi init/01_init.sh        # keycloak_db / litellm_db passwords must match .env
vi config/litellm_config.yaml

# REQUIRED: the backend image runs as USER 65532:65532 and rewrites several of
# these files in place from the Admin portal. Files left owned by root are
# readable but not writable by the container, which surfaces as
# "[Errno 13] Permission denied" when saving. See §9.
sudo chown -R 65532:65532 system_prompts config
sudo chmod 644 system_prompts/*.yaml config/.vault_env config/.vault_type \
               config/shift_roaster.xlsx
# SELinux hosts (RHEL/Rocky) only — append :z to each bind mount in
# docker-compose.yml, or run: sudo setenforce 0 to confirm it is the cause.

docker compose config          # validates .env interpolation
docker compose up -d
docker compose ps
docker compose logs -f nginx
```

Open firewall: `80/tcp`, `443/tcp` (and `3978/tcp` only if MIM Assist is used).
The container ports published for debugging (`5432`, `8080`, `8200`, `4000`,
`3000`, `8000`, `13000`, `15000`, `19000`) should **not** be reachable from
outside the VM — block them at the host firewall:

```bash
sudo firewall-cmd --permanent --add-port=80/tcp --add-port=443/tcp
sudo firewall-cmd --reload
```

### 3.2 Frontend server — 10.106.6.228

```bash
scp -r ATK-MultiHost/frontend-server  user@10.106.6.228:/opt/atk/
ssh user@10.106.6.228
cd /opt/atk/frontend-server

cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.pem   ssl/
chmod 600 ssl/privkey.pem

# Confirm the endpoints point at the core server
grep -n "atkdev" config/app-config.json

docker compose up -d
docker compose logs -f frontend-builder   # wait for the vite build to finish
docker compose ps                         # nginx starts only after the build exits 0
```

The frontend VM needs outbound HTTPS to `*-atkdev.familydollar.com` only for
the *browser*, not for the server itself — nginx here serves static files and
proxies nothing (unless you enable the optional block in §7).

---

## 4. Keycloak configuration (required — not file-driven)

After the core stack is up, log into
`https://sso-atkdev.familydollar.com/auth` with `KEYCLOAK_ADMIN` /
`KEYCLOAK_ADMIN_PASSWORD` and configure realm `AIOT`:

**Public client `aiot-frontend`** (must match `app-config.json → auth.keycloak.clientId`)

| Setting | Value |
|---|---|
| Client authentication | Off (public) |
| Standard flow | On |
| Valid redirect URIs | `https://autonomousitopstoolkitdev.familydollar.com/*` |
| Valid post logout redirect URIs | `https://autonomousitopstoolkitdev.familydollar.com/*` |
| Web origins | `https://autonomousitopstoolkitdev.familydollar.com` |

The **Web origins** entry is the one that bites in a split deployment: without
it the browser's CORS preflight to `/token`, `/revoke` and `/userinfo` fails and
login silently loops.

**Confidential client `aiot-backend`** — client-credentials / service account,
used for token introspection. Put its id + secret in
`core-server/config/.keycloak_env` (`CLIENT_ID`, `CLIENT_SECRET`) and in `.env`
(`SA_CLIENT_ID`, `SA_CLIENT_SECRET`).

**Client `agw-cli`** — Agent Gateway UI; redirect URI
`https://backend-atkdev.familydollar.com/ui/*`, web origin
`https://backend-atkdev.familydollar.com`.

Also add a **groups** mapper to the token (the backend and the Agent Gateway
authorization rules read `jwt.groups`).

---

## 5. Verify

```bash
# From any host that can resolve the records
curl -sI  https://sso-atkdev.familydollar.com/auth/realms/AIOT
curl -s   https://sso-atkdev.familydollar.com/auth/realms/AIOT/.well-known/openid-configuration | head -c 200
curl -sI  https://vault-atkdev.familydollar.com/v1/sys/health
curl -s   https://backend-atkdev.familydollar.com/api/health/live
curl -sI  https://backend-atkdev.familydollar.com/grafana/login
curl -sI  https://autonomousitopstoolkitdev.familydollar.com/
curl -s   https://autonomousitopstoolkitdev.familydollar.com/app-config.json | head -c 200

# CORS preflight the SPA will issue
curl -s -X OPTIONS https://backend-atkdev.familydollar.com/api/health/live \
  -H "Origin: https://autonomousitopstoolkitdev.familydollar.com" \
  -H "Access-Control-Request-Method: GET" -D - -o /dev/null
```

Validate nginx syntax before restarting either host:

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload     # config-only change, no downtime
```

---

## 6. Changing an endpoint later

`app-config.json` is loaded by the SPA **at runtime**, so editing it does not
require a rebuild:

```bash
# on 10.106.6.228
vi config/app-config.json
docker compose restart frontend-builder   # re-copies public/ into the bundle
docker compose exec nginx nginx -s reload
```

nginx serves `app-config.json` with `Cache-Control: no-store`, so a normal
refresh picks up the change.

---

## 7. Fallback: single-origin mode

If cross-origin turns out to be a problem (corporate proxy stripping `Origin`,
a security policy that forbids `Access-Control-Allow-Origin: *`, …), switch the
browser back to a single origin:

1. In `frontend-server/config/nginx.conf`, uncomment the `location /api/`,
   `/iac_assist_socket/`, `/grafana/` and `/ui/` blocks at the bottom.
2. In `frontend-server/config/app-config.json`, revert to relative paths:
   `backend.api.baseUrl` → `"/api"`, `externalLinks.*` → `"/grafana"`,
   `iframes.agentGateway` → `"/ui/"`.
3. In `frontend-server/config/config.json`, use `/api` and
   `wss://autonomousitopstoolkitdev.familydollar.com/iac_assist_socket/ws/`.

Keycloak stays on `sso-atkdev` either way — the JS adapter is designed for a
separate SSO origin, it only needs the Web origins entry from §4.

---

## 7b. If nginx will not start at all

Check the logs first — an nginx config error is fatal, so the container
crash-loops and *every* vhost goes down together (SSO, Vault and Backend all
stop answering, not just the broken one):

```bash
docker compose logs nginx | tail -30
```

The failure mode worth knowing about:

```
nginx: [emerg] host not found in upstream "agentgateway-ui" in /etc/nginx/nginx.conf:241
```

A `proxy_pass` written with a **literal** hostname is resolved when nginx parses
its config. If that container is not running at that moment, nginx refuses to
start. Every `proxy_pass` in these configs therefore uses the
`set $upstream … ; proxy_pass http://$upstream …;` form plus the `resolver
127.0.0.11` line, which defers the lookup to request time — a missing upstream
then degrades to a 502 on that path alone.

`../ATK/config/nginx.conf` still has seven literal upstreams (the `/api/config`,
`/api/runtime`, `/api/costs/*`, `/api/cel`, `/api/logs` Agent Gateway overrides).
It survives on a single host because `depends_on` starts those containers first,
but it will take the whole proxy down if the Agent Gateway images fail to pull
or crash on boot.

Other quick checks:

```bash
docker compose exec nginx nginx -t          # syntax + upstream resolution
docker compose ps                            # is agentgateway-ui actually up?
curl -ski https://localhost/healthz -H "Host: backend-atkdev.familydollar.com"
```

---

## 9. Config files the application writes at runtime

Most of `config/` is input-only, but three Admin-portal features rewrite their
backing file **in place**, so those bind mounts must not be `:ro` and the host
file must be owned by UID 65532 (the backend image's `USER`):

| Host file | Written by | Code |
|---|---|---|
| `system_prompts/*.yaml` (all 7) | Admin → Prompt Library → Update Package Configuration / Update Agent Definition | `administration_router.py:714`, `:787` |
| `config/.vault_env`, `config/.vault_type` | Admin → Vault → upload vault config | `vault.py:37`, `:41` |
| `config/shift_roaster.xlsx` | MIM Assist → upload shift roster | `mim_assist_utils.py` |

Both failure modes report through the same handler, whose message says
*"Global configurations retrieval failed"* even though the **read succeeded and
the write is what failed** — the whole read-modify-write sits in one `try`
block with a hardcoded label. Read the errno, not the sentence:

| errno | Cause | Fix |
|---|---|---|
| `[Errno 13] Permission denied` | host file owned by root; container is UID 65532 | `sudo chown 65532:65532 <file>` |
| `[Errno 30] Read-only file system` | mount still has `:ro` | drop the `:ro` suffix |
| `[Errno 13]` on **every** file incl. reads | SELinux denying the bind mount | append `:z` to the mount |

Because the writes are in-place truncate-and-rewrite (`open(path, "w+")`, not
atomic rename), single-file bind mounts work correctly and edits made in the UI
persist to the host across container restarts.

---

## 8. Known rough edges carried over from `../ATK`

- `main.py` hard-codes `allow_origins=["*"]`; the `CORS_ORIGINS` /
  `ALLOWED_ORIGINS` env vars are set but not read. Left as-is — it is what makes
  the split work without a code change. Tighten it in `main.py` if your security
  review requires an explicit origin list.
- The backend service mounts `config/vite.config.ts` to `/app/vite.config.ts`
  (labelled "Hotfix: override main.py"). It is inert for a Python container;
  kept for parity with the original compose file.
- `init/01_init.sh` contains literal DB passwords that must be kept in sync with
  `.env` by hand. It only runs on first boot of an empty `postgres_data` volume.
- `litellm_config.yaml` carries a second copy of the LiteLLM DSN alongside
  `DATABASE_URL` in compose.
- `app-config.json → externalLinks.cloudAi` and the whole `fasteai` block point
  at services that are not part of this stack; left untouched.
