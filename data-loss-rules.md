# Data-loss rules

[Documentation](README.md) › Data-loss rules

Enterprise workspaces can stop sensitive text from being shared in messages, under
**Administration → Data-loss rules**.

A rule has a name, a pattern and an action:

- **Block the message**: the message is not sent. The sender sees which rule stopped it.
- **Mask what matched**: the message is sent with the matching text replaced by dots.

Patterns are regular expressions and are matched without regard to case. The console offers
ready-made patterns for card numbers, IBAN bank accounts and email addresses as a starting point.
Patterns that nest repetition, such as `(a+)+`, are refused, because they can make checking a
message take a very long time.

## What is checked

- New messages and edits in channels, private rooms, direct messages and threads.
- Messages from livechat customers. Customer emails can't be refused, so blocking rules mask
  them instead.
- Integrations' and bots' messages are not checked.
- Messages in end-to-end encrypted rooms can't be read by the server, so they are not checked.

Every block and mask is written to the audit log (`dlp.blocked`, `dlp.masked`) with the rule's
name and the room, but without the message text. Adding, changing and removing rules is
audited too.

## Without a licence

If the licence lapses or no longer includes data-loss rules, the rules stop applying. They are
kept for when the licence is renewed.
