#!/usr/bin/env node
/**
 * Hands one email to Relay's "Mail to room" extension. A mail server runs it for each message to
 * the rooms' domain, with the raw message on standard input, for example from Postfix:
 *
 *   relay-rooms unix - n n - - pipe
 *     flags=Rq user=nobody argv=/usr/bin/node /opt/relay/relay-mail.mjs ${recipient}
 *
 * with RELAY_MAIL_URL (the address shown on the extension's card) and RELAY_MAIL_TOKEN (the
 * token set there) in its environment. It needs only Node; it reads the plain-text part of the
 * message and the names of any attachments, and exits non-zero if Relay refused the mail, so the
 * mail server keeps it and tries again.
 */
import { pathToFileURL } from 'node:url';

/** Header lines unfolded, as name → value (the first of each). */
function headers(block) {
  const out = {};
  for (const line of block.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      const name = line.slice(0, colon).trim().toLowerCase();
      out[name] ??= line.slice(colon + 1).trim();
    }
  }
  return out;
}

/** =?utf-8?B?…?= and =?utf-8?Q?…?= words, as subjects and names use them. */
function decodeWords(text) {
  return String(text ?? '').replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_, charset, kind, data) => {
      const bytes =
        kind.toUpperCase() === 'B'
          ? Buffer.from(data, 'base64')
          : Buffer.from(
              data
                .replace(/_/g, ' ')
                .replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))),
              'latin1',
            );
      return new TextDecoder(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'latin1').decode(bytes);
    },
  );
}

function decodeBody(body, encoding, charset) {
  const enc = String(encoding ?? '').toLowerCase();
  let bytes;
  if (enc === 'base64') bytes = Buffer.from(body.replace(/\s+/g, ''), 'base64');
  else if (enc === 'quoted-printable') {
    bytes = Buffer.from(
      body
        .replace(/=\r?\n/g, '')
        .replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))),
      'latin1',
    );
  } else bytes = Buffer.from(body, 'latin1');
  const cs = String(charset ?? 'utf-8').toLowerCase();
  return new TextDecoder(cs === 'us-ascii' ? 'utf-8' : cs).decode(bytes);
}

const param = (value, name) => new RegExp(`${name}="?([^";]+)"?`, 'i').exec(value ?? '')?.[1];

/** The parts of a message: its text, and the names of its attachments. */
export function readMail(raw) {
  const split = raw.search(/\r?\n\r?\n/);
  const head = headers(split < 0 ? raw : raw.slice(0, split));
  const body = split < 0 ? '' : raw.slice(split).replace(/^\r?\n\r?\n/, '');
  const texts = [];
  const attachments = [];
  const walk = (h, content) => {
    const type = h['content-type'] ?? 'text/plain';
    const boundary = param(type, 'boundary');
    if (/^multipart\//i.test(type) && boundary) {
      for (const part of content.split(`--${boundary}`).slice(1)) {
        if (part.startsWith('--')) break;
        const cut = part.search(/\r?\n\r?\n/);
        if (cut < 0) continue;
        walk(
          headers(part.slice(0, cut)),
          part
            .slice(cut)
            .replace(/^\r?\n\r?\n/, '')
            .replace(/\r?\n$/, ''),
        );
      }
      return;
    }
    const disposition = h['content-disposition'] ?? '';
    const name = param(disposition, 'filename') ?? param(type, 'name');
    if (/attachment/i.test(disposition) || (name && !/^text\/plain/i.test(type))) {
      attachments.push({ name: decodeWords(name ?? 'attachment') });
    } else if (/^text\/plain/i.test(type)) {
      texts.push(decodeBody(content, h['content-transfer-encoding'], param(type, 'charset')));
    }
  };
  walk(head, body);
  return {
    from: decodeWords(head.from),
    subject: decodeWords(head.subject),
    text: texts.join('\n\n').replace(/\r\n/g, '\n').trim(),
    attachments,
  };
}

async function main() {
  const url = process.env.RELAY_MAIL_URL;
  const token = process.env.RELAY_MAIL_TOKEN;
  const to = process.argv.slice(2);
  if (!url || !token || to.length === 0) {
    console.error('usage: RELAY_MAIL_URL=… RELAY_MAIL_TOKEN=… relay-mail.mjs recipient… < message');
    process.exit(64);
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const mail = readMail(Buffer.concat(chunks).toString('latin1'));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...mail, to }),
  });
  if (!res.ok) {
    console.error(`Relay refused the mail: ${res.status}`);
    process.exit(75);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
