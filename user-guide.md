# Relay user guide

[Documentation](README.md) › User guide

Relay is your organisation's chat: channels for teams and topics, private rooms, direct
messages, calls, and the chat window customers use on your website.

## Getting started

- **Sign in** with the username or email and password you chose, or with your organisation's
  single sign-on button. If your admin requires it, you also set up two-factor sign-in with an
  authenticator app, email codes or recovery codes.
- **Your profile** (account menu → Settings): name, picture, language (English, Nederlands, Deutsch, Français or Español),
  light or dark theme, and notification preferences.
- **Your status**: set a short status with an emoji, and choose automatic, away, busy or
  appear offline. Relay marks you away by itself when you are idle.

## Rooms

- **Channels** are open to everyone in the workspace; find them in the **Directory**.
- **Private rooms** are for invited members only.
- **Direct messages** are one-to-one or small group conversations.
- **Teams** group rooms together; joining a team can add you to its rooms.
- **Discussions** split a topic off from a room or a message into its own room.
- **Broadcast rooms** are for announcements: only owners and moderators post; others reply
  in threads.

The sidebar groups your rooms into favourites, channels and direct messages, shows unread
counts and mentions, and can be sorted.

- **Bookmarks**: the bar at the top of a room keeps links, files and messages; its moderators
  add, name and order them (**Edit bookmarks**, or **Add to bookmarks** in a message's menu).
- **Who may do what**: in **Room settings**, moderators choose who may post, reply in threads,
  react, mention everyone and add people: everyone, everyone but guests, or moderators only.
  If you may not post, the message box says why.
- **Groups** such as `@design` are listed in the **Directory**. Mentioning a group notifies its
  members in that room, and **Add** in a room's member list can add a whole group.

## Messages

- Write in the box at the bottom and press **Enter** to send; **Shift+Enter** starts a new
  line. Formatting: `**bold**`, `_italic_`, `` `code` ``, code blocks with three backticks,
  lists, links, and `$math$`.
- **Mention** someone with `@name`; `@here` reaches people who are online, `@all` the whole
  room.
- Hover a message (or focus it with the keyboard) to **react**, **reply in a thread**,
  **quote**, **pin**, **star**, **edit**, **delete**, copy a **link**, or set a **reminder**.
- **Files**: drag them in, paste them, or use the paperclip. Images get previews; you can also
  record a voice message.
- **Out of office**: in **Set a status…**, choose **Out of office** and the day you are back.
  Anyone who sends you a direct message meanwhile gets one automatic notice.
- **Your profile** can show fields your admin added, such as job title or office
  (**Settings → Profile**).
- **Schedule** a message to be sent later.
- Drafts are kept per room until you send them. **Drafts** in the sidebar lists the ones on this
  device, with your scheduled messages; **Threads** lists every thread you follow and what is
  unread in it.
- **Priority**: above the message box, mark a message **Important** or **Urgent** and ask
  people to **acknowledge** it. You see who has; urgent messages remind those who have not a
  few times. Sending urgent messages needs permission.
- **Forward** a message (from its menu) to other rooms or people, with a note. The copy links
  back to the original. Members-only rooms allow it only when their moderators turn on
  **Allow forwarding**; encrypted rooms never.
- **Links to messages** show a preview of that message to everyone who may read it, and
  nothing to those who may not.
- **Video messages**: the 🎬 button records a clip of up to two minutes from your camera or
  your screen.
- **Slash commands**: type `/` to see them, for example `/invite`, `/topic` and `/status`.

### End-to-end encryption

Private rooms and direct messages can be encrypted end to end, so only members can read them.
You set a passphrase once; keep it safe, because it is the only way to read encrypted history
on a new device. Search, link previews and calls are not available in encrypted rooms.

## Finding things

- **Ctrl+K** (⌘K on Mac) opens the quick switcher: type part of a room or person's name and
  press Enter.
- **Search** finds messages across the rooms you can read.
- **Ask** on the home page (when your workspace has the assistant) answers a question from
  what was said in the rooms you can read, and lists the messages and files it used, each a
  link. Encrypted rooms are never used; when nothing fits, it says so.
- **Agents** your admins set up answer when you mention them (for example `@helper`) in a
  room they serve. They reply in a thread and can only find or do what you could yourself.
- **Ctrl+/** lists every keyboard shortcut. Everything in Relay works with the keyboard; the
  first Tab on any page offers **Skip to content**.

## Notifications

- The bell shows mentions, replies to your threads and reminders.
- Desktop and phone notifications can be switched on in Settings, per room too
  (all messages, mentions only, or nothing), and **do not disturb** silences them all.
- Unread mentions you have not seen are emailed after a short while, unless you turn that off.
- Relay installs as an app on your phone or computer from the browser's menu.

## The mobile apps

Relay for Android and for iPhone and iPad is the same Relay you know from the browser, in an
app of its own.

- **First start.** The app asks for your server's address, for example `chat.example.com`.
  Your administrator can tell you what it is. The app checks that a Relay server answers there
  and remembers it. To use another server, choose **Connect to a different server** on the
  sign-in page. If your organisation manages your device, the address may already be filled in.
- **Signing in** works as in the browser, including two-step sign-in and your organisation's
  single sign-on.
- **Notifications.** The app asks once whether it may notify you. After that, mentions, direct
  messages and incoming calls reach your phone while the app is closed. Tapping a notification
  opens that message, and the app's icon shows how much is unread. Do not disturb and your
  per-room choices apply here too. Your administrator decides how much of a message a
  notification shows; text from encrypted rooms is never shown.
- **Sharing.** Choose **Share** in another app and pick Relay to post text, a link or files in
  a room you choose.
- **Photos and calls.** The paperclip offers your camera and photo library, and voice and video
  calls work as in the browser. The app asks for the camera and microphone the first time.
- **App lock.** Under **Settings → Security**, switch on **Ask for fingerprint, face or passcode
  when opening the app**. Your workspace may require it.
- **Your devices.** **Settings → Security** lists everywhere you are signed in, the app on each
  phone included. Sign a device out there if you lose it; its notifications stop too.

## Calls

Start a voice or video call in any room, or call someone directly. You can mute, turn your
camera on or off, share your screen and choose your microphone and camera. Calls are not
available in encrypted rooms.

## Workflows

A workflow is a checklist a team works through together in a room: stages of tasks, each with
someone responsible and, if you like, a time it is due by. **Workflows** in the sidebar lists the
templates; people allowed to make them (admins, by default) create, change, export and import
them there.

Start a run from a template with **Workflows** at the top of a room, by typing
`/workflow start <template name>`, or by writing one of the template's keywords in a message.
Other systems can start one through the template's webhook address. Starting one in a new room
makes a private room for it.

Everyone in the room sees the checklist and works through it: tick tasks off, change who does
them, and comment on them; everyone else sees it happen at once. A task can run a slash command
or call a webhook when it is ticked off. The person who started the run owns it: if the template
asks for status updates, they are reminded to post one, and it goes to the room and to any rooms
that follow the run. Finishing the run posts a summary, and its timeline keeps who did what, and
when. A run in a private room is seen only by that room's members.

With an enterprise licence, people who manage workflows get **Reports** on the Workflows page:
every run with how long it and each of its stages took, and how many tasks ran late, filtered by
template and dates. A run's timeline can be downloaded as a PDF or CSV file from there, or from
the timeline under its checklist by anyone who can read the room.

## Livechat (for support agents)

If you are a livechat agent, **Livechat** in the sidebar shows waiting customers and your open
conversations. Take a conversation from the queue, answer with canned responses, add internal
notes the customer never sees, tag it, transfer it to a colleague or department, and close it
with a summary. Managers also see reports, business hours, departments and the monitoring view.

## Your data

From your account settings you can download an export of your own data, see and sign out your
other sessions, create personal access tokens for scripts, and delete your account.
