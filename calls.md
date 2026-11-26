# Calls and meetings

[Documentation](README.md) › Calls and meetings

Voice and video calls, screen sharing and planned meetings run on a LiveKit server next to
Relay. Sound and picture go between people's browsers and LiveKit; Relay only decides who may
join and keeps the record of each call.

## What people get

Whoever starts a call, and the room's moderators, can mute or remove people and end it for
everyone; anyone can raise a hand or send a reaction. Meetings planned in a room get a card, a
reminder ten minutes before, and an iCalendar file; a meeting can have a guest link for people
without an account, who wait until a member lets them in. Calls in encrypted rooms are encrypted
end to end with keys made from the room's own key, so neither Relay nor LiveKit can decode them;
they cannot have guests, recordings or captions.

## Calls with Docker Compose

The Compose file runs LiveKit too when started with the `calls` profile. Browsers reach it
under a name of its own, which Caddy gives a certificate, and send sound and picture to two
ports directly.

1. Point a second DNS name at the machine, for example `rtc.example.com`.
2. Open port 7881 (TCP) and port 7882 (UDP) in the machine's firewall.
3. In `.env`:

   ```sh
   LIVEKIT_DOMAIN=rtc.example.com
   LIVEKIT_URL=wss://rtc.example.com
   LIVEKIT_API_URL=http://livekit:7880
   LIVEKIT_API_KEY=relay
   LIVEKIT_API_SECRET=<openssl rand -hex 32>
   ```

4. `docker compose --profile calls up -d`.

LiveKit finds the machine's public address by itself. Start a call from outside your network
and check **Administration → Calls** (see below). `LIVEKIT_TCP_PORT` and `LIVEKIT_UDP_PORT` in
`.env` change the two media ports when 7881 and 7882 are taken.

## Calls with your own LiveKit

On Kubernetes, or with a LiveKit server you already run (LiveKit's own Helm chart, or LiveKit
Cloud), set `LIVEKIT_URL` to its `wss://` address and `LIVEKIT_API_KEY` and
`LIVEKIT_API_SECRET` to a key pair from its configuration. Without them, calls are off.

## Recording

**Recording** (Enterprise, the `call.record` permission) uses LiveKit Egress, which writes an MP4
straight into Relay's bucket, so it needs the S3 storage driver. Run Egress next to LiveKit and
give both the same Valkey (LiveKit's `redis` setting). When Egress reaches the bucket at another
address than Relay does, set `LIVEKIT_RECORDING_S3_ENDPOINT`. Everyone in the call, including
people who join later, sees that it is being recorded. When it stops, the file is posted in the
room, so it follows the room's access and retention.

## Captions and transcripts

**Captions and transcripts** (Enterprise) need a speech-to-text service that speaks the
OpenAI-compatible `/audio/transcriptions` API, set under **Settings → Assistant and
translation** (address up to and including `/v1`, model, key). It can be one you host
yourself. Anyone in a call can turn captions on; everyone in it then sees "Captions on", and
each person's browser sends a few seconds of their own microphone at a time to Relay, which
passes it to that service. What was said is kept with the call: its record in the room has a
**Transcript** button for whoever may read the room. With the assistant switched on, a summary
of the call is posted in the room when it ends.

## Call quality, firewalls and TURN

**Administration → Calls** lists recent calls with how many people took part, how many tried
and failed to connect, and the packet loss, bitrate and round-trip time their browsers measured
(each browser reports every fifteen seconds). Failed joins and high packet loss are nearly
always the network between people and LiveKit, not Relay.

Browsers reach LiveKit directly, so its ports must be open from wherever people are:

| Port                          | What it carries                                              |
| ----------------------------- | ------------------------------------------------------------ |
| 443 (TCP)                     | LiveKit's signalling, as `wss://` through your reverse proxy |
| 7882 (UDP), or a UDP range    | The media itself; the best path when it is open              |
| 7881 (TCP)                    | Media over TCP when UDP is blocked; slower, but works        |
| 3478 (UDP) and 5349/443 (TLS) | LiveKit's built-in TURN server, for the strictest networks   |

LiveKit must also announce an address people can reach: `rtc.use_external_ip: true` (the
Compose file sets it) finds its public address itself, or set `rtc.node_ip` to the public IP when
it sits behind NAT.

Some office and hotel networks allow nothing but HTTPS on port 443. For those, switch on
LiveKit's TURN server with TLS on its own domain, in LiveKit's configuration:

```yaml
turn:
  enabled: true
  domain: turn.example.com # a name that points at LiveKit
  tls_port: 5349 # or 443 when LiveKit has a public IP of its own
  udp_port: 3478
  cert_file: /certs/turn.crt
  key_file: /certs/turn.key
```

LiveKit then offers TURN to browsers by itself; Relay needs no setting for it. After changing
the network, start a test call from outside your network and check **Administration → Calls**:
failed joins should be zero and packet loss a few percent at most.

LiveKit is sized separately from Relay; see LiveKit's own guidance.
