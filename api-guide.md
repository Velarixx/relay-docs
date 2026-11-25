# Relay API guide

[Documentation](README.md) › API guide

Relay has a REST API for scripts, bots and other systems. Everything the app does goes through
it. The full reference, with every route and field, is served by your Relay at `/api/docs`.

Every example below is a complete Node.js program (Node 22 or newer, no packages needed). They
are run against a real Relay by the test suite, so they keep working as Relay changes.

## Authentication

Create a **personal access token** in Relay under _Settings → API tokens_. Choose what it may do:

- `read` — see rooms, messages and people
- `write` — send messages and change rooms
- `admin` — use your administration rights (only as far as your own roles allow)

Send it on every request as `Authorization: Bearer rly_…`. Tokens never need the
`x-requested-with` header that the browser app sends. Signing out everywhere, or an
administrator doing that for you, also ends your tokens.

A **bot** is an account for an integration. An administrator creates it under
_Administration → Integrations_ and gets its token once; add the bot to the rooms it should work in.

Every example starts with this small helper. Set `RELAY_URL` to your Relay's address and
`RELAY_TOKEN` to a token with the `read` and `write` scopes.

```js prelude
const base = process.env.RELAY_URL;
const token = process.env.RELAY_TOKEN;

/** Calls the Relay API and returns the JSON answer, or throws with Relay's error code. */
async function relay(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const answer = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${answer.error?.code}: ${answer.error?.message}`);
  return answer;
}

/** A name nobody has used yet, so the examples can run more than once. */
const unique = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
```

## Who am I?

```js
const me = await relay('GET', '/api/v1/me');
console.log(`Signed in as @${me.username} (${me.displayName})`);
```

## Create a channel and send a message

Messages are Markdown. Mention people with `@username`.

```js
const { room } = await relay('POST', '/api/v1/rooms', {
  type: 'channel',
  name: unique('api-guide'),
  topic: 'Made by the API guide',
});
const message = await relay('POST', `/api/v1/rooms/${room.id}/messages`, {
  body: 'Hello from a **script**!',
});
console.log(`Posted message ${message.id} in #${room.name}`);
```

## Read the history, page by page

Messages come newest last. Ask for older ones with `before`, the `seq` of the oldest one you have.

```js
const { room } = await relay('POST', '/api/v1/rooms', { type: 'private', name: unique('history') });
for (let i = 1; i <= 5; i++) {
  await relay('POST', `/api/v1/rooms/${room.id}/messages`, { body: `Message ${i}` });
}
let page = await relay('GET', `/api/v1/rooms/${room.id}/messages?limit=2`);
const seen = [...page.messages];
while (page.hasMore) {
  page = await relay('GET', `/api/v1/rooms/${room.id}/messages?limit=2&before=${seen[0].seq}`);
  seen.unshift(...page.messages);
}
console.log(
  seen
    .filter((m) => m.kind === 'user')
    .map((m) => m.body)
    .join(', '),
);
```

## Reply in a thread and react

```js
const { room } = await relay('POST', '/api/v1/rooms', { type: 'private', name: unique('threads') });
const question = await relay('POST', `/api/v1/rooms/${room.id}/messages`, {
  body: 'Lunch at noon?',
});
await relay('POST', `/api/v1/rooms/${room.id}/messages`, {
  body: 'Works for me',
  threadRootId: question.id,
});
await relay('POST', `/api/v1/messages/${question.id}/reactions`, { emoji: '👍' });
const thread = await relay('GET', `/api/v1/messages/${question.id}/thread`);
console.log(`${thread.messages.length} reply in the thread`);
```

## Upload a file

Files go up as `multipart/form-data`, with an optional caption in `body`.

```js
const { room } = await relay('POST', '/api/v1/rooms', { type: 'private', name: unique('files') });
const form = new FormData();
form.append('body', 'The latest numbers');
form.append('file', new Blob(['quarter,revenue\nQ1,100\n'], { type: 'text/csv' }), 'numbers.csv');
const res = await fetch(`${base}/api/v1/rooms/${room.id}/files`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}` },
  body: form,
});
if (!res.ok) throw new Error(`upload failed: ${res.status}`);
const posted = await res.json();
console.log(`Uploaded ${posted.attachments[0].name} (${posted.attachments[0].size} bytes)`);
```

