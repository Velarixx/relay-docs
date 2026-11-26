# Security and data flows

[Documentation](README.md) › Security

How Relay protects what is stored in it, every connection it makes to the outside world and how
to switch each one off, and how to run it without internet access.

## What Relay connects to

Relay talks only to the services you configure. Apart from Postgres and Valkey, which it
always needs, every connection below is either off by default or only happens after an admin
sets it up. The web app and the livechat window load nothing from other sites: no fonts, CDNs,
analytics or avatar services, and their content security policy forbids it.

### Your own services

| Connection          | Goes to                                              | What it carries                                              | Off by                               |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| Database and store  | `DATABASE_URL`, `DATABASE_REPLICA_URL`, `VALKEY_URL` | Everything                                                   | Always needed                        |
| File storage        | `S3_ENDPOINT` when `STORAGE_DRIVER=s3`               | Uploaded files, recordings, exports                          | `STORAGE_DRIVER=local` (the default) |
| Mail                | `SMTP_URL`, or **Settings → Email**                  | Invitations, resets, notification mail with message excerpts | Leaving both empty                   |
| Calls               | `LIVEKIT_URL` / `LIVEKIT_API_URL`                    | Call set-up; recordings receive the storage credentials      | Leaving the LiveKit settings empty   |
| Search (Enterprise) | `OPENSEARCH_URL`                                     | Message text (never of encrypted rooms)                      | Leaving it empty: built-in search    |

### Connections an admin sets up

| Connection                                      | Goes to                                      | What it carries                                                         | Where to switch it off                                    |
| ----------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Single sign-on (OIDC, OAuth 2.0)                | The provider's addresses                     | Sign-in codes and the client secret                                     | **Administration → Sign-in**                              |
| LDAP                                            | The directory's address                      | The bind account, people's passwords at sign-in; a sync every 5 minutes | **Administration → Sign-in**                              |
| Outgoing webhooks, slash commands, card buttons | The address set per integration              | The event, signed; never direct messages or livechat                    | **Administration → Integrations**                         |
| Workflow webhook steps                          | The address in the workflow                  | The run, the step and who completed it                                  | Edit the workflow                                         |
| Extensions                                      | The hosts each extension declares            | What the extension sends                                                | **Administration → Extensions** (all off by default)      |
| Livechat channels (Enterprise)                  | The WhatsApp, SMS or Telegram API you enter  | Visitors' messages and agents' replies                                  | Remove the channel                                        |
| Livechat email                                  | Your IMAP mailbox, every minute              | The mailbox login                                                       | **Settings → Livechat**                                   |
| AI assistant and translation                    | The model or translation server you enter    | The text people ask about (never of encrypted rooms)                    | **Settings → Assistant and translation** (off by default) |
| Live captions                                   | The speech-to-text server you enter          | Seconds of call audio at a time                                         | Leave its address empty                                   |
| Connected workspaces (Enterprise)               | The other workspace                          | The shared rooms, signed                                                | **Administration → Connected workspaces**                 |
| Audit stream (Enterprise)                       | Your syslog or HTTPS collector, every minute | Audit events, including IP addresses                                    | **Administration → Audit log**                            |
| Scheduled exports (Enterprise)                  | Your SFTP server                             | Message exports                                                         | **Administration → Exports**                              |

### Connections that are on by default

| Connection            | Goes to                                                                       | What it carries                                                                                                                  | How to switch it off                                  |
| --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Link previews         | Web addresses people post, at most three per message                          | A plain request for the page and its image                                                                                       | **Settings → Messages → Show previews of links**      |
| Update check          | relay.velarix.nl, when an admin opens the console, at most every six hours    | Nothing about your workspace                                                                                                     | **Settings → General → Check for new Relay versions** |
| Browser notifications | The push service of each person's browser (Google, Mozilla, Apple, Microsoft) | Encrypted; the sender, room and an excerpt, as **Settings → Messages → What notifications for phones and browsers carry** allows | People decline notifications in their browser         |

### Connections that need you to ask for them

| Connection          | Goes to                                                     | What it carries                                                                                     | When                                                                    |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Licence check-in    | relay.velarix.nl (or `LICENSE_SERVER_URL`), every six hours | The activation key, an installation id, the version and the number of members and guests            | Only while a subscription key is installed; offline keys never check in |
| Extension catalogue | relay.velarix.nl (or `EXTENSION_CATALOGUE_URL`)             | A plain request                                                                                     | Only when an admin opens the catalogue or installs from it              |
| Mobile push         | `PUSH_GATEWAY_URL`, which passes on to Apple and Google     | The device, the sender, room and excerpt as that same setting allows; never text of encrypted rooms | Only when `PUSH_GATEWAY_URL` is set                                     |

