# Operating Relay

[Documentation](README.md) › Operate

Day-to-day running of a Relay server: health checks and monitoring, backups, new versions, the
admin console, extensions and search.

## Health and monitoring

- `/healthz` answers while the process runs; `/readyz` only when Postgres and Valkey answer.
  Use them for container and load-balancer health checks.
- `/metrics` serves Prometheus metrics: request durations, live connections, messages sent
  and background job runs, plus Node.js process figures. `deploy/grafana/relay-dashboard.json`
  is a ready-made Grafana dashboard for them. Set `METRICS_TOKEN` to keep it private.
- **Administration → Overview** shows people, rooms, messages and storage use.
- Logs are JSON on standard output, one line per request or event, with cookies and tokens
  removed. `LOG_LEVEL=debug` shows more while you look into a problem.

## Backups

A backup is a folder holding the database (a Postgres dump), every stored file and a small
manifest. Schedule one daily and keep copies away from the machine. A backup is only useful
together with your `SECRET_KEY`, which decrypts the secrets stored in the database.

**With Docker Compose**, in `deploy/compose`:

```sh
docker compose run --rm backup
```

This writes a new folder, named after the time, under `backups` (or the folder named by
`BACKUP_DIR` in `.env`). From a scheduled job, which has no terminal, add `-T`. A daily backup
at 03:00 with cron, keeping fourteen days:

```sh
0 3 * * * cd /srv/relay/deploy/compose && docker compose run --rm -T backup && find backups -mindepth 1 -maxdepth 1 -mtime +14 -exec rm -rf {} +
```

Copy the `backups` folder somewhere else as well (another machine, object storage); a backup
on the same disk does not survive the disk. To put a backup back, on the same machine or a new
one:

```sh
docker compose stop relay
docker compose run --rm restore <folder name>
docker compose up -d
```

Restoring empties the database first and then loads the backup, and replaces the stored files
with the backup's, so nothing newer survives. The `.env` must carry **the same `SECRET_KEY`**
as when the backup was made.

**On Kubernetes**, Relay keeps everything in your Postgres database and your S3 bucket; see
[High availability and disaster recovery](high-availability.md#backups-on-kubernetes).

Every release is checked by wiping a workspace and restoring it from a backup.

## New versions

The admin console's overview says when a newer Relay has been released. To know, Relay asks
the vendor's site which version is newest; the question carries nothing about your server, not
even the version it runs. Switch it off under **Administration → Settings → General** if your
server should not make that request. Moving to a new version is described in the
[upgrade guide](upgrade-guide.md); what changed is in the [release notes](release-notes.md).

## Licence

Community features need no licence. Enterprise features need a subscription or an offline key,
entered under **Administration → License**. What each edition includes is listed under
[Editions](editions.md); keys, seats and renewals are described in [licensing](licensing.md).

## The admin console

Everyone with the matching permission sees **Administration** in their account menu.

- **People** — invite, create, deactivate and reactivate accounts; reset two-factor sign-in;
  change roles. Deactivated people are signed out everywhere at once.
- **Roles** — the permission matrix. Built-in roles (owner, admin, member, guest, bot,
  livechat agent and livechat manager) can be adjusted, and custom roles added. Moderators are
  set per room, by the room's owner. Two permissions are worth knowing: **groups.manage** lets
  people create user groups such as @design, and **message.urgent** lets them send urgent
  messages, which remind people until acknowledged (both given to admins at first).
- **Rooms** — every room in the workspace, including private ones, to manage or remove.
- **Invitations** — invitation links with an expiry and a use limit.
- **Settings** — workspace name and branding, registration mode (open, invite-only, closed),
  email verification, password policy, mail server (with a test button), message editing and
  retention, file limits, announcement banners, and livechat.
- **Sign-in** — two-factor requirements per role, session limits, and single sign-on; see
  [Identity](identity.md).
- **Integrations** — bots, incoming and outgoing webhooks, and slash commands; see the
  [API guide](api-guide.md).
- **Profile fields** — fields every profile can show (text, a choice from a list, or a link),
  optionally searchable in the directory and optionally filled at each sign-in from a claim,
  SAML attribute or LDAP attribute.
- **Import** — people from CSV, a Mattermost or Slack export, or the Relay import format; each
  can be tried first without changing anything (see [Importing data](import-format.md)).
- **Audit log** — every admin and security event, searchable and exportable as CSV.
- Enterprise sections (with a licence): see [Editions](editions.md).

Every change made there is written to the audit log with who made it.

## Extensions

**Administration → Extensions** lists the extensions installed: those that ship with Relay
(GitHub, GitLab, Jira, web feeds, alerts, calendars, mail to room, polls and GIF search), those
installed from the catalogue, and any in the folder named by `EXTENSIONS_DIR`. Each card says
exactly what the extension may do; turning it on grants that and nothing more. Settings an
extension needs, such as the address of your Jira or a shared secret, are filled in on its card;
secrets are stored encrypted and never shown again. Extensions that receive calls from another
system show the web address to give that system.

Each extension runs in its own sandboxed process: it can read only its own folder, has no
network access, no other programs and no server settings, and gets 64 MB of memory. A call that
takes longer than three seconds is stopped. Anything else (posting, storing its own small amount
of data, or fetching from the web addresses it is allowed) it asks Relay for, and Relay checks
it. Extensions never see encrypted rooms. The card shows the last problem if one fails.

### The catalogue

The **Catalogue** at the top of the page lists the extensions the Relay team publishes, with
their versions and what each may do. **Install** downloads the extension's bundle and checks its
signature against the key built into Relay; a bundle that is unsigned or was changed is refused.
When a later version is published, its row offers **Update to …**; nothing is updated until an
admin chooses to. In a cluster every server picks up an installed extension within a minute.

On a server without internet access, download the bundle from the extensions page of the Relay
website and choose it under **Upload a bundle**; it is checked the same way.

### Mail to room

The mail extension gives a room an email address (`/mail address`). Your mail server hands
the mail for that domain to Relay with `deploy/mail-to-room/relay-mail.mjs`, which comes with
these guides; its first lines show a Postfix example. Fill in the domain and a token on the
extension's card, and give the script the card's web address and the same token.

To write an extension of your own, see [Writing an extension](extension-guide.md).

## Search

Out of the box, search runs in Postgres and needs nothing else. It finds words in messages and
in the text of attached PDF, office, OpenDocument and plain-text files, for people who may
read the room; never in encrypted rooms.

Large workspaces can hand search to **OpenSearch** (Enterprise). Set `OPENSEARCH_URL` (and
`OPENSEARCH_USERNAME` and `OPENSEARCH_PASSWORD` if the cluster wants them), restart, and
under **Administration → Search** choose **Rebuild the index**: it copies every message people
may search into the index named by `OPENSEARCH_INDEX` (`relay-messages`) and shows how far
it has got. From then on every new, edited or deleted message is updated in the index within
moments. Relay still decides who may read what on every search, and checks every hit against
the database before showing it, so the index never widens anyone's access.

If the cluster cannot be reached, searches are answered by the built-in search instead, and a
notice across the admin console says since when. Searches go back to OpenSearch by themselves
once it answers again; rebuild the index if it was down for a long time.
