# Relay administrator guide

[Documentation](README.md) › Administrator guide

This guide is for the people who install and run Relay. For using it, see
[the user guide](user-guide.md); for moving to a new version, see
[the upgrade guide](upgrade-guide.md).

## Install

Relay runs as one container image next to Postgres 18 and Valkey 8 (a Redis-compatible store).
Uploaded files go to S3-compatible storage or a local volume.

### One machine with Docker Compose

1. In the Relay folder (see [getting Relay](README.md#get-relay-running-in-two-minutes)),
   build the image: `docker build -t relay:latest .`
2. In `deploy/compose`, copy `.env.example` to `.env` and fill in every value marked
   "change me". Generate secrets with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Set `RELAY_DOMAIN` to the name people will use, with a DNS record pointing at the machine
   and ports 80 and 443 open. Caddy gets and renews the TLS certificate by itself.
4. Run `docker compose up -d` in `deploy/compose`, open `https://<RELAY_DOMAIN>`, and follow
   the setup wizard to create the workspace and its first owner. The wizard runs only once.

The Relay container runs as a non-root user with a read-only filesystem. It applies database
migrations by itself when it starts, and several instances can start at once safely.

### Kubernetes

The Helm chart in `deploy/helm/relay` runs Relay with your own Postgres, Valkey and S3
storage. Put the secrets (`SECRET_KEY`, `DATABASE_URL`, `VALKEY_URL`, storage and mail
credentials) in the values or an existing secret, and set `ingress.host`. Run at least two
replicas; the chart adds a disruption budget so updates replace them one at a time.

### Settings from the environment

| Variable                                               | Meaning                                                                                                                                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`                                           | The address people use, e.g. `https://chat.example.com`. Links in emails use it.                                                                                                          |
| `SECRET_KEY`                                           | At least 32 characters. Encrypts secrets stored in the database (SMTP passwords, sign-in provider secrets, two-factor seeds). Keep it with your backups: without it those cannot be read. |
| `DATABASE_URL`, `DATABASE_POOL_MAX`                    | Postgres connection, and connections per instance (default 10).                                                                                                                           |
| `VALKEY_URL`, `VALKEY_PREFIX`                          | Valkey connection, and a key prefix if several Relays share one Valkey.                                                                                                                   |
| `STORAGE_DRIVER`                                       | `s3` (with `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) or `local` (with `STORAGE_DIR`; one instance only).                                                 |
| `SMTP_URL`, `MAIL_FROM`                                | Outgoing mail, e.g. `smtp://user:pass@smtp.example.com:587`. Can also be set in the admin console.                                                                                        |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Voice and video through your LiveKit server. Without them, calls are off.                                                                                                                 |
| `METRICS_TOKEN`                                        | Keeps `/metrics` private; Prometheus sends it as a bearer token.                                                                                                                          |
| `LOG_LEVEL`                                            | `info` by default. Logs are JSON on standard output, with cookies and tokens removed.                                                                                                     |
| `LICENSE_SERVER_URL`                                   | Only for testing against another licence server.                                                                                                                                          |
| `RATE_LIMIT_*`                                         | Sign-in, registration and password-reset attempts allowed per address and account.                                                                                                        |

Relay refuses to start with a readable list of any setting that is missing or wrong.

## Run

### Health and monitoring

- `/healthz` answers while the process runs; `/readyz` only when Postgres and Valkey answer.
  Use them for container and load-balancer health checks.
- `/metrics` serves Prometheus metrics: request durations, live connections, messages sent
  and background job runs, plus Node.js process figures. `deploy/grafana/relay-dashboard.json`
  is a ready-made Grafana dashboard for them.
- **Administration → Overview** shows people, rooms, messages and storage use.

### Backups

`pnpm backup <folder>` (from the Relay folder, with Docker available for the Postgres tools) writes the database (a Postgres dump) and every stored file into a
folder, using the same environment variables as the server. Schedule it daily and keep copies
away from the machine.

To restore: stop Relay, create an empty database, run `pnpm restore <folder>` with the new
`DATABASE_URL` and storage settings, then start Relay **with the same `SECRET_KEY`**. The
release checks prove this round trip on every release.

### Licence

Community features need no licence. Enterprise features (message audit, read receipts, guest
management, retention and legal hold, compliance export, engagement, attribute-based room
access, advanced livechat, device policy, data-loss rules) need a subscription or an offline
key: **Administration → License**. See [licensing](licensing.md).

## The admin console

Everyone with the matching permission sees **Administration** in their account menu.

- **People** — invite, create, deactivate and reactivate accounts; reset two-factor sign-in;
  change roles. Deactivated people are signed out everywhere at once.
- **Roles** — the permission matrix. Built-in roles (owner, admin, member, guest, bot,
  livechat agent and livechat manager) can be adjusted, and custom roles added. Moderators are
  set per room, by the room's owner.
- **Rooms** — every room in the workspace, including private ones, to manage or remove.
- **Invitations** — invitation links with an expiry and a use limit.
- **Settings** — workspace name and branding, registration mode (open, invite-only, closed),
  email verification, password policy, mail server (with a test button), message editing and
  retention, file limits, announcement banners, and livechat.
- **Sign-in** — two-factor requirements per role, session limits, and single sign-on with
  OpenID Connect, OAuth 2, SAML and LDAP (with directory sync).
- **Integrations** — bots, incoming and outgoing webhooks, and slash commands.
- **Import** — people from CSV, and a Slack export.
- **Audit log** — every admin and security event, searchable and exportable as CSV.
- Enterprise sections (with a licence): message audit, guests, retention and legal holds,
  compliance exports, engagement, room access by attributes, device policy, data-loss rules.

Every change made there is written to the audit log with who made it.

## Extensions

**Administration → Extensions** lists the extensions installed: the two that ship with Relay
(Polls and GIF search) and any in the folder named by `EXTENSIONS_DIR`. Each card says exactly
what the extension may do; turning it on grants that and nothing more.

Each extension runs in its own sandboxed process: it can read only its own folder, has no
network access, no other programs and no server settings, and gets 64 MB of memory. A call that
takes longer than three seconds is stopped. Anything else (posting, storing its own small amount
of data, or fetching from the web addresses listed in its manifest) it asks Relay for, and Relay
checks it. Extensions never see encrypted rooms. The card shows the last problem if one fails.

An extension is a folder with an `extension.json` (its id, names and descriptions in English
and Dutch, permissions, web hosts, commands, hooks and composer buttons) and a JavaScript
module exporting `onCommand`, `onAction` and `onMessage`. The two samples in
`apps/server/extensions` are the reference. The GIF sample talks to the local GIF stand-in
(`docker compose up -d gifs`); point a copy at a real GIF service to use it in earnest.

## AI assistant and translation

With an Enterprise licence that includes them, two settings under **Settings → Messages**
switch on:

- **The assistant:** a summary button in threads, "What did I miss?" on the home page, and
  reply suggestions for livechat agents. It only ever uses what the person asking may read:
  never deleted messages, encrypted rooms, or internal livechat notes.
- **Translation:** "Translate" in a message's menu, into the reader's language.

Both work through a provider interface. This version ships only a built-in mock provider, which
needs no account and sends nothing anywhere: summaries list who took part and the main points,
and translation swaps a small English–Dutch word list. A real language model or translation
service can be added as another provider without changing the rest.

## Security notes

- Put Relay behind TLS; the compose stack does this for you.
- Keep `SECRET_KEY`, the database and backups together and safe: the key decrypts the
  secrets in the database.
- Private rooms and direct messages can be end-to-end encrypted; the server then stores only
  ciphertext, and search, previews, data-loss rules and calls do not apply to them.
- Use two-factor sign-in for admins (Administration → Sign-in → require it for the admin role).

## Sizing

Relay is one Node.js process per instance, in front of Postgres and Valkey. Instances share
nothing but those two, so you add capacity by adding instances.

### Measured

Measured on 2026-11-24 with `node scripts/release/load-test.ts --users 2000 --rate 50`:

|           |                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Machine   | AMD Ryzen 7 9800X3D (8 cores, 16 threads), 62 GB RAM, Windows 11, Docker Desktop (WSL 2) with its default 2 GB memory limit |
| Layout    | 2 Relay instances, 1 Postgres 18, 1 Valkey 8, and k6, all containers on that machine                                        |
| Load      | 2,000 signed-in people, each with a live connection, in rooms of 20, for 60 seconds                                         |
| Messages  | 2,573 sent (51.5 per second), each delivered live to 20 people: 51,460 deliveries                                           |
| Result    | 0 failed requests, 0 failed connections, 0 lost deliveries                                                                  |
| Send time | median 12 ms, 95th percentile 18 ms, 99th percentile 27 ms, slowest 50 ms                                                   |
| Peak use  | each Relay instance under half a core and below 280 MB; Postgres 0.7 cores and 162 MB; Valkey 0.2 cores and 23 MB           |

The smoke test that runs in `pnpm verify:release` uses the same setup with 200 people and
10 messages a second, and passes only with zero errors and zero lost messages.

The first run of the full profile found one bottleneck: every change in someone's online
status was sent to everyone separately, so 2,000 people coming online meant about two million
events, and message sends waited up to 14 seconds behind them. Status changes are now
gathered for half a second and sent together.

### Rules of thumb

- **Up to about 500 people:** one machine with 2 cores and 4 GB of memory runs the whole
  `deploy/compose` stack (Relay, Postgres, Valkey and Caddy) comfortably.
- **Up to about 2,000 people:** 2 Relay instances with 1 core and 1 GB each, and Postgres with
  2 cores and 4 GB. Run two instances even when one would do, so restarts and upgrades never
  interrupt anyone (see the rolling-restart check in `pnpm verify:release`).
- **More:** add Relay instances first; they scale out evenly. Postgres is the next limit:
  give it more cores and memory, and raise `DATABASE_POOL_MAX` (connections per instance,
  default 10) so that instances × pool size stays below Postgres's `max_connections`.
- Voice and video use LiveKit, which is sized separately (see LiveKit's own guidance).
- Files live in S3-compatible storage (or a local volume); plan storage for your uploads.

These figures come from one machine and synthetic traffic. Real use has more reads, searches
and file uploads, so keep headroom and watch the dashboards in `deploy/grafana`.
