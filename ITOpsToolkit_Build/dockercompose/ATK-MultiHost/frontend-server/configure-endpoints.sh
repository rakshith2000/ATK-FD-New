#!/usr/bin/env bash
# =============================================================================
#  Rewrite the browser-facing endpoints in config/app-config.json and
#  config/config.json for the two-VM split deployment.
#
#  WHY THIS EXISTS
#  ---------------
#  app-config.json is validated at runtime by the SPA (loadAppConfig() ->
#  validateAppConfig()). The validator lives INSIDE the frontend image, so the
#  set of required keys tracks the image, not this git checkout. A config file
#  copied from an older checkout fails with:
#
#      Failed to bootstrap application
#      Error: Invalid app-config.json:
#        backend.api.kbAiScoreByContent: Required
#        ...
#
#  The only authoritative source for the config SHAPE is the image itself.
#  So: extract the pristine file from the image, then re-apply just the
#  handful of endpoint values that differ in this deployment. Re-run after
#  every frontend image bump.
#
#  USAGE
#  -----
#    ./configure-endpoints.sh --extract    # pull config from image, then patch
#    ./configure-endpoints.sh              # patch the files already in config/
#
#  Override any of these via environment variables if your names differ:
#    FRONTEND_IMAGE  FRONTEND_DNS  BACKEND_DNS  KEYCLOAK_DNS
#    KEYCLOAK_REALM  KEYCLOAK_CLIENT_ID
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

FRONTEND_IMAGE="${FRONTEND_IMAGE:-atkcontainerhub.jfrog.io/atk-main-2-3/atk-maf:frontend_2.3.4}"
FRONTEND_DNS="${FRONTEND_DNS:-autonomousitopstoolkitdev.familydollar.com}"
BACKEND_DNS="${BACKEND_DNS:-backend-atkdev.familydollar.com}"
KEYCLOAK_DNS="${KEYCLOAK_DNS:-sso-atkdev.familydollar.com}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-AIOT}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-aiot-frontend}"

mkdir -p config

if [ "${1:-}" = "--extract" ]; then
    echo "Extracting pristine configs from ${FRONTEND_IMAGE}"
    for f in app-config.json config.json; do
        if docker run --rm --entrypoint cat "$FRONTEND_IMAGE" "/app/public/$f" > "config/$f.new" 2>/dev/null \
           && [ -s "config/$f.new" ]; then
            [ -f "config/$f" ] && cp "config/$f" "config/$f.bak"
            mv "config/$f.new" "config/$f"
            echo "  extracted  config/$f   (previous saved as $f.bak)"
        else
            rm -f "config/$f.new"
            echo "  SKIPPED    /app/public/$f not present in image - keeping existing config/$f"
        fi
    done
    echo
fi

python3 - "$FRONTEND_DNS" "$BACKEND_DNS" "$KEYCLOAK_DNS" "$KEYCLOAK_REALM" "$KEYCLOAK_CLIENT_ID" <<'PY'
import json, sys, pathlib

fe, be, kc, realm, client = sys.argv[1:6]

def load(p):
    path = pathlib.Path(p)
    if not path.exists():
        return None, None
    return path, json.loads(path.read_text(encoding="utf-8"))

def setp(doc, path, value, create_leaf=True):
    """Set a dotted path. Only descends into containers that already exist, so
    we never invent a section the image's validator does not know about."""
    parts = path.split(".")
    cur = doc
    for part in parts[:-1]:
        if not isinstance(cur, dict) or part not in cur:
            return ("skip", path, "parent section absent")
        cur = cur[part]
    leaf = parts[-1]
    if not isinstance(cur, dict):
        return ("skip", path, "parent not an object")
    if leaf not in cur and not create_leaf:
        return ("skip", path, "key absent")
    before = cur.get(leaf, "<absent>")
    if before == value:
        return ("same", path, value)
    cur[leaf] = value
    return ("set", path, f"{before!r} -> {value!r}")

APP = [
    ("backend.api.baseUrl",                 f"https://{be}/api"),
    ("auth.keycloak.url",                   f"https://{kc}/auth"),
    ("auth.keycloak.realm",                 realm),
    ("auth.keycloak.clientId",              client),
    # Required by the validator. loadAppConfig() overwrites both with
    # window.location.href immediately after validation, so the value only has
    # to be a well-formed string - but it must be present.
    ("auth.keycloak.redirectUri",           f"https://{fe}/"),
    ("auth.keycloak.postLogoutRedirectUri", f"https://{fe}/"),
    ("auth.entraId.redirectUri",            f"https://{fe}/"),
    ("auth.entraId.postLogoutRedirectUri",  f"https://{fe}/"),
    ("externalLinks.ticketAudit",           f"https://{be}/grafana"),
    ("externalLinks.callAudit",             f"https://{be}/grafana"),
    ("externalLinks.atkPulse",              f"https://{be}/grafana"),
    ("iframes.agentGateway",                f"https://{be}/ui/"),
]

LEGACY = [
    ("qa_api_baseurl",      f"https://{be}/api"),
    ("maf_api_baseurl",     f"https://{be}/api"),
    ("new_apis_url",        f"https://{be}/api"),
    ("meetingAssistClient", f"https://{be}/api/meeting_assist/api/v1/"),
    ("iac_socket_url",      f"wss://{be}/iac_assist_socket/ws/"),
    ("ticketAudit",         f"https://{be}/grafana/login"),
    ("atkPulse",            f"https://{be}/grafana"),
    ("keycloak.url",        f"https://{kc}/auth"),
    ("keycloak.realm",      realm),
    ("keycloak.clientId",   client),
]

rc = 0
for fname, edits, create in [("config/app-config.json", APP, True),
                             ("config/config.json",     LEGACY, False)]:
    path, doc = load(fname)
    if doc is None:
        print(f"{fname}: NOT FOUND - skipping")
        continue
    print(f"{fname}")
    for key, val in edits:
        action, k, detail = setp(doc, key, val, create_leaf=create)
        mark = {"set": "  set     ", "same": "  ok      ", "skip": "  SKIPPED "}[action]
        print(f"{mark}{k:<38} {detail}")
    path.write_text(json.dumps(doc, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(path.read_text(encoding="utf-8"))   # re-parse as a guard
    print(f"  -> written, valid JSON\n")

print("Done. Now rebuild the bundle so public/ is re-copied into dist/:")
print("  docker compose up -d --force-recreate frontend-builder")
print("  docker compose logs -f frontend-builder")
print("  docker compose exec nginx nginx -s reload")
PY
