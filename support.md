# Support and version policy

[Documentation](README.md) › Support

What help you can get, how versions are numbered and supported, and what Relay runs on.

## Getting help

| Edition    | Where to ask                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Community  | These guides, and the [issues of the documentation repository](https://github.com/Velarixx/relay-docs/issues) for anything unclear or broken. There is no guaranteed answer. |
| Enterprise | Email to the address on [relay.velarix.nl](https://relay.velarix.nl), while your subscription is active. We answer on working days (Central European Time).                  |

To be helped quickly, send along:

- the Relay version (**Administration → Overview**) and how it runs (Docker Compose or Kubernetes);
- what you did, what you expected and what happened instead;
- the matching lines from the logs, with names and addresses removed if you prefer.

Never send `SECRET_KEY`, passwords, tokens or backups.

## Security problems

Report a security problem privately to the address on the site's
[security page](https://relay.velarix.nl/security), not as a public issue. We confirm a report
within three working days and say what we are doing about it within ten. Fixes go into the newest
release and are named in the [release notes](release-notes.md).

## Versions

Relay uses semantic versioning: `major.minor.patch`.

- **Patch** releases fix problems; **minor** releases add features. Both upgrade in place.
- A **major** release may need an action, described under **Action needed** in its release
  notes.
- You can always upgrade straight from any older version to the newest; you never have to step
  through the versions in between.
- Fixes, including security fixes, go into the newest release only. Stay on the newest version
  to receive them.
- Going back to an older version means restoring a backup made by it
  ([upgrade guide](upgrade-guide.md#if-something-goes-wrong)).

## What Relay runs on

| Part                | Supported                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Database            | PostgreSQL 18                                                                                                    |
| Store               | Valkey 8 or 9                                                                                                    |
| File storage        | A local volume (one instance), or S3-compatible storage (Amazon S3, MinIO, SeaweedFS, Cloudflare R2, and others) |
| Calls               | LiveKit server 1.9                                                                                               |
| Search (Enterprise) | Built in (PostgreSQL), or OpenSearch 2.18 or newer 2.x                                                           |
| Running it          | Docker Compose 2.24 or newer; Kubernetes with Helm 3                                                             |
| Browsers            | The current and previous version of Chrome, Edge, Firefox and Safari                                             |
| Apps                | Windows 10 and 11 (Relay Desktop); see [Apps](apps.md) for the others                                            |

Every release is tested with PostgreSQL 18, Valkey 9, LiveKit 1.9, OpenSearch 2.18 and Chromium,
and the deploy files in `deploy` pin the versions it was released with.
