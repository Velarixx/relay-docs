# Identity: single sign-on, LDAP and SCIM

[Documentation](README.md) › Identity

People can sign in to Relay with a password, or through your organisation's identity provider
with OpenID Connect, OAuth 2.0, SAML 2.0 or an LDAP directory. With Enterprise, your identity
provider can also create, update and deactivate accounts through SCIM, and its groups can decide
who is in which room.

| What                                                                  | Edition    |
| --------------------------------------------------------------------- | ---------- |
| Sign-in with OIDC, OAuth 2.0, SAML 2.0 and LDAP, with role mapping    | Community  |
| LDAP directory sync (accounts, roles, deactivation)                   | Community  |
| Profile fields filled at sign-in; two-factor per role; session limits | Community  |
| SCIM 2.0 provisioning                                                 | Enterprise |
| Directory groups, and rooms and teams that follow them                | Enterprise |

## Adding a sign-in provider

Under **Administration → Sign-in**, choose **Add a provider** and pick its kind. Every provider has:

- **Identifier**: lower-case letters, digits and dashes, starting with a letter (2 to 32
  characters). It is part of the provider's addresses and cannot be changed later.
- **Button label**: what the sign-in page shows, such as "Sign in with Contoso".
- **Show on the sign-in page**: off keeps the provider set up but hidden.

The addresses to give your identity provider are shown on the same page:

| Kind               | Give the identity provider                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| OIDC and OAuth 2.0 | Redirect URI: `https://<your Relay>/api/v1/auth/sso/callback`                            |
| SAML 2.0           | Assertion Consumer Service: `https://<your Relay>/api/v1/auth/saml/acs` (HTTP-POST)      |
| SAML 2.0           | Service provider metadata: `https://<your Relay>/api/v1/auth/saml/<identifier>/metadata` |

### OpenID Connect

| Field                         | Default                                         | Meaning                                                        |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Issuer                        | (required)                                      | The provider's issuer URL; Relay reads its discovery document. |
| Client ID, client secret      | (ID required)                                   | From the application you registered at the provider.           |
| Scopes                        | `openid email profile`                          | Add the scope that returns groups if you map roles from them.  |
| Username, email, name, groups | `preferred_username`, `email`, `name`, `groups` | The claims Relay reads; dotted paths reach nested claims.      |

Relay uses the authorization code flow with PKCE, a `state` and a `nonce`. Outside development,
only `https://` endpoints are accepted.

### OAuth 2.0

For providers without OpenID Connect: the **authorization**, **token** and **userinfo** URLs,
the client ID and secret, and the scopes (none by default). Claims are read from the userinfo
answer, with the same claim settings as OIDC.

### SAML 2.0

| Field                                    | Default                                      | Meaning                                                   |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Identity provider sign-in URL            | (required)                                   | Where Relay sends people to sign in (the SSO URL).        |
| Identity provider signing certificate    | (required)                                   | PEM or base64; assertions must be signed with it.         |
| Identity provider entity ID              | (optional)                                   | Checked against the assertion's issuer when given.        |
| Relay entity ID                          | `relay`                                      | The audience your identity provider must use.             |
| Subject attribute                        | (the NameID)                                 | Which attribute identifies the person; empty uses NameID. |
| Username, email, name, groups attributes | `username`, `email`, `displayName`, `groups` | The attributes Relay reads.                               |

Every assertion must be signed and answer a request Relay made; one used before is refused.
Once saved, the provider's metadata address is shown under it in **Administration → Sign-in**;
give that address, or the file it serves, to your identity provider.

### LDAP

LDAP providers use the ordinary username and password form. Relay looks the person up with a
service account, then checks their password by binding as them.

| Field                                             | Default                                | Meaning                                                                                            |
| ------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| URL                                               | (required)                             | `ldaps://dc.example.com` (TLS) or `ldap://` on a trusted network.                                  |
| Bind DN and password                              | (anonymous)                            | The service account that searches the directory.                                                   |
| Base DN                                           | (required)                             | Where people are searched for, with everything below it.                                           |
| User filter                                       | `(\|(uid={login})(mail={login}))`      | `{login}` is what the person typed, escaped.                                                       |
| Subject, username, email, name, groups attributes | `uid`, `uid`, `mail`, `cn`, `memberOf` | For Active Directory, typically `objectGUID`, `sAMAccountName`, `mail`, `displayName`, `memberOf`. |
| Sync every (minutes)                              | 60                                     | 0 turns sync off; at most a week.                                                                  |

