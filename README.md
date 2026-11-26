<div align="center">

<img src="images/logo.svg" width="64" height="64" alt="Relay logo" />

# Relay documentation

Everything you need to use, run and extend Relay.<br />
These pages are part of the product and are updated with every release.

</div>

## Start here

<table>
<tr>
<td width="33%" valign="top">

### 💬 Use Relay

**[User guide](user-guide.md)**

Rooms, messages, threads, calls, notifications, search and keyboard shortcuts. Also for
livechat agents.

</td>
<td width="33%" valign="top">

### 🛠️ Run Relay

**[Admin guide](admin-guide.md)**

Install with Docker Compose or Kubernetes, sign-in, security, backups, sizing, high
availability and troubleshooting.

</td>
<td width="33%" valign="top">

### 🔌 Build on Relay

**[API guide](api-guide.md)**

Access tokens, the REST API, bots, webhooks, slash commands and interactive cards.

</td>
</tr>
</table>

## Get Relay running in two minutes

You need Docker with Compose. Relay itself is pulled as an image; the `deploy` folder holds
the files that run it.

```sh
git clone https://github.com/Velarixx/relay-docs.git
cd relay-docs/deploy/compose
```

Copy `.env.example` to `.env`, set `RELAY_DOMAIN=localhost` for a trial, and fill in
`SECRET_KEY` and `POSTGRES_PASSWORD` with long random values. Then:

```sh
docker compose up -d
```

Open <https://localhost> and follow the setup wizard. Your browser warns once about the trial
certificate, because `localhost` cannot get a public one. For a real installation with your own
domain, continue with [Install](install.md).

## All guides

### Using Relay

| Page                                              | What you will find                                               |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| [User guide](user-guide.md)                       | Everyday use, from your first message to calls and livechat      |
| [Messages](user-guide.md#messages)                | Formatting, mentions, threads, files, scheduling and commands    |
| [Encryption](user-guide.md#end-to-end-encryption) | What end-to-end encrypted rooms protect, and what they cannot do |
| [Finding things](user-guide.md#finding-things)    | The quick switcher, search and keyboard shortcuts                |
| [Apps](apps.md)                                   | Relay Desktop, the mobile apps and notifications                 |

### Running Relay

| Page                                            | What you will find                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| [Install](install.md)                           | Requirements, Docker Compose with automatic HTTPS, Helm, and every setting     |
| [Operate](operate.md)                           | Health and monitoring, backups, new versions, the admin console and extensions |
| [Identity](identity.md)                         | Single sign-on with OIDC, OAuth 2.0, SAML and LDAP, SCIM, two-factor sign-in   |
| [Livechat](livechat.md)                         | The chat window on your website, channels, routing and bots                    |
| [Calls and meetings](calls.md)                  | LiveKit with Docker Compose or your own, recording and captions                |
| [Security and data flows](security.md)          | Every outside connection and how to switch it off, running without internet    |
| [Sizing](sizing.md)                             | Layouts by number of people, measured capacity and storage                     |
| [High availability](high-availability.md)       | No single point of failure, and restoring after losing everything              |
| [Production checklist](production-checklist.md) | What to check before people rely on Relay                                      |
| [Troubleshooting](troubleshooting.md)           | The most common problems and their fixes                                       |
| [Upgrade guide](upgrade-guide.md)               | Upgrading, rolling upgrades on Kubernetes, and going back                      |
| [Importing data](import-format.md)              | Bringing people and history in from CSV, Mattermost, Slack or the Relay format |

### Enterprise

| Page                                            | What you will find                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| [Editions](editions.md)                         | Community and Enterprise compared, and every Enterprise feature        |
| [Licensing](licensing.md)                       | Subscriptions, activation keys, offline keys and what a licence covers |
| [AI assistant](ai-assistant.md)                 | Summaries, answers, reply suggestions, translation and agents          |
| [Connected workspaces](connected-workspaces.md) | Rooms shared with another organisation's Relay                         |
| [Device policy](device-policy.md)               | Which devices may sign in, how many, and confirming new ones           |
| [Data-loss rules](data-loss-rules.md)           | Blocking or masking sensitive text in messages                         |
| [Compliance export](compliance-export.md)       | Exporting messages and files for legal and audit requests              |

### Building on Relay

| Page                                       | What you will find                                                  |
| ------------------------------------------ | ------------------------------------------------------------------- |
| [API guide](api-guide.md)                  | Tokens, the REST API, bots, webhooks and commands                   |
| API reference                              | Every route and field, served by your own Relay at `/api/docs`      |
| [Writing an extension](extension-guide.md) | Starting one, the manifest, permissions, hooks and a worked example |

### Releases and support

| Page                                      | What you will find                                              |
| ----------------------------------------- | --------------------------------------------------------------- |
| [Release notes](release-notes.md)         | What changed in each version, and what to do about it           |
| [Support](support.md)                     | Where to ask, security reports, versions and what Relay runs on |
| [Licence agreement](licence-agreement.md) | The terms under which Relay may be used                         |

## A look at Relay

A channel in the middle of a working day, the roles and permissions an admin hands out, and
the page where an admin sees what each extension may do.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="images/chat-dark.png" />
  <img src="images/chat-light.png" alt="A Relay channel with messages, reactions, a code block and a thread" width="860" />
</picture>

<br /><br />

<img src="images/admin-roles.png" alt="The roles and permissions matrix in the admin console" width="860" />

<br /><br />

<img src="images/admin-extensions.png" alt="The extensions page, showing what each extension may do" width="860" />

</div>

## Help

- Something unclear or missing in these pages?
  [Open an issue](https://github.com/Velarixx/relay-docs/issues).

- Questions about your subscription? Use the link in your activation email to manage it, or
  see [licensing](licensing.md).
