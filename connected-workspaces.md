# Connected workspaces

[Documentation](README.md) › Connected workspaces

Two Relay servers can be connected so they can share rooms (Enterprise, on both servers).
Under **Administration → Connected workspaces**, one admin makes an invitation code and gives it
to the other server's admin, who pastes it under **Connect with a code**. The code works once,
for 24 hours. Both sides then list the other by its workspace name and address; **Check** shows
whether it answers, and either side can **End connection** at any time.

To share a room, pick it and the server under **Shared rooms** and choose **Share**. The other
server's admin sees the offer there and chooses **Accept**: that makes a private room on their
side, with them as its owner, and they invite their own people as usual. The room's recent
messages come along. From then on messages and thread replies appear on both sides as they are
sent, and people from the other side carry their workspace's name next to theirs. Edits,
deletions and reactions cross as well; people can only change their own messages, on either side. Files
posted in the room are copied to the other server, within that server's own size limit.

The server that shared the room keeps its order: what people on the other side write goes to it
first and appears for everyone once it has a place, so both sides always show the same messages
in the same order. If that server cannot be reached, people on the other side are told to try
again later and nothing is lost; messages it holds for a server that was down are delivered when
it is back, in order and once. Each side keeps its own members, permissions, data-loss rules,
retention and audit log; only the shared room's messages and the names of the people who wrote
them cross, never email addresses or member lists. People from the other side are not accounts
here: they cannot sign in, are not in the directory and do not take a seat.

When a connection ends, from either side, every room it shared stays on both servers as an
ordinary room with everything said so far, and says that it is no longer shared; nothing more
is exchanged. After connecting again, a room can be shared again; the other side then gets a
new room for it. A retention policy removes old messages only on its own server.

Servers talk to each other directly over HTTPS at their public addresses, so each must be able
to reach the other. Every request between them is signed with the sending server's own key and
is accepted only once and only within a few minutes; a server that is not connected, or whose
connection has ended, is refused. A server on a private network can be connected when its host
is listed in **Settings → General → Internal hosts integrations may call**.
