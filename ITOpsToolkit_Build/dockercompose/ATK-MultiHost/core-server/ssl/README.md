# TLS material for the CORE server (10.106.6.15)

Drop two files in this directory before `docker compose up`:

```
fullchain.pem   # server cert + intermediate chain
privkey.pem     # matching private key (PEM, unencrypted)
```

The certificate must be valid for **all three** hostnames served by this VM:

- `sso-atkdev.familydollar.com`
- `vault-atkdev.familydollar.com`
- `backend-atkdev.familydollar.com`

Either a wildcard (`*.familydollar.com`) or a SAN certificate listing the three
names will work. A single-name certificate will cause browser TLS warnings on
the other two hostnames.

Verify before deploying:

```bash
openssl x509 -in fullchain.pem -noout -text | grep -A1 "Subject Alternative Name"
openssl x509 -in fullchain.pem -noout -modulus | openssl md5
openssl rsa  -in privkey.pem   -noout -modulus | openssl md5   # must match
```

Permissions:

```bash
chmod 644 fullchain.pem
chmod 600 privkey.pem
```
