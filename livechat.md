# Livechat and customer messaging

[Documentation](README.md) › Livechat

Livechat brings customers into Relay: from a chat window on your website, by email, and with
Enterprise from WhatsApp, text messages and Telegram. Agents answer them in Relay, in the same
app their team chats in. How agents work is in the [user guide](user-guide.md#livechat-for-support-agents).

## The chat window on your website

1. Under **Administration → Settings → Livechat**, switch livechat on and list the sites that may
   show the window under **Websites that may show the widget**, for example
   `https://www.example.com`. Other sites cannot frame it.
2. Give some people the **livechat agent** role (Administration → People), and set up
   departments under **Livechat → Departments and agents** if you route by team.
3. Put this line on every page that should offer the chat, before `</body>`:

   ```html
   <script src="https://chat.example.com/widget/loader.js" async></script>
   ```

The window asks visitors their name and email first, offers a form for a message when no agent
is available, and can send the customer a transcript. Its texts and greeting are set on the same
settings page. When your website already knows who the visitor is, see
[Recognised visitors](#recognised-visitors).

## Messaging channels (Enterprise)

Besides the chat on your website and email, livechat can take customers in from WhatsApp, text
messages (SMS) and a Telegram bot (Enterprise). Every channel feeds the same queue, with the
same routing, departments and reports; agents answer in the conversation as usual, and their
text, pictures and files go back out on the channel the customer used.

Connect a channel under **Livechat → Departments and agents → Messaging channels**:

- **WhatsApp** (the business API): the service address (`https://graph.facebook.com/v19.0`),
  the phone number ID and business account ID, an access token, the app secret (Relay checks
  every delivery against it) and a verify token you choose. Then, in WhatsApp's settings, set
  the webhook to the address Relay shows, with that verify token. WhatsApp allows free replies
  for 24 hours after the customer's last message; after that, agents see a notice and can send
  one of your approved templates instead, filling in its values.
- **SMS** through a gateway that speaks the widely used Twilio-style API: its address, your
  account ID, the sending number and the auth token. Point the gateway's incoming-message
  webhook at the address Relay shows; Relay checks its signature on every delivery.
- **Telegram:** `https://api.telegram.org` and the bot's token. Relay sets the bot's webhook
  itself, with a secret it checks on every delivery.

Tokens are stored encrypted and never shown again. A delivery that is not signed by the
service is refused, and a message delivered twice is taken in once. Files agents send are
fetched by the service from a link that works for one day. When an answer cannot be delivered,
the conversation says so. Choose a department per channel to route its conversations there.

## Routing

Departments that assign conversations automatically (round-robin or least busy) also:

- give a **returning customer** the agent who helped them last, when that agent is available
  and has room (**Settings → Livechat → Give returning customers the agent who helped them
  last**);
- route by **skill**: give agents skills in the agents list, such as `billing` or a language
  as `lang:nl`, and a department the skills its conversations need. The widget passes the
  visitor's language as `lang:xx`. A skill only narrows the choice when at least one agent in
  the department has it, so a customer is never left waiting for a skill nobody was given.

**Opening hours** can be set per department under its settings; a department without hours of
its own follows the general ones, and the widget shows closed departments as closed. **Queue
limit:** with **Customers waiting before the widget offers the offline form** set, new visitors
can leave a message instead of joining a long queue. **Closing after a silence:** set how many
minutes without a message close a conversation, and the message the customer then gets; waiting
customers are never closed this way.

## Recognised visitors

When your website knows who a visitor is (they are signed in there), it can tell the widget, so
they are not asked their name and email and their conversations join one contact. Set
**Settings → Livechat → Identity secret** to a long random value that only your website and
Relay know. Your website then puts a token on the widget's script tag:

```html
<script src="https://chat.example.com/widget/loader.js" data-identity="TOKEN" async></script>
```

The token is `PAYLOAD.SIGNATURE`: `PAYLOAD` is the base64url of a JSON object with `id`
(the customer's id in your system), `name`, `email` and `exp` (expiry in Unix seconds, at most
seven days ahead), and `SIGNATURE` is the base64url HMAC-SHA256 of the `PAYLOAD` text with the
secret. Make it on your server for each page; never put the secret in the page. A token that is
unsigned, altered, expired or signed with another secret is ignored, and the visitor is asked
who they are as usual.

## Bots that answer first

Under **Livechat → Departments and agents → Bot first** you choose who replies to new
conversations before people do:

- **The answers bot**, built in: it answers from the questions and replies you write there,
  when most of the words of one of your questions appear in what the customer wrote. When it has
  no reply, or the customer asks for a person, it says it is finding someone and hands the
  conversation to the queue with a note saying what it could not answer.
- **A bot account of your own** (see Integrations): it holds new conversations, hears each
  customer message through an outgoing webhook with the `livechat.message` event, answers with
  its token like any bot, and hands over with
  `POST /api/v1/livechat/conversations/{roomId}/handover` and a `note` for the agent.

Once a conversation has been handed over, no bot answers it again.

## Contact fields and merging

Under **Livechat → Departments and agents → Contact fields**, managers add fields every contact
gets, such as a customer number or a plan: text, a number, a date or a choice from a list. Agents
fill them in on the contact page, and they are checked against their kind. When one customer
has two contacts (say, two email addresses), a manager opens one and merges the other into it:
conversations, channel addresses and details move over, the kept contact's own details win, and
the other contact is removed. Merging is recorded in the audit log.

## Conversation events

Outgoing webhooks can also report customer conversations: `livechat.opened`, `livechat.taken`,
`livechat.closed`, `livechat.rated` and `livechat.message`. Each
carries the conversation: its status, channel, department, agent, contact (name, email, phone)
and score. Customer conversations go only to webhooks set up for the whole workspace with these
events chosen, never to webhooks limited to a room.

## Satisfaction

When a conversation closes, the customer is asked for a score from 1 to 5 and a comment: in the
widget, or with a message on email and messaging channels, where a reply starting with a number
is taken as the score (within a week). Scores appear on the conversation for agents and in
**Livechat → Reports**, on average and per agent and department. Switch it off with
**Settings → Livechat → Ask customers for a score**; **Language for messages to customers**
sets the language of the question on email and channels.