**Directory sync** runs at that interval (and with **Sync now**). It creates accounts for new
people in the base DN, updates names, email addresses, roles and profile fields, and
**deactivates and signs out** linked people the directory no longer returns. Owners are never
deactivated by a sync, and a search that returns nobody changes nothing, so a broken filter
cannot empty the workspace.

## How people are matched to accounts

At each sign-in through a provider:

1. Someone who signed in through this provider before gets the same account.
2. Otherwise, an existing account with the same email address is linked, when the provider
   vouches for the address: always for SAML and LDAP, for OIDC only when the `email_verified`
   claim is true, never for OAuth 2.0.
3. Otherwise a new account is made, with the role `member`, when **Create an account the first
   time someone signs in** is on (the default). New accounts join the default channels.

Without a match and with account creation off, the person sees that they have no account. When
the address belongs to an account that is not linked, they are told to sign in with their
password first. Deactivated accounts cannot sign in this way either. A person's own two-factor
sign-in still applies after the identity provider.

## Roles from groups

**Role mapping** has one `group = role` pair per line, for example `engineering = developer`.
At every sign-in and sync, mapped roles are added or removed to match the person's groups.
Roles given by hand are left alone, everyone keeps at least `member`, and the owner role cannot
be given this way. An LDAP group matches by its full DN or by its first value
(`cn=engineers,ou=groups,dc=example,dc=com` or `engineers`).

## Profile fields from sign-in

Under **Administration → Profile fields**, **Fill from sign-in attribute** names the claim,
SAML attribute or LDAP attribute that fills a field, such as `department`. It is refilled at
every sign-in and sync, and people cannot change it themselves.

## Two-factor sign-in and sessions

- **Administration → Roles → Require two-factor sign-in for _role_**: people with that role
  must set up an authenticator app or email codes before they can continue. Only an owner can
  change this for the owner role.
- **Administration → Settings → Accounts**: sign people out after a number of idle minutes, or
  after a number of days whatever they do (both off by default).

## SCIM 2.0 provisioning (Enterprise)

Your identity provider (such as Microsoft Entra ID, Okta or JumpCloud) can manage Relay
accounts and groups through SCIM 2.0:

1. Under **Administration → Provisioning**, name a token after the identity provider, choose
   **Make a token**, and copy it (`scim_…`); it is shown once.
2. In the identity provider's provisioning settings, set the tenant URL to
   `https://<your Relay>/scim/v2` and the secret token to that token.

| SCIM                                                                        | In Relay                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `userName`                                                                  | Username (required)                                                 |
| `displayName`, or `name.formatted`, or `name.givenName` + `name.familyName` | Display name                                                        |
| `emails`                                                                    | Email: the primary one, else the work one, else the first           |
| `active`                                                                    | Active; `false` deactivates the account and signs it out everywhere |
| `externalId`                                                                | Kept to match the person later                                      |
| Groups (`displayName`, `members`)                                           | A directory group (see below)                                       |

- **DELETE** on a user deactivates the account rather than removing it, so their messages keep
  their author.
- A user created for an email address that already has an account takes that account over.
- Filters (`eq`, `ne`, `co`, `sw`, `ew`, `gt`, `ge`, `lt`, `le`, `pr`, `and`, `or`, `not`),
  paging (`startIndex`, `count` up to 200) and PATCH (`add`, `replace`, `remove`) work as the
  standard says. Bulk requests, sorting and ETags are not supported, as `/ServiceProviderConfig`
  tells clients.
- When every seat of the licence is taken, creating or reactivating a user is refused with
  `409 tooMany`.
- Everything a token does is in the audit log, as `scim.*` with the token's name. **Revoke** a
  token on the same page to stop it at once.

## Directory groups (Enterprise)

Groups that arrive through SCIM, or in the groups claim or attribute of an OIDC, OAuth 2.0,
SAML or LDAP sign-in, become user groups in Relay, kept in step at each sign-in, sync or SCIM
change. They can be mentioned like any group (`@engineers`) but not edited or removed in Relay.

A room or team can **follow directory groups**: its owner picks them under **Room settings →
Members follow directory groups**. Everyone in those groups is then a member, and everyone else
is removed, except the room's owners. Members of such a room are changed only through the
groups; adding or removing people by hand is refused with an explanation.
