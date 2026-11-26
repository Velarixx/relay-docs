# AI assistant, agents and translation

[Documentation](README.md) › AI assistant

The AI assistant and message translation are Enterprise features. With a licence that includes
them, two settings under **Administration → Settings → Messages** switch them on:

- **The assistant:** a summary button in threads, "What did I miss?" and **Ask** on the home
  page, and
  reply suggestions for livechat agents. It only ever uses what the person asking may read:
  never deleted messages, encrypted rooms, or internal livechat notes.
- **Translation:** "Translate" in a message's menu, into the reader's language.

## Who does the work

Set under **Administration → Settings → Assistant and translation**:

- **Built in** (the default) needs no account and sends nothing anywhere: summaries list who
  took part and the main points, and translation swaps a small English–Dutch word list. It is
  there to try the features, not to rely on.
- **A language model.** Give the address of any server that speaks the OpenAI-compatible API,
  up to and including `/v1`, the model's name, and a key if the server wants one. That covers
  models you host yourself (for example `http://ollama:11434/v1`) as well as hosted services.
  The same model can do the translating.
- **A translation service** that speaks the LibreTranslate API, which you can also host
  yourself.

Keys are stored encrypted and never shown again. When an outside service is chosen, people see
which host their text is sent to, next to the button that sends it, and the settings page lists
how many requests went out each day and how many tokens they used. If the service does not
answer, the person asking gets an error and nothing else is affected.

Under the same settings you can also set:

- **Further language models**, asked in the order you set when the model above does not answer.
  Each has its own address, model and key.
- **A model per feature**: Ask, summaries, reply suggestions, translation and agents can each
  use a different model of the main provider; empty means the main model.
- **Monthly limits** in tokens per person and per agent. Once someone has used theirs, the
  assistant tells them so until the next month. The settings page shows this month's use per
  person and per agent.
- **Keep prompts and answers** (off by default). While it is on, the last hundred prompts and
  answers can be read on the settings page; while it is off, nothing is kept.

## Customer conversations

With the assistant on (Enterprise), a customer conversation gets two things when it closes:
a short summary that only agents see, next to the agent's own closing note, and the livechat
tags it is about, chosen from the tags managers allow. Only what the customer saw is used;
internal notes are left out. The customer never receives the summary.

## Agents

**Administration → Agents** (Enterprise) defines agents: bots with instructions that answer
when someone mentions them in a room they serve, in a thread under the question. Give each a
username, a name, instructions, the rooms it serves and the tools it may use: search, reading
a thread, posting, setting a reminder and ticking off a workflow task.

Every tool runs with the permissions of the person who asked, so an agent never finds or does
more than they could themselves, and each use is recorded with who asked, what it touched and
whether it was allowed (the text involved is not recorded). An agent needs a language model
(see above); its use counts towards both its own and the asker's monthly limits. Agents never
answer bots, including each other, and never serve encrypted rooms. A workflow task with a slash
command that an agent ticks off leaves the command for a person.

What the assistant sends where is also listed in [Security and data flows](security.md).
