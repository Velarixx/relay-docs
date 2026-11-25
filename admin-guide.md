# Relay administrator guide

[Documentation](README.md) › Administrator guide

This guide is for the people who install and run Relay. For using it, see
[the user guide](user-guide.md); for moving to a new version, see
[the upgrade guide](upgrade-guide.md).

## Install

Relay runs as one container image next to Postgres 18 and Valkey 8 (a Redis-compatible store).
Uploaded files go to S3-compatible storage or a local volume.

### One machine with Docker Compose

1. Get the `deploy` folder (see [getting Relay](README.md#get-relay-running-in-two-minutes)).
   It holds the Compose file, the Helm chart and the Grafana dashboard; Relay itself is
   pulled as an image, `ghcr.io/velarixx/relay`.
2. In `deploy/compose`, copy `.env.example` to `.env` and fill in every value marked
   "change me". Generate secrets with `openssl rand -hex 32`.
3. Set `RELAY_DOMAIN` to the name people will use, with a DNS record pointing at the machine
   and ports 80 and 443 open. Caddy gets and renews the TLS certificate by itself.
4. Run `docker compose up -d` in `deploy/compose`, open `https://<RELAY_DOMAIN>`, and follow
   the setup wizard to create the workspace and its first owner. The wizard runs only once.

`RELAY_IMAGE` in `.env` names the version that runs; changing its tag is how you upgrade.

The Relay container runs as a non-root user with a read-only filesystem. It applies database
migrations by itself when it starts, and several instances can start at once safely.

### Kubernetes

The Helm chart in `deploy/helm/relay` runs Relay with your own Postgres, Valkey and S3
storage. Put the secrets (`SECRET_KEY`, `DATABASE_URL`, `VALKEY_URL`, storage and mail
credentials) in the values or an existing secret, and set `ingress.host`. Run at least two
replicas; the chart adds a disruption budget so updates replace them one at a time.

```sh
helm install relay deploy/helm/relay -f my-values.yaml
```

### Settings from the environment

| Variable                                                                           | Meaning                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`                                                                       | The address people use, e.g. `https://chat.example.com`. Links in emails use it.                                                                                                                                                         |
| `SECRET_KEY`                                                                       | At least 32 characters. Encrypts secrets stored in the database (SMTP passwords, sign-in provider secrets, two-factor seeds). Keep it with your backups: without it those cannot be read.                                                |
| `DATABASE_URL`, `DATABASE_POOL_MAX`                                                | Postgres connection, and connections per instance (default 10).                                                                                                                                                                          |
| `DATABASE_REPLICA_URL`                                                             | A streaming read replica of the database. History and search read from it; each person reads from the primary until the replica has caught up with their own latest change, and from the primary alone while the replica is unreachable. |
| `OPENSEARCH_URL`, `OPENSEARCH_INDEX`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` | OpenSearch as the search provider (Enterprise); see Search below.                                                                                                                                                                        |
| `VALKEY_URL`, `VALKEY_PREFIX`                                                      | Valkey connection, and a key prefix if several Relays share one Valkey.                                                                                                                                                                  |
| `STORAGE_DRIVER`                                                                   | `s3` (with `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) or `local` (with `STORAGE_DIR`; one instance only).                                                                                                |
| `SMTP_URL`, `MAIL_FROM`                                                            | Outgoing mail, e.g. `smtp://user:pass@smtp.example.com:587`. Can also be set in the admin console.                                                                                                                                       |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`                             | Voice and video through your LiveKit server. Without them, calls are off.                                                                                                                                                                |
| `LIVEKIT_RECORDING_S3_ENDPOINT`                                                    | Where LiveKit Egress reaches your bucket, when that differs from `S3_ENDPOINT` (for example inside Docker).                                                                                                                              |
| `FILE_TEXT_MAX_MB`, `FILE_TEXT_SECONDS`                                            | Text in PDF, office and plain-text files is searchable up to this size (25) and read within this time (20).                                                                                                                              |
| `METRICS_TOKEN`                                                                    | Keeps `/metrics` private; Prometheus sends it as a bearer token.                                                                                                                                                                         |
| `WS_MAX_BACKLOG_KB`                                                                | A live connection whose unsent events pass this size (1024 KB) is dropped; the browser reconnects and catches up.                                                                                                                        |
| `LOG_LEVEL`                                                                        | `info` by default. Logs are JSON on standard output, with cookies and tokens removed.                                                                                                                                                    |
| `LICENSE_SERVER_URL`                                                               | Only for testing against another licence server.                                                                                                                                                                                         |
| `PUSH_GATEWAY_URL`                                                                 | The vendor's push gateway, for notifications in closed mobile apps. Without it there are none; see Mobile apps.                                                                                                                          |
| `EXTENSIONS_DIR`                                                                   | A folder of extensions of your own, each in its own folder. See Extensions.                                                                                                                                                              |
| `EXTENSION_CATALOGUE_URL`                                                          | Only for testing against another extension catalogue.                                                                                                                                                                                    |
| `EXTENSIONS_CACHE_DIR`                                                             | Where each instance unpacks the extensions installed from the catalogue; `/data/extensions` in the image.                                                                                                                                |
| `NETWORK_RULES_RESET`                                                              | `true` clears every network rule at start, for an owner locked out by them; remove it afterwards.                                                                                                                                        |
| `RATE_LIMIT_*`                                                                     | Sign-in, registration and password-reset attempts allowed per address and account.                                                                                                                                                       |

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

A backup is a folder holding the database (a Postgres dump), every stored file and a small
manifest. Schedule one daily and keep copies away from the machine. A backup is only useful
together with your `SECRET_KEY`, which decrypts the secrets stored in the database.

**With Docker Compose**, in `deploy/compose`:

```sh
docker compose run --rm backup
```

This writes a new folder, named after the time, under `backups` (or the folder named by
`BACKUP_DIR` in `.env`). From a scheduled job, which has no terminal, add `-T`:
`docker compose run --rm -T backup`. To put a backup back, on the same machine or a new one:

```sh
docker compose stop relay
docker compose run --rm restore <folder name>
docker compose up -d
```

Restoring replaces the database and the stored files with the backup's, so the `.env` must
carry **the same `SECRET_KEY`** as when the backup was made.

**On Kubernetes**, Relay keeps everything in your Postgres database and your S3 bucket. Back
both up with the tools you already use for them (for example `pg_dump` or your database
service's snapshots, and bucket versioning or replication), taken close together.

Every release is checked by wiping a workspace and restoring it from a backup.

### New versions

The admin console's overview says when a newer Relay has been released. To know, Relay asks
the vendor's site which version is newest; the question carries nothing about your server, not
even the version it runs. Switch it off under **Administration → Settings → General** if your
server should not make that request. Moving to a new version is described in the
[upgrade guide](upgrade-guide.md).

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
  set per room, by the room's owner. Two permissions are worth knowing: **groups.manage** lets
  people create user groups such as @design, and **message.urgent** lets them send urgent
  messages, which remind people until acknowledged (both given to admins at first).
- **Rooms** — every room in the workspace, including private ones, to manage or remove.
- **Invitations** — invitation links with an expiry and a use limit.
- **Settings** — workspace name and branding, registration mode (open, invite-only, closed),
  email verification, password policy, mail server (with a test button), message editing and
  retention, file limits, announcement banners, and livechat.
- **Sign-in** — two-factor requirements per role, session limits, and single sign-on with
  OpenID Connect, OAuth 2, SAML and LDAP (with directory sync).
- **Integrations** — bots, incoming and outgoing webhooks, and slash commands.
- **Profile fields** — fields every profile can show (text, a choice from a list, or a link),
  optionally searchable in the directory and optionally filled at each sign-in from a claim,
  SAML attribute or LDAP attribute.
- **Import** — people from CSV, a Mattermost or Slack export, or the Relay import format; each
  can be tried first without changing anything (see [Importing data](import-format.md)).
- **Audit log** — every admin and security event, searchable and exportable as CSV.
- Enterprise sections (with a licence): message audit, guests, retention and legal holds,
  compliance exports, engagement, room access by attributes, device policy, data-loss rules.

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
website and choose it under **Upload a bundle**; it is checked the same way. The catalogue is
read from the licence server (`LICENSE_SERVER_URL`) unless `EXTENSION_CATALOGUE_URL` names
another.

### Mail to room

The mail extension gives a room an email address (`/mail address`). Your mail server hands
the mail for that domain to Relay with `deploy/mail-to-room/relay-mail.mjs`, which comes with
these guides; its first lines show a Postfix example. Fill in the domain and a token on the
extension's card, and give the script the card's web address and the same token.

To write an extension of your own, see [Writing an extension](extension-guide.md).

## Mobile apps and push notifications

People install Relay for Android or for iPhone and iPad and enter this server's address. The
app shows this server's own web client, so there is nothing extra to install or upgrade on the
server, and the app needs to reach the server over HTTPS with a certificate their devices trust.

**Notifications while the app is closed** travel from your server to the vendor's push gateway
and from there to Apple's or Google's push service, because those services only take
notifications from the app's publisher. Set the gateway's address to switch this on:

```
PUSH_GATEWAY_URL=https://<the gateway's address>
```

- Your server registers itself with the gateway the first time it has something to send, with
  a key it creates for itself. No account or licence is involved.
- The gateway stores nothing of what it passes on. What Apple and Google see is up to you:
  **Settings → Messages → What notifications for the mobile apps carry** chooses between the
  message text, only who wrote, and only that there is something new (no sender, room or
  text; the person sees the message once they open the app). Text from encrypted rooms is never sent, whatever this says.
- A notification is sent for a mention, a direct message or an incoming call, and only to
  someone with no Relay open anywhere. Do not disturb and room settings are respected.
- Without `PUSH_GATEWAY_URL`, or when the gateway cannot be reached, Relay works in full.
  Only the notifications for closed mobile apps are missing; open apps, browsers, the desktop
  app and email are not affected.

**Devices.** Each person sees the phones they are signed in on under **Settings → Security**
and can sign one out. With the Enterprise device policy, **Administration → Device policy**
lists every phone and tablet with its platform and app version, and can sign any of them out;
it can also require the app lock, block screenshots and refuse rooted or jailbroken devices
(see the [device policy](device-policy.md)).

**Managed devices.** Device management software can set the server address for the app
through managed app configuration: the key is `serverUrl` and the value your server's address.
The app then connects without asking.

## AI assistant and translation

With an Enterprise licence that includes them, two settings under **Settings → Messages**
switch on:

- **The assistant:** a summary button in threads, "What did I miss?" and **Ask** on the home
  page, and
  reply suggestions for livechat agents. It only ever uses what the person asking may read:
  never deleted messages, encrypted rooms, or internal livechat notes.
- **Translation:** "Translate" in a message's menu, into the reader's language.

Who does the work is set under **Settings → Assistant and translation**:

- **Built in** (the default) needs no account and sends nothing anywhere: summaries list who
  took part and the main points, and translation swaps a small English–Dutch word list. It is
  there to try the features, not to rely on.
- **A language model.** Give the address of any server that speaks the OpenAI-compatible API,
  up to and including `/v1`, the model's name, and a key if the server wants one. That covers
  models you host yourself (for example `http://ollama:11434/v1`) as well as hosted services.
  The same model can do the translating.
- **A translation service** that speaks the LibreTranslate API, which you can also host
  yourself.

Keys are stored encrypted and never shown again. When an outside service is chosen, people see
which host their text is sent to, next to the button that sends it, and the settings page lists
how many requests went out each day and how many tokens they used. If the service does not
answer, the person asking gets an error and nothing else is affected.

With an Enterprise licence there is more under the same settings:

- **Further language models**, asked in the order you set when the model above does not answer.
  Each has its own address, model and key.
- **A model per feature**: Ask, summaries, reply suggestions, translation and agents can each
  use a different model of the main provider; empty means the main model.
- **Monthly limits** in tokens per person and per agent. Once someone has used theirs, the
  assistant tells them so until the next month. The settings page shows this month's use per
  person and per agent.
- **Keep prompts and answers** (off by default). While it is on, the last hundred prompts and
  answers can be read on the settings page; while it is off, nothing is kept.

### Customer conversations

With the assistant on (Enterprise), a customer conversation gets two things when it closes:
a short summary that only agents see, next to the agent's own closing note, and the livechat
tags it is about, chosen from the tags managers allow. Only what the customer saw is used;
internal notes are left out. The customer never receives the summary.

### Agents

**Administration → Agents** (Enterprise) defines agents: bots with instructions that answer
when someone mentions them in a room they serve, in a thread under the question. Give each a
username, a name, instructions, the rooms it serves and the tools it may use: search, reading
a thread, posting, setting a reminder and ticking off a workflow task.

Every tool runs with the permissions of the person who asked, so an agent never finds or does
more than they could themselves, and each use is recorded with who asked, what it touched and
whether it was allowed (the text involved is not recorded). An agent needs a language model
(see above); its use counts towards both its own and the asker's monthly limits. Agents never
answer bots, including each other, and never serve encrypted rooms. A workflow task with a slash
command that an agent ticks off leaves the command for a person.

## Connected workspaces

Two Relay servers can be connected so they can share rooms (Enterprise, on both servers).
Under **Administration → Connected workspaces**, one admin makes an invitation code and gives it
to the other server's admin, who pastes it under **Connect with a code**. The code works once,
for 24 hours. Both sides then list the other by its workspace name and address; **Check** shows
whether it answers, and either side can **End connection** at any time.

To share a room, pick it and the server under **Shared rooms** and choose **Share**. The other
server's admin sees the offer there and chooses **Accept**: that makes a private room on their
side, with them as its owner, and they invite their own people as usual. The room's recent
messages come along. From then on messages and thread replies appear on both sides as they are
sent, and people from the other side carry their workspace's name next to theirs. Edits,
deletions and reactions cross as well; people can only change their own messages, on either side. Files
posted in the room are copied to the other server, within that server's own size limit.

The server that shared the room keeps its order: what people on the other side write goes to it
first and appears for everyone once it has a place, so both sides always show the same messages
in the same order. If that server cannot be reached, people on the other side are told to try
again later and nothing is lost; messages it holds for a server that was down are delivered when
it is back, in order and once. Each side keeps its own members, permissions, data-loss rules,
retention and audit log; only the shared room's messages and the names of the people who wrote
them cross, never email addresses or member lists. People from the other side are not accounts
here: they cannot sign in, are not in the directory and do not take a seat.

When a connection ends, from either side, every room it shared stays on both servers as an
ordinary room with everything said so far, and says that it is no longer shared; nothing more
is exchanged. After connecting again, a room can be shared again; the other side then gets a
new room for it. A retention policy removes old messages only on its own server.

Servers talk to each other directly over HTTPS at their public addresses, so each must be able
to reach the other. Every request between them is signed with the sending server's own key and
is accepted only once and only within a few minutes; a server that is not connected, or whose
connection has ended, is refused. A server on a private network can be connected when its host
is listed in **Settings → Integrations → Allowed hosts**.

## Customer messaging channels

Besides the chat on your website and email, livechat can take customers in from WhatsApp, text
messages (SMS) and a Telegram bot (Enterprise). Every channel feeds the same queue, with the
same routing, departments and reports; agents answer in the conversation as usual, and their
text, pictures and files go back out on the channel the customer used.

Connect a channel under **Livechat → Departments and agents → Messaging channels**:

- **WhatsApp** (the business API): the service address (`https://graph.facebook.com/v19.0`),
  the phone number ID and business account ID, an access token, the app secret (Relay checks
  every delivery against it) and a verify token you choose. Then, in WhatsApp's settings, set
  the webhook to the address Relay shows, with that verify token. WhatsApp allows free replies
  for 24 hours after the customer's last message; after that, agents see a notice and can send
  one of your approved templates instead, filling in its values.
- **SMS** through a gateway that speaks the widely used Twilio-style API: its address, your
  account ID, the sending number and the auth token. Point the gateway's incoming-message
  webhook at the address Relay shows; Relay checks its signature on every delivery.
- **Telegram:** `https://api.telegram.org` and the bot's token. Relay sets the bot's webhook
  itself, with a secret it checks on every delivery.

Tokens are stored encrypted and never shown again. A delivery that is not signed by the
service is refused, and a message delivered twice is taken in once. Files agents send are
fetched by the service from a link that works for one day. When an answer cannot be delivered,
the conversation says so. Choose a department per channel to route its conversations there.

### Routing

Departments that assign conversations automatically (round-robin or least busy) also:

- give a **returning customer** the agent who helped them last, when that agent is available
  and has room (**Settings → Livechat → Give returning customers the agent who helped them
  last**);
- route by **skill**: give agents skills in the agents list, such as `billing` or a language
  as `lang:nl`, and a department the skills its conversations need. The widget passes the
  visitor's language as `lang:xx`. A skill only narrows the choice when at least one agent in
  the department has it, so a customer is never left waiting for a skill nobody was given.

**Opening hours** can be set per department under its settings; a department without hours of
its own follows the general ones, and the widget shows closed departments as closed. **Queue
limit:** with **Customers waiting before the widget offers the offline form** set, new visitors
can leave a message instead of joining a long queue. **Closing after a silence:** set how many
minutes without a message close a conversation, and the message the customer then gets; waiting
customers are never closed this way.

### Recognised visitors

When your website knows who a visitor is (they are signed in there), it can tell the widget, so
they are not asked their name and email and their conversations join one contact. Set
**Settings → Livechat → Identity secret** to a long random value that only your website and
Relay know. Your website then puts a token on the widget's script tag:

```html
<script src="https://chat.example.com/widget/loader.js" data-identity="TOKEN" async></script>
```

The token is `PAYLOAD.SIGNATURE`: `PAYLOAD` is the base64url of a JSON object with `id`
(the customer's id in your system), `name`, `email` and `exp` (expiry in Unix seconds, at most
seven days ahead), and `SIGNATURE` is the base64url HMAC-SHA256 of the `PAYLOAD` text with the
secret. Make it on your server for each page; never put the secret in the page. A token that is
unsigned, altered, expired or signed with another secret is ignored, and the visitor is asked
who they are as usual.

### Bots that answer first

Under **Livechat → Departments and agents → Bot first** you choose who replies to new
conversations before people do:

- **The answers bot**, built in: it answers from the questions and replies you write there,
  when most of the words of one of your questions appear in what the customer wrote. When it has
  no reply, or the customer asks for a person, it says it is finding someone and hands the
  conversation to the queue with a note saying what it could not answer.
- **A bot account of your own** (see Integrations): it holds new conversations, hears each
  customer message through an outgoing webhook with the `livechat.message` event, answers with
  its token like any bot, and hands over with
  `POST /api/v1/livechat/conversations/{roomId}/handover` and a `note` for the agent.

Once a conversation has been handed over, no bot answers it again.

### Contact fields and merging

Under **Livechat → Departments and agents → Contact fields**, managers add fields every contact
gets, such as a customer number or a plan: text, a number, a date or a choice from a list. Agents
fill them in on the contact page, and they are checked against their kind. When one customer
has two contacts (say, two email addresses), a manager opens one and merges the other into it:
conversations, channel addresses and details move over, the kept contact's own details win, and
the other contact is removed. Merging is recorded in the audit log.

### Conversation events

Outgoing webhooks can also report customer conversations: `livechat.opened`, `livechat.taken`,
`livechat.closed`, `livechat.rated` and `livechat.message`. Each
carries the conversation: its status, channel, department, agent, contact (name, email, phone)
and score. Customer conversations go only to webhooks set up for the whole workspace with these
events chosen, never to webhooks limited to a room.

### Satisfaction

When a conversation closes, the customer is asked for a score from 1 to 5 and a comment: in the
widget, or with a message on email and messaging channels, where a reply starting with a number
is taken as the score (within a week). Scores appear on the conversation for agents and in
**Livechat → Reports**, on average and per agent and department. Switch it off with
**Settings → Livechat → Ask customers for a score**; **Language for messages to customers**
sets the language of the question on email and channels.

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

## Calls and meetings

Calls run on your LiveKit server (`LIVEKIT_URL` and its keys). Whoever starts a call, and the
room's moderators, can mute or remove people and end it for everyone; anyone can raise a hand or
send a reaction. Meetings planned in a room get a card, a reminder ten minutes before, and an
iCalendar file; a meeting can have a guest link for people without an account, who wait until a
member lets them in. Calls in encrypted rooms are encrypted end to end; they cannot have guests,
recordings or captions.

**Recording** (Enterprise, the `call.record` permission) uses LiveKit Egress, which writes an MP4
straight into Relay's bucket, so it needs the S3 storage driver. Run Egress next to LiveKit
(the compose file has an `egress` service) and give it the same Valkey. Everyone in the call
sees that it is being recorded. When it stops, the file is posted in the room, so it follows
the room's access and retention.

**Captions and transcripts** (Enterprise) need a speech-to-text service that speaks the
OpenAI-compatible `/audio/transcriptions` API, set under **Settings → Assistant and
translation** (address up to and including `/v1`, model, key). It can be one you host
yourself. Anyone in a call can turn captions on; everyone in it then sees "Captions on", and
each person's browser sends a few seconds of their own microphone at a time to Relay, which
passes it to that service. What was said is kept with the call: its record in the room has a
**Transcript** button for whoever may read the room. With the assistant switched on, a summary
of the call is posted in the room when it ends.

### Call quality, firewalls and TURN

**Administration → Calls** lists recent calls with how many people took part, how many tried
and failed to connect, and the packet loss, bitrate and round-trip time their browsers measured
(each browser reports every fifteen seconds). Failed joins and high packet loss are nearly
always the network between people and LiveKit, not Relay.

Sound and picture do not go through Relay. Browsers reach LiveKit directly, so its ports must
be open from wherever people are:

| Port                          | What it carries                                              |
| ----------------------------- | ------------------------------------------------------------ |
| 443 (TCP)                     | LiveKit's signalling, as `wss://` through your reverse proxy |
| 7882 (UDP), or a UDP range    | The media itself; the best path when it is open              |
| 7881 (TCP)                    | Media over TCP when UDP is blocked; slower, but works        |
| 3478 (UDP) and 5349/443 (TLS) | LiveKit's built-in TURN server, for the strictest networks   |

LiveKit must also announce an address people can reach: set `rtc.use_external_ip: true` (it
finds its public address itself), or `rtc.node_ip` to the public IP when it sits behind NAT.
The compose stand-in announces 127.0.0.1, which only works on the same machine.

Some office and hotel networks allow nothing but HTTPS on port 443. For those, switch on
LiveKit's TURN server with TLS on its own domain:

```yaml
turn:
  enabled: true
  domain: turn.example.com # a name that points at LiveKit
  tls_port: 5349 # or 443 when LiveKit has a public IP of its own
  udp_port: 3478
  cert_file: /certs/turn.crt
  key_file: /certs/turn.key
```

LiveKit then offers TURN to browsers by itself; Relay needs no setting for it. After changing
the network, start a test call from outside your network and check **Administration → Calls**:
failed joins should be zero and packet loss a few percent at most.

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

Measured on 2026-11-24 with the release load test:

|           |                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Machine   | AMD Ryzen 7 9800X3D (8 cores, 16 threads), 62 GB RAM, Windows 11, Docker Desktop (WSL 2) with its default 2 GB memory limit |
| Layout    | 2 Relay instances, 1 Postgres 18, 1 Valkey 8, and k6, all containers on that machine                                        |
| Load      | 2,000 signed-in people, each with a live connection, in rooms of 20, for 60 seconds                                         |
| Messages  | 2,573 sent (51.5 per second), each delivered live to 20 people: 51,460 deliveries                                           |
| Result    | 0 failed requests, 0 failed connections, 0 lost deliveries                                                                  |
| Send time | median 12 ms, 95th percentile 18 ms, 99th percentile 27 ms, slowest 50 ms                                                   |
| Peak use  | each Relay instance under half a core and below 280 MB; Postgres 0.7 cores and 162 MB; Valkey 0.2 cores and 23 MB           |

The smoke test that runs before every release uses the same setup with 200 people and
10 messages a second, and passes only with zero errors and zero lost messages.

The 10,000-person profile (150 messages a second, three instances) was run on the same
machine on 2026-11-25. There k6, the load generator, runs out of memory inside Docker's 2 GB
before Relay does: it was killed while opening 10,000 connections, and again at 7,500. The
highest level that ran clean was 5,000:

| 2026-11-25 | 5,000 people, 3 Relay instances                                                      |
| ---------- | ------------------------------------------------------------------------------------ |
| Messages   | 3,657 sent (73 per second), each delivered live to 20 people: 73,140 deliveries      |
| Result     | 0 failed requests, 0 failed connections, 0 lost deliveries                           |
| Send time  | median 50 ms, 95th percentile 627 ms, 99th percentile 938 ms, slowest 1.6 s          |
| Peak use   | each Relay instance about one core and below 240 MB; Postgres 1.9 cores and 249 MB   |
| At 3,000   | 45 messages a second: median 16 ms, 99th percentile 88 ms; Postgres one core at peak |

Postgres is the first limit as the load grows: its CPU doubles from 3,000 to 5,000 people while
each Relay instance stays well within its share, and send times grow with it.

The first run of the full profile found one bottleneck: every change in someone's online
status was sent to everyone separately, so 2,000 people coming online meant about two million
events, and message sends waited up to 14 seconds behind them. Status changes are now
gathered for half a second and sent together.

### Large rooms

A room can hold 10,000 people or more. Measured on 2026-11-25 on the same machine, against one
Relay instance and Postgres 18, with a room of 10,001 members (the test
`large-room.test.ts` prints these numbers every run):

| What                                   | Before                                  | After                                                |
| -------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Member list                            | all 10,001 in one answer: 1.8 MB, 62 ms | 100 per page, under 64 KB, 20 ms; a name search 7 ms |
| Working out who to notify of a message | 185 ms (every member loaded)            | 33 ms (only those who could be told)                 |
| Opening the room, posting, searching   | 4, 11 and 14 ms                         | unchanged                                            |
| People shown typing at once            | no limit                                | 5, across all instances                              |

Online status is sent to everyone in batches every half second whatever the room size, and the
member list asks for the status of the people shown only.

### Layouts

| People      | Relay                                                           | Postgres                              | Valkey           | Measured                                                        |
| ----------- | --------------------------------------------------------------- | ------------------------------------- | ---------------- | --------------------------------------------------------------- |
| Up to 500   | 1 instance on the same machine                                  | same machine; 2 cores and 4 GB in all | same machine     | the release smoke test (200 people)                             |
| Up to 2,000 | 2 instances, 1 core and 1 GB each                               | 2 cores, 4 GB                         | 0.5 core, 256 MB | the 2,000-person run above                                      |
| 10,000      | 3 or more instances, 2 cores and 2 GB each, plus a read replica | 4 cores, 8 GB; the replica the same   | 1 core, 512 MB   | 5,000 ran clean on 3 instances; measure 10,000 on your hardware |

- **Up to about 500 people,** one machine with 2 cores and 4 GB runs the whole `deploy/compose`
  stack (Relay, Postgres, Valkey and Caddy) comfortably.
- **Up to about 2,000,** run two instances even when one would do, so restarts and upgrades
  never interrupt anyone (every release is checked with a rolling restart that loses no
  messages).
- **Towards 10,000,** add Relay instances first; they scale out evenly. Postgres is the next
  limit: give it more cores and memory, and point `DATABASE_REPLICA_URL` at a streaming
  replica so history and search are read there. Rooms of 10,000 stay quick (see Large rooms).
  Before going live, measure on your own hardware with
  `node scripts/release/load-test.ts --users 10000 --rate 150 --instances 3`, which needs
  Docker; the run is not counted clean unless no request fails and every message reaches
  everyone in its room.
- **Very large workspaces** can move search to OpenSearch (Enterprise; see Search).

**Connection pooling.** Each instance keeps up to `DATABASE_POOL_MAX` connections (default 10)
to Postgres, and as many to the replica, plus a few for background jobs. Keep instances × (pool

- 3. well below Postgres's `max_connections`; with many instances, put PgBouncer in session mode
     in front of Postgres rather than raising `max_connections` far past a few hundred.

**Storage.** The database grows with messages (about 1 KB each with their search index) and
the file text kept for search (up to 300,000 characters per file). Files themselves live in
S3-compatible storage or a local volume: plan for your uploads, recordings and exports, which
are usually far larger than the database. Back up both (see Backups).

**Voice and video** use LiveKit, which is sized separately (see LiveKit's own guidance and Call
quality, firewalls and TURN above).

These figures come from one machine and synthetic traffic. Real use has more reads, searches
and file uploads, so keep headroom and watch the dashboards in `deploy/grafana`.