## Post from another system with an incoming webhook

An administrator creates an incoming webhook for a room under _Administration → Integrations_
(or with the API, as here, using a token with the `admin` scope). Its address contains a secret;
anything that can make an HTTP request can post with it, no token needed.

Cards (`embeds`) have a title, Markdown text, a link, a colour and fields.

```js
const adminToken = process.env.RELAY_ADMIN_TOKEN;
const admin = (method, path, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const { room } = await admin('POST', '/api/v1/rooms', { type: 'channel', name: unique('deploys') });
const { url } = await admin('POST', '/api/v1/admin/webhooks/incoming', {
  roomId: room.id,
  name: 'Deploy bot',
});

// From here on, this is all the other system needs: the address.
const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    text: 'Deployed **v2.4** to production',
    embeds: [
      {
        title: 'Release notes',
        url: 'https://example.com/releases/2.4',
        color: '#22c55e',
        fields: [{ title: 'Duration', value: '3 minutes', short: true }],
      },
    ],
  }),
});
if (!res.ok) throw new Error(`webhook failed: ${res.status}`);
console.log('Posted through the webhook');
```

## Check an outgoing webhook's signature

Outgoing webhooks, slash commands and button clicks are sent to your system signed with the
secret you were shown when you created them. The `x-relay-signature` header looks like
`t=1700000000,v1=<hex>`: an HMAC-SHA256 of `<t>.<raw body>`. Check it, and reject old timestamps
so a captured request cannot be replayed.

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(secret, header, rawBody, maxAgeSeconds = 300) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!parts.t || !parts.v1 || age > maxAgeSeconds) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

// What Relay would send:
const secret = 'whsec_example';
const body = JSON.stringify({ event: 'message.sent', message: { text: 'hi' } });
const t = Math.floor(Date.now() / 1000);
const header = `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

console.log('valid:', verify(secret, header, body));
console.log('tampered:', verify(secret, header, body.replace('hi', 'bye')));
if (!verify(secret, header, body) || verify(secret, header, body.replace('hi', 'bye'))) {
  throw new Error('signature check is wrong');
}
```

## Answer a slash command or a button

A custom command (`/weather paris`) or a click on a card's button is a `POST` to your endpoint:

```json
{
  "type": "command",
  "command": "weather",
  "text": "paris",
  "user": { "id": "…", "username": "ada" },
  "room": { "id": "…", "name": "general" }
}
```

Answer within five seconds with JSON. For a command, `{ "text": "…", "ephemeral": false }` posts
the answer in the room; by default only the person who ran it sees it. For a click,
`{ "ephemeral": "Thanks!" }` shows a note to the person who clicked, and
`{ "update": { "text": "Approved", "embeds": [] } }` replaces the card.

## Connect an AI tool (Model Context Protocol)

Relay has a Model Context Protocol endpoint at `/api/v1/mcp`, so an AI tool that speaks the
protocol can list your rooms, read them, search them and post in them. Make a personal access
token under _Settings → API tokens_ and give the tool the address and the token:

```json
{
  "mcpServers": {
    "relay": {
      "url": "https://chat.example.com/api/v1/mcp",
      "headers": { "Authorization": "Bearer rly_..." }
    }
  }
}
```

The tools are `list_rooms`, `read_messages`, `search` and `post_message`. Each runs as you,
through the same API as everything else: a token with only the `read` scope cannot post, and
the tool sees only the rooms you can read. The endpoint answers over plain HTTP POST (the
Streamable HTTP transport, without server-sent events) and keeps no session; browser sign-ins
are refused there, only tokens work.

## Errors

Errors always look like `{ "error": { "code": "…", "message": "…" } }` with a fitting HTTP status:
`401` without a valid token, `403` when it is not allowed (`token_scope` when the token lacks a
scope), `404` for things that do not exist or that you cannot see, `429` when you send too much.
