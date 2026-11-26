# Compliance export format

[Documentation](README.md) › Compliance export format

Relay Enterprise can export a room, or everything chosen people wrote, for legal or
compliance review (**Administration → Exports**). The result is one UTF-8 JSON file. Every
export request and every download is written to the audit log.

## Top level

| Field        | Type              | Meaning                                                        |
| ------------ | ----------------- | -------------------------------------------------------------- |
| `format`     | string            | Always `relay-compliance-export`.                              |
| `version`    | number            | Format version, currently `1`.                                 |
| `exportedAt` | ISO 8601 string   | When the file was made.                                        |
| `exportedBy` | user id or `null` | Who asked for it.                                              |
| `scope`      | `rooms`/`users`   | Whether whole rooms or chosen people's messages were exported. |
| `filters`    | object            | `ids` exported, and the optional `from` / `to` period.         |
| `users`      | array             | Everyone who appears in the export (see below).                |
| `rooms`      | array             | Each room involved, with its messages (see below).             |

## Users

`id`, `username`, `displayName`, `email` (may be `null`), `type` (`member`, `guest`, `bot`,
`visitor`) and `active`.

## Rooms

`id`, `type` (`channel`, `private`, `dm`, `team`, `discussion`, `livechat`), `name`,
`encrypted`, `createdAt`, `members` (`userId`, `role`) and `messages`.

With `scope: users`, a room holds only the chosen people's messages in it.

## Messages

| Field                                | Meaning                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| `id`, `seq`                          | The message and its position in the room.                           |
| `authorId`                           | The writer (`null` for system messages).                            |
| `kind`                               | `user` or `system`; `systemType` names system events.               |
| `body`                               | The text (Markdown source). Empty for encrypted messages.           |
| `ciphertext`                         | Encrypted rooms only: the text as stored, which Relay cannot read.  |
| `internal`                           | Livechat: a note between agents that the customer never saw.        |
| `threadRootId`                       | Set on thread replies.                                              |
| `createdAt`, `editedAt`, `deletedAt` | When it was written, last edited, deleted.                          |
| `revisions`                          | Earlier versions, oldest first: `body`, `ciphertext`, `replacedAt`. |
| `attachments`                        | Files: `id`, `name`, `mime`, `size` in bytes and `sha256` checksum. |

A message deleted while under legal hold is exported with the text it had when deleted.
Attached files are listed by checksum; their contents are not part of the JSON file.

## Scheduled exports

Under **Administration → Exports → Scheduled exports**, an export can run by itself, daily or
weekly, of chosen rooms, chosen people, or everything. Each run covers the time since the
previous one, and is written either to the storage bucket (under `exports/<date>-<id>/`) or
to a folder on an SFTP server, in one of three formats:

- **JSON**: `export.json`, the format above.
- **CSV**: `messages.csv`, one row per message (UTF-8 with a byte-order mark, so spreadsheet
  programs read accents correctly). Encrypted messages are marked, not decrypted.
- **EML**: one mail file per message, `<room id>-<seq>.eml`, with the author as sender, the
  room as recipient, the time as date and thread replies linked with `In-Reply-To`.

Beside the files is `manifest.json`:

```json
{
  "format": "relay-compliance-export-manifest",
  "version": 1,
  "exportId": "…",
  "createdAt": "2026-11-25T02:00:00.000Z",
  "scope": "rooms",
  "exportFormat": "csv",
  "period": { "from": "2026-11-24T02:00:00.000Z", "to": "2026-11-25T02:00:00.000Z" },
  "files": [{ "name": "messages.csv", "size": 18342, "sha256": "…" }]
}
```

Every run is listed with the other exports, with its outcome; a run that could not reach its
destination says why. The SFTP password is stored encrypted and never shown again.

Relay checks the SFTP server by its host key. Enter the fingerprint as `ssh-keygen -lf` prints
it (`SHA256:…`), or leave it empty: the first connection then records the key, and the
schedule shows it. Every later run must meet the same key; a server with another key is sent
nothing, and the export fails with "host key mismatch". Changing the server's address forgets
the recorded key.
