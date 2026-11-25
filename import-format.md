# Importing data

[Documentation](README.md) › Importing data

Relay brings in people, teams, rooms and their history from other systems. Admins find the
importers under **Administration → Import**:

- **People from a CSV file**: one row per person, with at least the columns `username` and
  `email`; `displayName` and `roles` are optional.
- **A Mattermost bulk export**: the `.jsonl` file, or a `.zip` with the `.jsonl` file and the
  attachments beside it.
- **A Slack export**: the `.zip` Slack makes of a workspace.
- **The Relay import format**, described below, for anything else.

Every importer can be **tried first**: tick _Only check what would happen_ and Relay reports what
it would create and what it would leave out, and why, without changing anything. Run it again
without the tick to import.

An import that stops half-way, because the server restarted or the connection dropped, can
simply be run again with the same file: Relay remembers what it already brought in and carries on
with the rest. Running a finished import again makes nothing twice. Imports are for admins who
may manage both people and rooms, are recorded in the audit log, and stop making new accounts
when the licence has no free seats left (those people are reported as skipped).

What imports do not do:

- People are not sent anything. Those who are new get an account without a password and choose
  one through **Forgot password?**, or sign in through single sign-on. Someone whose email address
  is already in Relay is matched to that account.
- Nobody becomes an admin through an import, whatever role the other system gave them.
- Imported history counts as read, and makes no notifications.

## The Relay import format

The format is [JSON Lines](https://jsonlines.org): one JSON object per line, each a _record_.
Upload a `.jsonl` file, or a `.zip` with the `.jsonl` file and the files the records attach.

Records refer to each other by ids of your choosing, such as the ids of the system you export
from. They only need to be unique per kind of record within one import, and they are never shown.
A record may only refer to records above it, so put people first, then teams, rooms and messages,
and each reply after the message it answers.

| Record    | Fields                                                                                                                                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`    | `id`, `username`, `email` (optional; matches an existing account), `displayName`, `deactivated` (a person who left: kept as author, cannot sign in), `bot`                                                                                                                                                      |
| `team`    | `id`, `name`, `description`, `members` (user ids)                                                                                                                                                                                                                                                               |
| `room`    | `id`, `kind` (`channel` anyone may join, `private`, or `direct` for a conversation between people), `name` (not for `direct`), `topic`, `team` (a team id), `members` (user ids), `archived`                                                                                                                    |
| `message` | `id`, `room`, `author`, `at` (date and time with its offset, such as `2024-03-01T09:30:00Z`), `text` (Markdown), `thread` (the id of the message it answers), `reactions` (a list of `{ "emoji": "thumbsup", "by": [user ids] }`; an emoji or its short name), `files` (a list of `{ "name", "path", "type" }`) |

Names are adjusted when they are taken: a second room called `general` becomes `general-2`.
Files must be of a type the workspace allows (**Settings → Files**). Anything Relay cannot use
is reported with the line it is on and the reason, and the rest is imported.

## Worked example

A small team moving from another system: two people, a team with one channel, a direct
conversation, and a short history with a thread, a reaction and a file. The file `notes.txt` sits
in the `.zip` under `files/`.

```jsonl
{"type":"user","id":"u1","username":"ada","email":"ada@example.com","displayName":"Ada Lovelace"}
{"type":"user","id":"u2","username":"charles","email":"charles@example.com","displayName":"Charles Babbage"}
{"type":"team","id":"t1","name":"Engine","members":["u1","u2"]}
{"type":"room","id":"r1","kind":"channel","name":"engine-design","topic":"The analytical engine","team":"t1","members":["u1","u2"]}
{"type":"room","id":"d1","kind":"direct","members":["u1","u2"]}
{"type":"message","id":"m1","room":"r1","author":"u2","at":"1843-07-10T09:00:00Z","text":"The **mill** is ready for testing."}
{"type":"message","id":"m2","room":"r1","author":"u1","at":"1843-07-10T09:05:00Z","text":"Notes attached.","thread":"m1","reactions":[{"emoji":"thumbsup","by":["u2"]}],"files":[{"name":"notes.txt","path":"files/notes.txt"}]}
{"type":"message","id":"m3","room":"d1","author":"u1","at":"1843-07-10T10:00:00Z","text":"Lunch?"}
```

Tried first, the report says it would create 2 people, 1 team, 2 rooms, 3 messages, 1 reaction
and 1 file, and changes nothing. Imported, `#engine-design` sits in the _Engine_ team with Ada's
reply in the thread under Charles's message, and Ada and Charles have their direct conversation.
Running the same file again reports all eight records as already imported.
