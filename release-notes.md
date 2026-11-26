# Release notes

[Documentation](README.md) › Release notes

What changed in each version of Relay, newest first. Read the version you are moving to, and
any in between, before you [upgrade](upgrade-guide.md). Anything you must do is under
**Action needed**.

## Next version

Changes on the way to the next release.

- **Enterprise features stop when a licence lapses.** WhatsApp, SMS and Telegram channels no
  longer take messages in or send agents' replies out without a valid licence, and the audit
  stream, scheduled compliance exports and connected-workspace delivery wait until there is one
  again. Nothing is lost: waiting events and messages go out once a licence is back.
- **Calls from the Compose file.** `docker compose --profile calls up -d` runs LiveKit in the
  stack, under a name of its own with a certificate from Caddy
  ([Calls and meetings](calls.md#calls-with-docker-compose)).
- **Any setting with Compose.** Settings the Compose file does not list go in `relay.env`
  ([Install](install.md#settings-the-compose-file-does-not-list)).
- **Restoring a backup empties the database first**, so going back to an earlier version leaves
  nothing a newer one added behind.

**Action needed:** with Docker Compose, take the new `docker-compose.yml` and `.env.example`
from the deploy files; your `.env` keeps working as it is.

## 0.2.0 (25 November 2026)

The first public Community release.

- **Messaging:** channels, private rooms, direct messages, threads, discussions, teams,
  broadcast rooms, mentions and user groups, reactions, custom emoji, pins, bookmarks,
  forwarding, scheduled messages, reminders, message priority with acknowledgement, files with
  previews, voice and video messages, link previews, drafts, and end-to-end encrypted rooms.
- **Calls and meetings** on LiveKit, with screen sharing, host controls, planned meetings and
  guest links.
- **Customer conversations:** the livechat window for your website, email, departments,
  routing, canned responses, transcripts, contacts and reports.
- **Accounts and administration:** single sign-on (OIDC, OAuth 2.0, SAML, LDAP with sync),
  two-factor sign-in, roles and permissions, guests, the audit log, profile fields, imports from
  CSV, Slack, Mattermost and the Relay format, and data export.
- **Integrations:** the REST API, access tokens, bots, webhooks, slash commands, interactive
  cards, and signed extensions from a catalogue.
- **Enterprise:** everything listed under [Editions](editions.md), switched on by a licence key.
- **Running it:** Docker Compose with automatic HTTPS, a Helm chart, backups and restores,
  Prometheus metrics and a Grafana dashboard, five languages (English, Dutch, German, French and
  Spanish), Relay Desktop for Windows.

**Action needed:** none.

## 0.1.0 (23 November 2026)

The first version, for early installations: messaging, notifications, search, roles, the admin
console and the Compose stack. Every release since is checked by upgrading a workspace saved by
0.1.0.
