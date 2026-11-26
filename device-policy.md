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

## The mobile apps

Three more rules are carried out by Relay for Android and for iPhone and iPad:

- **Opening the app needs fingerprint, face or passcode** — the app stays covered until the
  person unlocks it with what their device offers, each time they come back to it. Without
  this rule people can still switch the lock on for themselves.
- **Block screenshots and screen recording** — the app's screen cannot be captured and is
  hidden in the list of recent apps.
- **Refuse rooted and jailbroken devices** — the app reports whether the device's own
  protections were removed. Such a device is signed out and told why.

The list **Mobile apps signed in** below the rules shows every phone and tablet with its
owner, platform, app version and when it was last used. **Sign out** ends that app's session
and stops its notifications.

These rules run on the device and the app reports to the server. A modified app could ignore
them or lie, so they too are a guard rail: they keep ordinary devices in line, and do not
replace device management where that is required. Managed devices can also be given the
server address; see [Apps](apps.md).

## How devices are recognised

Relay gives each browser or app a long-lived, HTTP-only cookie and stores only a hash of it.
Clearing cookies makes the browser a new device. Signing in again on the same device replaces
that device's earlier session.

## Without a licence

If the licence lapses or no longer includes device policy, the rules stop applying. The saved
policy is kept for when the licence is renewed.
