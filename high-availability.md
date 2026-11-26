# High availability and disaster recovery

[Documentation](README.md) › High availability

How to run Relay so that no single machine stopping takes it down, and how to get it back after
losing everything.

## What Relay keeps where

| Part                          | Holds                                                                                                                                 | Needs a backup  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Postgres                      | Everything people and admins made: accounts, rooms, messages, settings, sessions, the job queue                                       | yes             |
| File storage (S3 or a volume) | Uploaded files, avatars, call recordings, exports                                                                                     | yes             |
| `SECRET_KEY`                  | Decrypts the secrets stored in Postgres (mail password, sign-in provider secrets, two-factor seeds)                                   | yes, kept apart |
| Valkey                        | Short-lived state only: who is online, live connections, rate-limit counters, sign-ins in progress, the message bus between instances | no              |
| Relay instances               | Nothing of their own                                                                                                                  | no              |

Losing Valkey signs nobody out and loses no messages: people mid-way through a single sign-on
start again, and online status is rebuilt within a minute.

## A layout without single points of failure

High availability needs Kubernetes (or several machines with a load balancer); one machine with
Docker Compose is one point of failure by nature, and is recovered from backups.

- **Relay:** two or more replicas (`replicaCount: 2` or more). The Helm chart adds a disruption
  budget, so updates and node maintenance replace them one at a time. Any instance can serve
  anyone; live connections reconnect by themselves to another instance and fetch what they
  missed.
- **Files:** S3-compatible storage (`STORAGE_DRIVER=s3`); a local volume serves one instance
  only. Use a provider or setup that replicates across zones.
- **Postgres:** a managed database with automatic failover, or a cluster operator such as
  CloudNativePG or Patroni with at least one synchronous standby. Give Relay the address that
  always points at the current primary. A separate read replica (`DATABASE_REPLICA_URL`) spreads
  reading load; when it is unreachable Relay reads from the primary.
- **Valkey:** a managed Valkey or Redis with automatic failover, behind one address. Relay needs
  it to answer: while it is down, `/readyz` reports not ready.
- **LiveKit:** sized and made redundant separately; calls in progress end when their LiveKit node
  stops, and people rejoin.

Every release is checked with a rolling restart of several instances under load that loses no
messages.

## Backups with Docker Compose

`docker compose run --rm backup` writes the database and the files into one folder; see
[Backups](operate.md#backups) for scheduling and restoring.

## Backups on Kubernetes

Back up Postgres and the bucket with the tools you already use for them, taken close together:

- **Postgres:** your provider's snapshots or point-in-time recovery, or a nightly logical dump:

  ```sh
  pg_dump --format=custom --no-owner --no-privileges --file=relay.dump "$DATABASE_URL"
  ```

- **Files:** bucket versioning with a retention rule, or replication to a bucket in another
  region or account.
- **`SECRET_KEY`:** in your password manager or secret store, apart from the backups.

## Restoring on Kubernetes

1. Stop Relay, so nothing writes while you restore:
   `kubectl scale deployment/relay --replicas=0`.
2. Put the database back into an empty database. With a logical dump:

   ```sh
   psql "$ADMIN_URL" -c 'DROP DATABASE IF EXISTS relay WITH (FORCE)' -c 'CREATE DATABASE relay OWNER relay'
   pg_restore --no-owner --no-privileges --exit-on-error --dbname="$DATABASE_URL" relay.dump
   ```

   (`$ADMIN_URL` connects to the `postgres` database as a user allowed to create databases.)
   With snapshots or point-in-time recovery, restore those instead.

3. Put the files back to the same moment (restore the bucket's versions, or copy from the
   replica bucket).
4. Make sure the deployment uses **the same `SECRET_KEY`** as when the backup was made, then
   start Relay again: `kubectl scale deployment/relay --replicas=2`. It applies any migrations
   and becomes ready.

Restoring into an empty database means nothing a newer version added survives, so the same
steps take you back to an earlier version (see [going back](upgrade-guide.md#if-something-goes-wrong)).

## Recovery point and time

How much you can lose (the recovery point) is the time since your last backup: a nightly backup
loses up to a day, point-in-time recovery of Postgres a few minutes. How long it takes (the
recovery time) is mostly restoring the database and the files: plan for minutes for a small
workspace and about an hour per hundred gigabytes of files, and try it once a quarter on a
separate machine. Relay itself starts in seconds.
