# Writing an extension

An extension adds something to Relay without changing Relay itself: a slash command, a card
with buttons, messages from another system, previews for its links. It is a folder holding a
manifest, `extension.json`, and a JavaScript module. Relay runs each extension in a process of
its own that may read only its own folder and has no network, so everything it does goes
through Relay, which checks it against what the admin allowed.

## Start one

`deploy/extensions/new-extension.mjs`, which comes with these guides, makes a starting
extension. It needs only Node 22 or later:

```sh
node deploy/extensions/new-extension.mjs hello --dir my-extensions
```

This creates `my-extensions/hello` with a manifest and a module that answers `/hello`. Start
Relay with `EXTENSIONS_DIR` set to the folder above it (`EXTENSIONS_DIR=./my-extensions`), open
**Administration → Extensions**, and turn **hello** on. Its card lists exactly what it may do.
Type `/hello` in any room.

Relay reads the folder when it starts, so restart it after changing the manifest. A change to
the module is picked up the next time the extension's process starts: turn it off and on.

## The manifest

| Field         | What it is                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | 2 to 32 lower case letters, digits and dashes. It names the extension's bot, `ext-<id>`.                                                                             |
| `version`     | `major.minor.patch`. A later version replaces an earlier one; nothing older is installed.                                                                            |
| `name`        | Its name per language: `en` and `nl` are required, `de`, `fr` and `es` are shown when given.                                                                         |
| `description` | One sentence per language, shown on its card.                                                                                                                        |
| `main`        | The module to run, inside the folder. `index.js` when left out.                                                                                                      |
| `permissions` | What it may do; see below. It gets these and nothing else.                                                                                                           |
| `hosts`       | The web hosts it may fetch from with `http`, such as `api.example.com`. `"*"` means any public host.                                                                 |
| `commands`    | Up to ten slash commands, each with a `name`, a `description` and a `usage` per language.                                                                            |
| `hooks`       | `["message.created"]` to hear new messages (needs `messages.read`).                                                                                                  |
| `settings`    | Fields an admin fills in on its card: `key`, `label`, `hint`, `kind` (`text`, `url` or `secret`) and `required`. Secrets are stored encrypted and never shown again. |
| `account`     | Fields a person fills in under **Settings → Linked accounts** to link their account in the other system (needs `accounts`).                                          |
| `webhooks`    | Web addresses that receive calls from another system (needs `webhooks`); see below.                                                                                  |
| `schedule`    | Tasks run every so many minutes: `{ "name": "poll", "everyMinutes": 15 }` (needs `schedule`).                                                                        |
| `previews`    | Links it previews: a `host`, or the host of a URL `setting`, and an optional `path` pattern (needs `previews`).                                                      |
| `ui`          | `composerActions`: buttons by the message box that put a command in it. `messageActions`: items in each message's menu (need `commands`).                            |

### Permissions

| Permission      | Lets the extension                                                                   |
| --------------- | ------------------------------------------------------------------------------------ |
| `commands`      | add its slash commands, answer clicks on its own cards, and add message actions      |
| `messages.read` | hear new messages in rooms its bot was added to (never in encrypted rooms)           |
| `messages.post` | post messages and cards where it was used or added                                   |
| `storage`       | keep a small amount of its own data                                                  |
| `http`          | fetch from its `hosts`, and from the hosts of URL settings an admin filled in        |
| `webhooks`      | receive calls from another system at its own web addresses, checked against a secret |
| `schedule`      | run its tasks on their schedule                                                      |
| `accounts`      | let people link their account in the other system                                    |
| `previews`      | give the previews for links it claims                                                |

## The module

The module's default export holds a function for each thing the extension answers. Each gets
what happened and `relay`, the extension's only way to act. Each call has three seconds.

| Function          | Called when                                 | Gets                                                | Returns                                               |
| ----------------- | ------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `onCommand`       | someone uses one of its commands            | `command`, `text`, `user`, `room`                   | `{ ephemeral, text, embeds }`                         |
| `onAction`        | someone clicks a button on one of its cards | `action` (`id`, `value`), `user`, `room`, `message` | `{ ephemeral }` and/or `{ update: { text, embeds } }` |
| `onMessage`       | a message is posted where its bot is        | `message` (`id`, `body`, `author`), `room`          | nothing                                               |
| `onWebhook`       | another system calls one of its addresses   | `name`, `headers`, `body`, `json`                   | nothing                                               |
| `onSchedule`      | one of its tasks is due                     | `name`                                              | nothing                                               |
| `onPreview`       | a message links to something it claims      | `url`                                               | `{ title, description, siteName }` or null            |
| `onMessageAction` | someone picks its item in a message's menu  | `actionId`, `message`, `user`, `room`               | `{ text }`, shown only to that person                 |

