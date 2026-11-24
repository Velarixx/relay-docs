# Relay upgrade guide

[Documentation](README.md) › Upgrade guide

Relay upgrades itself: a new version applies its database migrations when it starts. You only
replace the image and restart.

## Before you upgrade

1. Read the release notes for anything marked **Action needed**.
2. Take a backup: `pnpm backup <folder>` (see the [admin guide](admin-guide.md#backups)).
   Keep it until you are sure the new version is working.
3. Note your current image tag, so you can go back to it.

## Docker Compose

```powershell
docker build -t relay:latest .
docker compose up -d
```

Compose replaces the Relay container with the new image. Migrations run before the new
version starts answering; during that time `/readyz` reports not ready, and Caddy waits.

## Kubernetes (Helm)

```powershell
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
- To go back, restore the backup taken before the upgrade into an empty database (see the
  admin guide) and start the previous image with the same `SECRET_KEY`. Migrations only move
  forward, so an older version cannot run on a database that a newer one has already
  migrated; that is what the backup is for.

## Versions

Relay follows semantic versioning. Patch and minor releases upgrade in place. A major release
may need an action described in its release notes, and is never required to skip versions:
you can always go straight from any older version to the newest.
