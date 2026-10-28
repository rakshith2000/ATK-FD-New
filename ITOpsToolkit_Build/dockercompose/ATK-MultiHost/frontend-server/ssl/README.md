# TLS material for the FRONTEND server (10.106.6.228)

Drop two files in this directory before `docker compose up`:

```
fullchain.pem   # server cert + intermediate chain
privkey.pem     # matching private key (PEM, unencrypted)
```

The certificate must be valid for:

- `autonomousitopstoolkitdev.familydollar.com`

A wildcard (`*.familydollar.com`) certificate covers this as well, and is the
simplest option since the core server needs one that spans three names anyway.

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