`user` has `id`, `username`, `displayName` and `language`; `room` has `id`, `name` and `type`.
An `ephemeral: true` answer is seen only by the person who asked; otherwise its `text` and
`embeds` are posted in the room by the extension's bot.

What `relay` offers:

| Call                                                         | Needs           | Does                                                                     |
| ------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------ |
| `relay.messages.post({ roomId, text, embeds })`              | `messages.post` | posts as the extension's bot                                             |
| `relay.storage.get(key)` / `set(key, value)` / `delete(key)` | `storage`       | its own data, any JSON value                                             |
| `relay.storage.swap(key, expected, value)`                   | `storage`       | sets the value only if it is still `expected`; true if it did            |
| `relay.http.get(url, headers)`                               | `http`          | `{ status, text, json() }`                                               |
| `relay.http.request({ url, method, headers, body })`         | `http`          | the same, for other methods                                              |
| `relay.settings.get()`                                       | —               | what the admin filled in, secrets included                               |
| `relay.accounts.get(userId)`                                 | `accounts`      | what that person filled in, or null                                      |
| `relay.rooms.follow(roomId)` / `unfollow(roomId)`            | `messages.post` | lets it post in a room later, from a webhook or a task                   |
| `relay.direct.open(userId)`                                  | `messages.post` | a direct conversation with someone who just used it, for private answers |

### Web addresses for other systems

Each entry in `webhooks` gets an address, shown on the extension's card:
`https://<your Relay>/api/v1/extensions/<id>/webhooks/<name>`. Its `verify` says how Relay
checks a call is genuine before the extension sees it, using a setting as the secret:

- `{ "scheme": "hmac-sha256", "header": "x-hub-signature-256", "prefix": "sha256=", "secret": "secret" }`
  for an HMAC of the body,
- `{ "scheme": "token", "header": "x-gitlab-token", "secret": "secret" }` for a header that
  carries the secret,
- `{ "scheme": "bearer", "secret": "token" }` for `Authorization: Bearer`.

A call that fails the check is answered 401 and never reaches the extension.

## A worked example: stand-ups

This extension collects each person's stand-up note during the day with `/standup note …`,
and `/standup` posts them all in the room. It runs as a test with every Relay build, exactly as
written here.

<!-- file: extension.json -->

```json
{
  "id": "standup",
  "version": "1.0.0",
  "name": { "en": "Stand-up", "nl": "Stand-up" },
  "description": {
    "en": "Collects everyone's stand-up note and posts them together.",
    "nl": "Verzamelt ieders stand-upnotitie en plaatst ze samen."
  },
  "permissions": ["commands", "messages.post", "storage"],
  "commands": [
    {
      "name": "standup",
      "description": {
        "en": "Add your note, or post today's notes",
        "nl": "Voeg je notitie toe, of plaats die van vandaag"
      },
      "usage": { "en": "/standup [note <text>]", "nl": "/standup [note <tekst>]" }
    }
  ]
}
```

<!-- file: index.js -->

```js
// Notes are kept per room and per day, keyed by the person, until someone posts them.
const TEXT = {
  en: { saved: 'Noted.', none: 'No notes yet today.', title: 'Stand-up' },
  nl: { saved: 'Genoteerd.', none: 'Nog geen notities vandaag.', title: 'Stand-up' },
};

export default {
  async onCommand({ text, user, room }, relay) {
    const t = TEXT[user.language] ?? TEXT.en;
    const key = `notes:${room.id}:${new Date().toISOString().slice(0, 10)}`;
    const notes = (await relay.storage.get(key)) ?? {};
    const note = /^note\s+(.+)$/s.exec(text.trim());
    if (note) {
      notes[user.displayName] = note[1].trim();
      await relay.storage.set(key, notes);
      return { ephemeral: true, text: t.saved };
    }
    const lines = Object.entries(notes).map(([name, n]) => `- **${name}**: ${n}`);
    if (lines.length === 0) return { ephemeral: true, text: t.none };
    await relay.storage.delete(key);
    return { ephemeral: false, text: [`**${t.title}**`, ...lines].join('\n') };
  },
};
```

With both files in `my-extensions/standup` and the extension turned on, Ada types
`/standup note Finished the invoice export` and Charles types `/standup note Reviewing #42`.
Then `/standup` posts:

<!-- result -->

```text
**Stand-up**
- **Ada Lovelace**: Finished the invoice export
- **Charles Babbage**: Reviewing #42
```

## Sharing an extension

An extension of your own stays in your `EXTENSIONS_DIR`; copy the folder to each Relay that
should have it. The **Catalogue** on the extensions page lists the extensions the Relay team
publishes; those are signed, and Relay installs only bundles whose signature checks out, so an
extension of your own cannot be installed from there or uploaded as a bundle.
