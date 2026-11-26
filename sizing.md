# Sizing

[Documentation](README.md) › Sizing

Relay is one Node.js process per instance, in front of Postgres and Valkey. Instances share
nothing but those two, so you add capacity by adding instances. This page says what to give
each part for the number of people you have, and shows the measurements behind it.

## Layouts

| People      | Relay                                                           | Postgres                                  | Valkey           |
| ----------- | --------------------------------------------------------------- | ----------------------------------------- | ---------------- |
| Up to 500   | 1 instance, on the same machine as the rest                     | same machine; 2 cores and 4 GB in all     | same machine     |
| Up to 2,000 | 2 instances, 1 core and 1 GB each                               | 2 cores, 4 GB                             | 0.5 core, 256 MB |
| Up to 5,000 | 3 instances, 1 to 2 cores and 1 GB each                         | 4 cores, 8 GB                             | 1 core, 512 MB   |
| 10,000      | 3 or more instances, 2 cores and 2 GB each, plus a read replica | 4 to 8 cores, 16 GB; the replica the same | 1 core, 512 MB   |

- **Up to about 500 people,** one machine with 2 cores and 4 GB runs the whole Compose stack
  (Relay, Postgres, Valkey and Caddy) comfortably.
- **From about 500,** run two instances even when one would do, so restarts and upgrades never
  interrupt anyone. Every release is checked with a rolling restart that loses no messages.
- **Towards 10,000,** add Relay instances first; they scale out evenly. Postgres is the next
  limit: give it more cores and memory, and point `DATABASE_REPLICA_URL` at a streaming replica
  so history and search are read there. Measure on your own hardware before going live (see
  [Measurements](#measurements)).
- **Very large workspaces** can move search to OpenSearch (Enterprise; see
  [Search](operate.md#search)).

## Connection pooling

Each instance keeps up to `DATABASE_POOL_MAX` connections (default 10) to Postgres, as many to
the replica, and about three more for background jobs. Keep the total, instances × (pool + 3),
well below Postgres's `max_connections` (100 by default). With many instances, put PgBouncer in
session mode in front of Postgres rather than raising `max_connections` far past a few hundred.

## Storage

The database grows with messages (about 1 KB each with their search index) and the file text
kept for search (up to 300,000 characters per file). Files themselves live in S3-compatible
storage or a local volume: plan for your uploads, call recordings and exports, which are
usually far larger than the database. Back up both (see [Backups](operate.md#backups)).

## Large rooms

A room can hold 10,000 people or more. With a room of 10,001 members, one instance answered:

| What                                   | Time                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| Member list                            | 100 per page, under 64 KB, 20 ms; a name search 7 ms |
| Working out who to notify of a message | 33 ms (only those who could be told)                 |
| Opening the room, posting, searching   | 4, 11 and 14 ms                                      |
| People shown typing at once            | at most 5, across all instances                      |

Online status is sent to everyone in batches every half second whatever the room size, and the
member list asks for the status of the people shown only.

## Voice and video

Calls use LiveKit, which is sized separately (see LiveKit's own guidance, and
[Calls and meetings](calls.md#call-quality-firewalls-and-turn) for the network).

## Measurements

These figures come from one machine and synthetic traffic: an AMD Ryzen 7 9800X3D (8 cores),
Docker Desktop with a 2 GB memory limit, Relay, Postgres 18, Valkey 8 and the k6 load
generator all as containers. Each person holds a live connection in a room of 20, and every
message is delivered live to the other 19. Real use has more reads, searches and file uploads,
so keep headroom and watch the dashboards in `deploy/grafana`.

| People | Relay instances | Messages a second | Failed | Send time (median / 99th percentile) | Peak use                                                       |
| ------ | --------------- | ----------------- | ------ | ------------------------------------ | -------------------------------------------------------------- |
| 2,000  | 2               | 51                | none   | 12 ms / 27 ms                        | each instance under half a core; Postgres 0.7 cores            |
| 3,000  | 3               | 45                | none   | 16 ms / 88 ms                        | Postgres one core                                              |
| 5,000  | 3               | 73                | none   | 50 ms / 938 ms                       | each instance about one core, under 240 MB; Postgres 1.9 cores |

Postgres is the first limit as the load grows: its CPU doubles from 3,000 to 5,000 people while
each Relay instance stays well within its share. At 7,500 and 10,000 people the load generator
itself ran out of memory on that machine before Relay did, so 10,000 has not been measured yet;
the layout above for it is an estimate. Every release also runs a smoke test with 200 people
that passes only with zero errors and zero lost messages.

