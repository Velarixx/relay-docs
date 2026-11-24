# Device policy

[Documentation](README.md) › Device policy

Enterprise workspaces can set rules for the devices people sign in from, under
**Administration → Device policy**. The rules are checked whenever someone signs in, including
after a second factor and through single sign-on. People who are already signed in stay signed in.

## Rules

- **Who may sign in from** — web browsers, the desktop app, phones and tablets. The kind of
  device is read from the browser's user agent. A determined person can fake it, so treat this as
  a guard rail rather than a lock. You cannot save a policy that excludes the device you are using.
- **Devices signed in at once per person** — 0 means no limit. A device counts while it has a
  live session. Over the limit, the person must sign out on another device first. Someone who
  has lost a device can ask an administrator to sign them out everywhere.
- **New devices must be confirmed by email** — the first sign-in from a browser or app sends the
  person a link. Once they open the link and confirm, they sign in again. A device stays
  confirmed after that. This needs a mail server, and accounts without an email address cannot
  confirm new devices. The device on which an account was created is trusted from the start.

## How devices are recognised

Relay gives each browser or app a long-lived, HTTP-only cookie and stores only a hash of it.
Clearing cookies makes the browser a new device. Signing in again on the same device replaces
that device's earlier session.

## Without a licence

If the licence lapses or no longer includes device policy, the rules stop applying. The saved
policy is kept for when the licence is renewed.
