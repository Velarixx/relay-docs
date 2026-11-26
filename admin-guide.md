# Relay administrator guide

[Documentation](README.md) › Administrator guide

For the people who install and run Relay. Each part has a guide of its own; this page says
which one to read when. For using Relay, see [the user guide](user-guide.md).

## Setting it up

| Guide                                           | What it covers                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| [Install](install.md)                           | Requirements, Docker Compose, Kubernetes with Helm, every setting       |
| [Identity](identity.md)                         | Single sign-on with OIDC, OAuth 2.0, SAML and LDAP; SCIM; two-factor    |
| [Livechat](livechat.md)                         | The chat window on your website, channels, routing and bots             |
| [Calls and meetings](calls.md)                  | LiveKit with Docker Compose or your own, recording, captions, firewalls |
| [AI assistant](ai-assistant.md)                 | Summaries, answers, translation and agents with a model you choose      |
| [Connected workspaces](connected-workspaces.md) | Rooms shared with another organisation's Relay                          |
| [Apps](apps.md)                                 | Relay Desktop, the mobile apps and notifications while they are closed  |
| [Production checklist](production-checklist.md) | What to check before people rely on Relay                               |

## Keeping it running

| Guide                                     | What it covers                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| [Operate](operate.md)                     | Health and monitoring, backups, new versions, the admin console, extensions  |
| [Security and data flows](security.md)    | Every outside connection and how to switch it off, running without internet  |
| [Sizing](sizing.md)                       | Layouts by number of people, pooling, storage, measurements                  |
| [High availability](high-availability.md) | Running without a single point of failure, and restoring after losing it all |
| [Upgrade guide](upgrade-guide.md)         | Moving to a new version, and going back                                      |
| [Troubleshooting](troubleshooting.md)     | The most common problems and their fixes                                     |
| [Importing data](import-format.md)        | People and messages from CSV, Slack, Mattermost or the Relay format          |

## Editions and help

[Editions](editions.md) compares Community and Enterprise, [Licensing](licensing.md) explains
licence keys, and [Support](support.md) says where to ask and which versions are supported.
What changed in each version is in the [release notes](release-notes.md).
