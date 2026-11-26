# Editions

[Documentation](README.md) › Editions

Relay comes in two editions from the same software. **Community** is free and has no limit on
people, rooms or messages. **Enterprise** adds the features below, switched on by a licence key
([Licensing](licensing.md)); prices are on [relay.velarix.nl](https://relay.velarix.nl/#pricing).
Both are covered by the [Relay Licence Agreement](licence-agreement.md).

The site's comparison is made from the same list as this table.

<!-- editions-table -->

|                                                                                                                                         | Community | Enterprise |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| Channels, private rooms, direct messages, threads, files and search                                                                     | yes       | yes        |
| Voice and video calls with screen sharing                                                                                               | yes       | yes        |
| Single sign-on (OIDC, SAML, LDAP) and two-factor sign-in                                                                                | yes       | yes        |
| Roles and permissions, guests, an audit log and an admin console                                                                        | yes       | yes        |
| A livechat widget for your website, with agents and departments                                                                         | yes       | yes        |
| Webhooks, bots, slash commands, an API and extensions                                                                                   | yes       | yes        |
| End-to-end encrypted private rooms                                                                                                      | yes       | yes        |
| Runs with Docker Compose or on Kubernetes                                                                                               | yes       | yes        |
| [Message auditing](#message-auditing)                                                                                                   | no        | yes        |
| [Read receipts](#read-receipts)                                                                                                         | no        | yes        |
| [Guest management](#guest-management)                                                                                                   | no        | yes        |
| [Retention policies and legal hold](#retention-policies-and-legal-hold)                                                                 | no        | yes        |
| [Compliance export](#compliance-export)                                                                                                 | no        | yes        |
| [Engagement dashboard](#engagement-dashboard)                                                                                           | no        | yes        |
| [Attribute-based room access](#attribute-based-room-access)                                                                             | no        | yes        |
| [Advanced livechat](#advanced-livechat)                                                                                                 | no        | yes        |
| [Device policy](#device-policy)                                                                                                         | no        | yes        |
| [Data-loss rules](#data-loss-rules)                                                                                                     | no        | yes        |
| [AI assistant](#ai-assistant)                                                                                                           | no        | yes        |
| [Message translation](#message-translation)                                                                                             | no        | yes        |
| [Provisioning (SCIM) and directory groups](#provisioning-scim-and-directory-groups)                                                     | no        | yes        |
| [Audit stream to your log collector](#audit-stream-to-your-log-collector)                                                               | no        | yes        |
| [Terms of use, network rules and classification labels](#terms-of-use-network-rules-and-classification-labels)                          | no        | yes        |
| [Burn after reading and message flagging](#burn-after-reading-and-message-flagging)                                                     | no        | yes        |
| [Call recording](#call-recording)                                                                                                       | no        | yes        |
| [Live captions, transcripts and call summaries](#live-captions-transcripts-and-call-summaries)                                          | no        | yes        |
| [OpenSearch as the search provider](#opensearch-as-the-search-provider)                                                                 | no        | yes        |
| [Workflow reports: run history, time per stage and timeline exports](#workflow-reports-run-history-time-per-stage-and-timeline-exports) | no        | yes        |
| [Connected workspaces: rooms shared with other Relay servers](#connected-workspaces-rooms-shared-with-other-relay-servers)              | no        | yes        |

<!-- /editions-table -->

When a licence ends, Enterprise features switch off; nothing made with them is deleted, and it
all comes back with a new licence. Guests are part of Community; **guest management** (a guest
seat count, expiry dates and a report) is Enterprise.

## Enterprise features

### Message auditing

Auditors (the **admin.audit.messages** permission) search every message in the workspace,
including private rooms and direct messages, under **Administration → Message audit**. Every
audit search is itself written to the audit log. Encrypted rooms stay unreadable.

### Read receipts

People see who has read each message in a room.

### Guest management

Guests count against a separate guest seat number, can be given an expiry date after which
they can no longer sign in, and appear in a guest access report under
**Administration → Guests**.

### Retention policies and legal hold

Admins set how long messages are kept, for the workspace and per room, under
**Administration → Retention**. A legal hold on a room or person keeps everything that would
otherwise be deleted, until the hold is lifted.

### Compliance export

Export the messages of chosen rooms or people, once or on a schedule (daily or weekly), as
JSON, CSV or EML, to the storage bucket or an SFTP server. Each export has a manifest with
checksums. See [Compliance export](compliance-export.md).

### Engagement dashboard

Active people, messages and the busiest rooms over time, under **Administration → Engagement**.

### Attribute-based room access

A room can require attributes of the people who join it, such as a department or a country,
taken from single sign-on or the directory. People without them cannot join or be added.

### Advanced livechat

Priorities with response-time targets, an estimate of the wait for visitors in the queue,
supervisors watching conversations live, PDF transcripts, and WhatsApp, SMS and Telegram as
channels next to the website and email. See [Livechat](livechat.md).

### Device policy

Which platforms may sign in, how many devices a person may use, and whether signing in from a
new device needs confirmation by email. See [Device policy](device-policy.md).

### Data-loss rules

Patterns, such as card or account numbers, that block a message or mask the match before it is
posted. See [Data-loss rules](data-loss-rules.md).

### AI assistant

Summaries of threads and of what someone missed, answers to questions with links to the
messages they came from, reply suggestions for livechat agents, and agents in rooms, using a
model you choose. See [AI assistant](ai-assistant.md).

### Message translation

Translate messages into the reader's language, through your language model or a
LibreTranslate-compatible server. See [AI assistant](ai-assistant.md).

### Provisioning (SCIM) and directory groups

Your identity provider creates, changes and deactivates people through SCIM 2.0, and groups
from SCIM, LDAP, SAML or OIDC become user groups that rooms and teams can follow. See
[Identity](identity.md).

### Audit stream to your log collector

Every audit event is sent as JSON to a syslog collector over TLS or to an HTTPS address, kept
while the collector is unreachable and delivered afterwards, under
**Administration → Audit log**.

### Terms of use, network rules and classification labels

- **Terms of use:** a text people must accept before using the workspace, and again after it
  changes; acceptances can be exported.
- **Network rules:** the address ranges that may open the admin console, use access tokens or
  sign in at all.
- **Classification labels:** levels you define, shown as a banner on a room and its exports,
  with a highest level guests may enter.

### Burn after reading and message flagging

- **Burn after reading:** a message disappears for each reader a set time after they open it,
  and stays out of search and notifications. A legal hold keeps a copy.
- **Flagging:** anyone can flag a message as sensitive; it is hidden until a reviewer restores
  or removes it, and every step is in the audit log.

### Call recording

Permitted people record a call; everyone in it, including people who join later, sees that it
is being recorded. The recording arrives in the room as a file. See
[Calls and meetings](calls.md).

### Live captions, transcripts and call summaries

Captions during a call and a transcript kept with it, through a speech-to-text server you
choose; with the assistant on, a summary is posted to the room. See
[Calls and meetings](calls.md).

### OpenSearch as the search provider

For large workspaces, search runs on an OpenSearch cluster, with the same access rules. If the
cluster cannot be reached, Relay searches with its built-in search and tells admins. See
[Operate](operate.md#search).

### Workflow reports: run history, time per stage and timeline exports

The history of workflow runs, the time spent per stage and overdue tasks, and each run's
timeline as PDF or CSV.

### Connected workspaces: rooms shared with other Relay servers

Share a room with another organisation's Relay server; each side keeps its own accounts,
permissions, retention and audit log. See [Connected workspaces](connected-workspaces.md).
