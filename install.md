# Installing Relay

[Documentation](README.md) › Install

Relay runs as one container image next to Postgres 18 and Valkey 8 (a Redis-compatible store).
Uploaded files go to S3-compatible storage or a local volume. Voice and video use a LiveKit
server. Pick the way that fits: one machine with Docker Compose, or your Kubernetes cluster.

## What you need

| For                 | One machine (Docker Compose)                        | Kubernetes (Helm)                                    |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Software            | Docker Engine with Compose 2.24 or newer            | a current Kubernetes and Helm 3                      |
| Database and store  | included                                            | your own Postgres 18 and Valkey 8 (or Redis 7)       |
| Files               | a Docker volume, or S3-compatible storage           | S3-compatible storage (any number of replicas)       |
| Network             | a DNS name, ports 80 and 443 open                   | an ingress controller and a TLS certificate          |
| Machine (up to 500) | 2 cores, 4 GB memory, disk for your files           | see [Sizing](sizing.md)                              |
| Calls (optional)    | a second DNS name, ports 7881/tcp and 7882/udp open | a LiveKit server; see [Calls and meetings](calls.md) |
| Mail                | an SMTP server for invitations and password resets  | the same                                             |

## One machine with Docker Compose

1. Get the `deploy` folder (see [getting Relay](README.md#get-relay-running-in-two-minutes)).
   It holds the Compose file, the Helm chart and the Grafana dashboard; Relay itself is
   pulled as an image, `ghcr.io/velarixx/relay`.
2. In `deploy/compose`, copy `.env.example` to `.env` and fill in every value marked
   "change me". Generate each secret with `openssl rand -hex 32`.
3. Set `RELAY_DOMAIN` to the name people will use, with a DNS record pointing at the machine
   and ports 80 and 443 open. Caddy gets and renews the TLS certificate by itself.
4. Set `SMTP_URL` and `MAIL_FROM`, so invitations and password resets reach people.
5. Run `docker compose up -d` in `deploy/compose`, open `https://<RELAY_DOMAIN>`, and follow
   the setup wizard to create the workspace and its first owner. The wizard runs only once.

`RELAY_IMAGE` in `.env` names the version that runs; changing its tag is how you
[upgrade](upgrade-guide.md). With calls, start the stack with `docker compose --profile calls up -d`
instead (see [Calls and meetings](calls.md#calls-with-docker-compose)).

The Relay container runs as a non-root user with a read-only filesystem. It applies database
migrations by itself when it starts, and several instances can start at once safely.

### Settings the Compose file does not list

`docker-compose.yml` passes the common settings from `.env`. Every other setting in the table
below goes in a file `relay.env` next to it, one `NAME=value` per line, for example to keep files
in S3 storage:

```sh
STORAGE_DRIVER=s3
S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
S3_REGION=eu-central-1
S3_BUCKET=relay-files
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
```

Restart with `docker compose up -d` after changing it. `.env`, `relay.env` and `backups` are
listed in the folder's `.gitignore`, so they are not committed by accident.

### Behind a reverse proxy you already run

When another proxy already holds ports 80 and 443, set `HTTP_PORT` and `HTTPS_PORT` in `.env`
to free ports and send the name's traffic there, or remove the `caddy` service and send it to
the `relay` container's port 3000 yourself. The proxy must pass WebSocket upgrades on `/ws`,
allow uploads as large as your file limit, and set `X-Forwarded-Proto: https`.

## Kubernetes

The Helm chart in `deploy/helm/relay` runs Relay with your own Postgres, Valkey and S3
storage. A minimal `my-values.yaml`:

```yaml
image:
  tag: '0.2.0'
publicUrl: https://chat.example.com
replicaCount: 2
existingSecret: relay-secrets # SECRET_KEY, DATABASE_URL, VALKEY_URL, SMTP_URL, S3_ACCESS_KEY, S3_SECRET_KEY
env:
  MAIL_FROM: Relay <relay@example.com>
  STORAGE_DRIVER: s3
  S3_ENDPOINT: https://s3.eu-central-1.amazonaws.com
  S3_REGION: eu-central-1
  S3_BUCKET: relay-files
ingress:
  enabled: true
  className: nginx
  host: chat.example.com
  tls:
    enabled: true
    secretName: relay-tls
```

```sh
kubectl create secret generic relay-secrets \
  --from-literal=SECRET_KEY="$(openssl rand -hex 32)" \
  --from-literal=DATABASE_URL=postgres://relay:...@postgres:5432/relay \
  --from-literal=VALKEY_URL=redis://valkey:6379
helm install relay deploy/helm/relay -f my-values.yaml
```

Run at least two replicas; the chart adds a disruption budget so updates replace them one at a
time. Any setting from the table below can go under `env` (plain) or in the secret (sensitive).
For more than one replica, files must be in S3 storage. See
[High availability](high-availability.md) for a layout without single points of failure.

## Settings from the environment

| Variable                                                                                                                                                                           | Meaning                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`                                                                                                                                                                       | The address people use, e.g. `https://chat.example.com`. Links in emails use it.                                                                                                                                                         |
| `SECRET_KEY`                                                                                                                                                                       | At least 32 characters. Encrypts secrets stored in the database (SMTP passwords, sign-in provider secrets, two-factor seeds). Keep it with your backups: without it those cannot be read.                                                |
| `DATABASE_URL`, `DATABASE_POOL_MAX`                                                                                                                                                | Postgres connection, and connections per instance (default 10).                                                                                                                                                                          |
| `DATABASE_REPLICA_URL`                                                                                                                                                             | A streaming read replica of the database. History and search read from it; each person reads from the primary until the replica has caught up with their own latest change, and from the primary alone while the replica is unreachable. |
| `OPENSEARCH_URL`, `OPENSEARCH_INDEX`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`                                                                                                 | OpenSearch as the search provider (Enterprise); see [Search](operate.md#search).                                                                                                                                                         |
| `VALKEY_URL`, `VALKEY_PREFIX`                                                                                                                                                      | Valkey connection, and a key prefix if several Relays share one Valkey.                                                                                                                                                                  |
| `STORAGE_DRIVER`                                                                                                                                                                   | `s3` (with `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) or `local` (with `STORAGE_DIR`; one instance only).                                                                                                |
| `SMTP_URL`, `MAIL_FROM`                                                                                                                                                            | Outgoing mail, e.g. `smtp://user:pass@smtp.example.com:587`. Can also be set in the admin console.                                                                                                                                       |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`                                                                                                                             | Voice and video through your LiveKit server. Without them, calls are off.                                                                                                                                                                |
| `LIVEKIT_API_URL`                                                                                                                                                                  | How Relay itself reaches LiveKit's API, when that differs from `LIVEKIT_URL` (for example `http://livekit:7880` inside Docker).                                                                                                          |
| `LIVEKIT_RECORDING_S3_ENDPOINT`                                                                                                                                                    | Where LiveKit Egress reaches your bucket, when that differs from `S3_ENDPOINT` (for example inside Docker).                                                                                                                              |
| `FILE_TEXT_MAX_MB`, `FILE_TEXT_SECONDS`                                                                                                                                            | Text in PDF, office and plain-text files is searchable up to this size (25) and read within this time (20).                                                                                                                              |
| `METRICS_TOKEN`                                                                                                                                                                    | Keeps `/metrics` private; Prometheus sends it as a bearer token.                                                                                                                                                                         |
| `WS_MAX_BACKLOG_KB`                                                                                                                                                                | A live connection whose unsent events pass this size (1024 KB) is dropped; the browser reconnects and catches up.                                                                                                                        |
| `TRUST_PROXY`                                                                                                                                                                      | Which proxies may say where a request came from. Private networks by default (`loopback,linklocal,uniquelocal`); a comma-separated list of addresses and ranges, or `false` when nothing sits in front of Relay.                         |
| `LOG_LEVEL`                                                                                                                                                                        | `info` by default. Logs are JSON on standard output, with cookies, tokens and secrets in addresses removed.                                                                                                                              |
| `PUSH_GATEWAY_URL`                                                                                                                                                                 | The vendor's push gateway, for notifications in closed mobile apps. Without it there are none; see [Apps](apps.md).                                                                                                                      |
| `EXTENSIONS_DIR`                                                                                                                                                                   | A folder of extensions of your own, each in its own folder. See [Extensions](operate.md#extensions).                                                                                                                                     |
| `EXTENSIONS_CACHE_DIR`                                                                                                                                                             | Where each instance unpacks the extensions installed from the catalogue; `/data/extensions` in the image.                                                                                                                                |
| `NETWORK_RULES_RESET`                                                                                                                                                              | `true` clears every network rule at start, for an owner locked out by them; remove it afterwards.                                                                                                                                        |
| `RATE_LIMIT_LOGIN_PER_IP`, `RATE_LIMIT_LOGIN_PER_ACCOUNT`, `RATE_LIMIT_REGISTER_PER_IP`, `RATE_LIMIT_RESET_PER_IP`, `RATE_LIMIT_RESET_PER_EMAIL`, `RATE_LIMIT_TWO_FACTOR_ATTEMPTS` | How many sign-in, registration, password-reset and two-factor attempts are allowed per address, account or email before Relay asks people to wait (30, 10, 20, 10, 3 and 5).                                                             |

Relay refuses to start with a readable list of any setting that is missing or wrong.

Next: work through the [production checklist](production-checklist.md) before people rely on it.
