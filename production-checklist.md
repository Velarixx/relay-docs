# Production checklist

[Documentation](README.md) › Production checklist

Work through this list before people rely on Relay. Each line links to where it is explained.

## Before you invite anyone

- [ ] Relay answers at its real name over HTTPS, not `localhost` ([Install](install.md)).
- [ ] `SECRET_KEY` and the database password are long random values, and `SECRET_KEY` is stored
      in your password manager or secret store, apart from the server.
- [ ] Mail works: **Administration → Settings → Email → Send a test email to me**. Invitations, password resets
      and notification emails depend on it.
- [ ] Registration is set the way you want (open, invite only or closed) under
      **Administration → Settings → Accounts**.
- [ ] Owners and admins use two-factor sign-in, and the admin role requires it
      (**Administration → Roles**; see [Identity](identity.md#two-factor-sign-in-and-sessions)).
- [ ] Single sign-on, if you use it, works for a test account, and account creation and role
      mapping do what you expect ([Identity](identity.md)).

## Keeping it safe

- [ ] A daily backup runs, and copies leave the machine ([Backups](operate.md#backups)).
- [ ] You have restored one backup on another machine and signed in to it.
- [ ] The server's operating system and Docker update automatically, or someone owns doing it.
- [ ] Ports other than 80 and 443 (and the call ports, if used) are closed to the internet.
- [ ] `METRICS_TOKEN` is set, or `/metrics` is not reachable from outside.
- [ ] You have read [Security and data flows](security.md) and switched off the outbound
      connections you do not want.

## Knowing it is healthy

- [ ] Something watches `/readyz` and tells you when it stops answering.
- [ ] The Grafana dashboard (`deploy/grafana/relay-dashboard.json`) or your own monitoring shows
      request times, live connections and job runs ([Health and monitoring](operate.md#health-and-monitoring)).
- [ ] Logs are kept for as long as your policies require.
- [ ] Someone reads the admin console's notice when a new version is out, and follows the
      [upgrade guide](upgrade-guide.md).

## If you use them

- [ ] Calls: a test call from outside your network shows no failed joins under
      **Administration → Calls** ([Calls and meetings](calls.md)).
- [ ] Livechat: the window appears only on your own sites
      ([Livechat](livechat.md#the-chat-window-on-your-website)).
- [ ] Mobile apps: the server's certificate is trusted by phones, and `PUSH_GATEWAY_URL` is set if
      people should get notifications while the app is closed ([Apps](apps.md)).
- [ ] Enterprise: the licence is installed and **Administration → License** shows the seats you
      bought ([Licensing](licensing.md)).
- [ ] More than a few hundred people: the layout matches [Sizing](sizing.md), with two or more
      instances ([High availability](high-availability.md)).
