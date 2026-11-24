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
