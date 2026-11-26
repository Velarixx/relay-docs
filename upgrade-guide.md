# Relay upgrade guide

[Documentation](README.md) › Upgrade guide

Relay upgrades itself: a new version applies its database migrations when it starts. You only
replace the image and restart.

## Before you upgrade

1. Read the [release notes](release-notes.md) for anything marked **Action needed**.
2. Take a backup: `docker compose run --rm backup` (see [Backups](operate.md#backups); on Kubernetes, [High availability](high-availability.md#backups-on-kubernetes)).
   Keep it until you are sure the new version is working.
3. Note your current image tag, so you can go back to it.

## Docker Compose

In `deploy/compose/.env`, set the tag of `RELAY_IMAGE` to the new version, then:

```sh
docker compose pull
docker compose up -d
```

Compose replaces the Relay container with the new image. Migrations run before the new
version starts answering; during that time `/readyz` reports not ready, and Caddy waits.

## Kubernetes (Helm)

```sh
helm upgrade relay deploy/helm/relay -f my-values.yaml --set image.tag=<new version>
```

With two or more replicas, Kubernetes replaces them one at a time and nobody is
disconnected for long: open apps reconnect by themselves and fetch anything they missed. The
release checks prove that a rolling restart loses no messages.

## What carries over

Everything: accounts, rooms, messages and their edit history, reactions, files, custom emoji,
settings, integrations and the licence. Each release is checked by upgrading a workspace
saved by version 0.1.0 and confirming all of that is still there.

## If something goes wrong

- If the new version does not become ready, its log says why (bad settings are listed by
  name). Fix the setting and start it again.
- To go back, restore the backup taken before the upgrade and start the previous image with the
  same `SECRET_KEY`. With Docker Compose, `docker compose run --rm restore <folder name>` empties the
  database first ([Backups](operate.md#backups)); on Kubernetes, follow
  [Restoring on Kubernetes](high-availability.md#restoring-on-kubernetes). Migrations only move
  forward, so an older version cannot run on a database that a newer one has already
  migrated; that is what the backup is for.

## Versions

Relay follows semantic versioning. Patch and minor releases upgrade in place. A major release
may need an action described in its release notes. You never have to step through the
versions in between: you can always go straight from any older version to the newest. See
[Support](support.md#versions) for which versions receive fixes.