### Keeping requests away from your own network

Link previews, webhooks, slash commands, card buttons, workflow steps, extensions, connected
workspaces and browser notifications refuse addresses on private and local networks
(`10.0.0.0/8`, `127.0.0.0/8`, `192.168.0.0/16`, link-local, cloud metadata and their IPv6
equivalents). Relay checks the address it actually connects to, after DNS and after every
redirect, so a public name pointing inside does not get through. To let integrations reach
your own servers, list their names under **Settings → General → Internal hosts integrations may call**;
link previews never reach private addresses.

## Running without internet access

Relay works fully on a network without internet access:

1. Copy the images into your own registry: `relay`, `postgres`, `valkey`, `caddy`, and
   `livekit` for calls. With Helm, set the image repositories in your values.
2. Give Caddy a certificate of your own instead of one from Let's Encrypt, or put Relay behind
   your own reverse proxy ([Install](install.md#behind-a-reverse-proxy-you-already-run)).
3. Install an Enterprise licence as an **offline key** ([Licensing](licensing.md#offline-keys)).
4. Switch off **Show previews of links** and **Check for new Relay versions**, and leave `PUSH_GATEWAY_URL`
   empty. Browsers on the network then get no notifications while Relay is closed.
5. Install extensions from your own folder (`EXTENSIONS_DIR`) instead of the catalogue.

Mail, sign-in, storage, calls and search then use only your own servers.

## How data is protected

### Passwords and sign-in

- Passwords are stored as Argon2id hashes. They are 10 to 256 characters (the minimum is a
  setting), and common, sequential and personal passwords are refused.
- Sign-in attempts are limited per address and per account; see the `RATE_LIMIT_*` settings in
  [Install](install.md#settings-from-the-environment). Relay takes the client address from a
  proxy only on a private network (`TRUST_PROXY`), so the limits cannot be dodged by sending a
  made-up address.
- Two-factor sign-in, single sign-on and session limits are in [Identity](identity.md).

### Sessions and requests

- The session cookie is `HttpOnly`, `SameSite=Lax` and `Secure` when Relay runs on HTTPS. It
  lasts until the browser closes, or 30 days with "remember me"; admins can set an idle limit
  and a maximum age under **Settings → Accounts**.
- Requests that change something must carry a header a foreign site cannot send, which stops
  cross-site request forgery. API tokens are separate from cookies.
- Session and API tokens are stored only as hashes.
- Every page is sent with a strict content security policy, `X-Frame-Options: DENY`,
  `nosniff`, a same-origin opener and resource policy, and HSTS for a year on HTTPS. The
  livechat window may be framed only by the sites you list.

### Secrets in the database

Mail and directory passwords, sign-in provider secrets, two-factor seeds, webhook secrets,
channel tokens, the licence key and other secrets are encrypted with AES-256-GCM, under a key
derived from `SECRET_KEY`. Keep `SECRET_KEY` apart from your backups: a stolen backup without
it does not reveal them, and a restore without it cannot read them.

### Files

- Uploads are limited in size (**Settings → Files → Largest upload**, 50 MB by default) and, if you choose, to
  a list of types. Images are decoded before they are accepted.
- Files open in the browser only for safe types such as images, video, audio and PDF;
  anything else downloads, under a policy that stops it from running in Relay's name.
- Relay does not scan files for viruses. If you need that, scan the storage bucket with your
  own tooling.

### End-to-end encrypted rooms

In an encrypted room, browsers encrypt messages (AES-256-GCM, keys exchanged with P-256) and
the server stores only ciphertext; it refuses plain text. Search, link previews, the
assistant, captions, extensions and connected workspaces never see those messages, and files
cannot be shared in them. The server still knows the room's name, its members and when
messages were sent.

### Logs

Logs are JSON on standard output. Cookies, authorization headers and secrets in addresses
(webhook secrets, tokens and sign-in codes) are removed before writing. Without a mail server,
a development installation logs the mail it would send; a production one logs only that a
message could not be sent.

### Known limits

- Scheduled exports do not yet check the SFTP server's host key; send them over a network you
  trust.
- The keys Relay uses to sign browser and mobile notifications are stored in the database
  unencrypted. They let someone send notifications as your workspace, not read anything.

## Reporting a problem

See [Support](support.md#security-problems).
