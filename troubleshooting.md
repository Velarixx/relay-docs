# Troubleshooting

[Documentation](README.md) › Troubleshooting

The most common problems, what causes them and how to fix them. With Docker Compose, the first
place to look is always the logs: `docker compose logs relay` (or `caddy`, `postgres`).

## Relay does not start

- **The log lists settings by name.** Relay refuses to start with a missing or wrong setting and
  says which one. Fix it in `.env` (or `relay.env`, or the Helm values) and start again.
- **`/readyz` stays not ready.** Relay waits for Postgres and Valkey. Check that both containers
  are healthy (`docker compose ps`) and that `DATABASE_URL` and `VALKEY_URL` point at them.
- **After an upgrade, migrations fail.** The log names the migration. Restore the backup you took
  before upgrading and start the previous version (see the [upgrade guide](upgrade-guide.md)),
  then tell us what the log said.

## The browser cannot reach Relay, or warns about the certificate

- **Caddy cannot get a certificate.** The DNS name in `RELAY_DOMAIN` must point at this machine,
  and ports 80 and 443 must be open from the internet, so the certificate authority can check it.
  `docker compose logs caddy` says what failed. Behind a firewall without inbound port 80, use
  your own reverse proxy and certificate ([Install](install.md#behind-a-reverse-proxy-you-already-run)).
- **A warning for `localhost`.** Expected on a trial: Caddy signs `localhost` itself. Use a real
  name for people to use.
- **Pages load but messages do not update live.** A proxy in front is not passing WebSocket
  upgrades on `/ws`. Allow `Upgrade` and `Connection` headers through.

## People cannot sign in

- **"Too many attempts".** Sign-in is limited per address and per account; wait a minute and try again,
  or raise the `RATE_LIMIT_*` settings ([Install](install.md#settings-from-the-environment)).
- **A person lost their two-factor device.** An admin opens them under **Administration → People**
  and chooses **Turn off two-factor**; they set it up again at the next sign-in when their role
  requires it. Recovery codes, if they
  kept them, also work.
- **Single sign-on says there is no account, or that the email is in use.** See
  [how people are matched to accounts](identity.md#how-people-are-matched-to-accounts).
- **"Relay cannot be used from this network".** Network rules (Enterprise) refuse that address.
  An owner locked out by them starts Relay once with `NETWORK_RULES_RESET=true`, which clears all
  network rules, and removes the setting afterwards.
- **Everyone must accept the terms of use first.** Terms of use (Enterprise) block everything else
  until accepted; this is by design.

## Mail does not arrive

Use **Administration → Settings → Email → Send a test email to me**; it shows the mail server's
answer. Check `SMTP_URL` (user, password, port 587 or 465) and that `MAIL_FROM` is an address
your mail server may send for. Check the spam folder, and your domain's SPF and DKIM records.

## Calls do not connect

Look at **Administration → Calls**: failed joins mean browsers could not reach LiveKit.

- Ports 7881/tcp and 7882/udp must be open from where people are, and LiveKit must announce an
  address they can reach ([Calls and meetings](calls.md#call-quality-firewalls-and-turn)).
- On strict office networks, switch on LiveKit's TURN server on port 443.
- No call button at all: `LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are not set.

## Notifications do not reach the mobile apps

`PUSH_GATEWAY_URL` must be set for notifications while the app is closed ([Apps](apps.md)).
Notifications go only to someone with no Relay open anywhere, and respect do-not-disturb and
room settings.

## A restore lost secrets

A restore that signs people in but shows mail, single sign-on or two-factor as broken was started
with another `SECRET_KEY` than the backup's. Start it again with the original key.

## Enterprise features are missing

- **Administration → License** shows whether a licence is installed, until when, and for how many
  seats. An expired or removed licence turns the Enterprise features off; everything made with
  them stays and comes back with a valid licence.
- A subscription checks in with the licence server; a server without internet access needs an
  offline key ([Licensing](licensing.md)).

## Still stuck

See [Support](support.md) for where to ask, and what to send along.
