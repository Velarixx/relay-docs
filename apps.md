# Apps

[Documentation](README.md) › Apps

Relay works in any current browser. It also comes as a desktop app and as mobile apps, which
show your server's own web client, so there is nothing extra to install or upgrade on the
server.

| App                               | Where to get it                                                                |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Browser                           | Open your Relay's address; it can also be installed as an app from the browser |
| Relay Desktop for Windows         | The installer linked from [relay.velarix.nl](https://relay.velarix.nl)         |
| Relay Desktop for macOS and Linux | Coming; use the browser meanwhile                                              |
| Android, iPhone and iPad          | Coming to the app stores; use the browser meanwhile                            |

## Relay Desktop

Relay Desktop is Relay in its own window, with system notifications and the unread count on the
app icon. The first time it starts it asks for your Relay's address (`https://` only, except
`localhost`) and after that opens straight there; **Relay → Change server…** in the menu starts
over. Only that server's pages may use the app's notifications and badge.

The Windows installer is not code-signed yet, so Windows asks once before running it: choose
**More info**, then **Run anyway**. It installs for the current user and updates by installing a
newer version over it.

## Mobile apps

People install Relay for Android or for iPhone and iPad and enter your server's address. The app
needs to reach the server over HTTPS with a certificate their devices trust. Sharing from other
apps (text, links, photos and files) posts into a room they pick, and the camera and photo
library work for uploads and voice and video messages.

## Notifications while the app is closed

Notifications for a closed app travel from your server to the vendor's push gateway
and from there to Apple's or Google's push service, because those services only take
notifications from the app's publisher. Set the gateway's address to switch this on:

```
PUSH_GATEWAY_URL=<the gateway address published with the apps>
```

- Your server registers itself with the gateway the first time it has something to send, with
  a key it creates for itself. No account or licence is involved.
- The gateway stores nothing of what it passes on. What Apple and Google see is up to you:
  **Settings → Messages → What notifications for phones and browsers carry** chooses between the
  message text, only who wrote, and only that there is something new (no sender, room or
  text; the person sees the message once they open the app). Text from encrypted rooms is never sent, whatever this says.
- A notification is sent for a mention, a direct message or an incoming call, and only to
  someone with no Relay open anywhere. Do not disturb and room settings are respected.
- The Android app is built without Google's push services for now, so on Android these
  notifications arrive while the app is open; iPhone and iPad get them through Apple.
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
