# All-in-One Discord Bot (Gemini AI + Tickets + Moderation)

A single Node.js bot built with **discord.js v14** that includes:

- 👋 Custom welcome messages on member join
- 🎫 Private ticket system (button-based, auto-permissioned channel per user)
- 🤖 Gemini AI auto-replies inside open tickets (pauses once a staff member claims)
- `/ai` — ask the AI assistant anywhere
- Ticket **Claim** / **Close** buttons, with an optional transcript log channel
- 🛡️ Owner mention protection (auto-deletes non-staff pings of the owner)
- 🔨 Moderation: `/ban`, `/kick`, `/timeout`, `/warn add|list|clear`, `/clear`, `/role add|remove`, `/slowmode`, `/lockdown lock|unlock`
- 🧹 Auto-mod: spam detection, banned-word filter, invite-link blocking, mass-mention blocking (all configurable in `.env`)
- 📋 Mod logs: bans/kicks/timeouts/warns/role changes/lockdowns, message edits & deletes, and member joins/leaves posted to a log channel
- 🎭 Auto-role on join (optional)
- 🧰 Utility: `/help`, `/userinfo`, `/serverinfo`, `/avatar`, `/poll`
- 🏆 Leveling: message-based XP, `/rank`, `/leaderboard`, level-up announcements
- 🎉 Giveaways: `/giveaway start|end|reroll`, button-based entry, optional **Server Tag required to enter**
- 🎭 Self-assign roles: `/role-panel` posts a button panel members can click to add/remove roles
- 💬 Custom commands: `/customcommand add|remove|list` — staff-defined `!trigger` → response text
- 🎲 Fun: `/8ball`, `/coinflip`, `/roll`, `/rps`
- 📢 `/announce` for staff announcements
- All commands are Discord **slash commands**

## 1. Prerequisites

- Node.js 18 or newer
- A Discord bot application: https://discord.com/developers/applications
- A Gemini API key: https://aistudio.google.com/apikey

## 2. Discord Developer Portal setup

1. Create an application → add a **Bot**.
2. Under **Bot → Privileged Gateway Intents**, enable:
   - Server Members Intent
   - Message Content Intent
3. Copy the **Bot Token** and the **Application (Client) ID**.
4. Invite the bot with this permission set (or just "Administrator" for simplicity while testing):
   `Manage Channels, Manage Roles, Manage Messages, Kick Members, Ban Members, Moderate Members, Send Messages, Read Message History, Embed Links, Add Reactions, View Channels`

   Invite URL template:
   `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands`

## 3. Install & configure

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Notes |
|---|---|
| `DISCORD_TOKEN` | Your bot token |
| `CLIENT_ID` | Your application/client ID |
| `GUILD_ID` | Optional — set while testing so slash commands register instantly in one server. Leave blank for global (slower to propagate). |
| `GEMINI_API_KEY` | From Google AI Studio |
| `GEMINI_MODEL` | Defaults to `gemini-2.0-flash`. Google renames/retires models periodically — check https://ai.google.dev/gemini-api/docs/models if you get a 404 from the API. |
| `OWNER_ID` | User ID to protect from being pinged by regular members |
| `TICKET_CATEGORY_ID` | Category new ticket channels get created under |
| `SUPPORT_ROLE_ID` | Role that can see all tickets and is exempt from owner-protection |
| `TICKET_LOG_CHANNEL_ID` | Optional — where a summary is posted when a ticket closes |
| `ANNOUNCE_CHANNEL_ID` | Optional default channel for `/announce` |
| `MOD_LOG_CHANNEL_ID` | Optional — channel where mod actions, edits/deletes, and joins/leaves get logged |
| `WELCOME_ENABLED` | `true`/`false` — turn the join welcome message on/off (auto-role and join logging keep working either way) |
| `AUTO_ROLE_ID` | Optional — role automatically given to new members on join |
| `AUTOMOD_ENABLED` | `true`/`false` — master switch for auto-mod |
| `AUTOMOD_BANNED_WORDS` | Comma-separated list of words/phrases to auto-delete |
| `AUTOMOD_BLOCK_INVITES` | `true`/`false` — auto-delete Discord invite links from non-staff |
| `AUTOMOD_MAX_MENTIONS` | Delete messages that mention more users than this |
| `AUTOMOD_SPAM_COUNT` / `AUTOMOD_SPAM_WINDOW_SECONDS` | e.g. 5 messages within 7 seconds triggers a short timeout + delete |
| `CUSTOM_COMMAND_PREFIX` | Prefix for custom commands (default `!`) |
| `XP_ENABLED` / `XP_PER_MESSAGE` / `XP_COOLDOWN_SECONDS` / `XP_ANNOUNCE_LEVEL_UP` | Leveling system tuning |

## Giveaways & the "Server Tag" requirement

`/giveaway start` has a **"require_server_tag"** option. When enabled, only members who have
*this server's* [Server Tag](https://support.discord.com/hc/en-us/articles/31444248479639) equipped
on their Discord profile can click **Enter Giveaway** — anyone else gets an ephemeral message telling
them to equip it first. This uses Discord's `primaryGuild` field on the user object, so it only works
for servers that have Server Tags enabled (available to communities/servers that meet Discord's
requirements for the feature).

## 4. Deploy slash commands & run

```bash
npm run deploy   # registers all slash commands with Discord
npm start        # starts the bot
```

## 5. Using it

- Run `/ticket-panel` in any channel (staff-only) to post the "Open a Ticket" button.
- When a member opens a ticket, a private channel is created and the AI assistant answers their messages automatically.
- Staff can hit **Claim** to take over (this pauses the AI for that ticket) or **Close Ticket** to archive and delete the channel.
- `/ai <question>` works in any channel for quick one-off answers.
- Moderation and utility commands are permission-gated via Discord's built-in slash-command permissions (`ManageGuild`, `BanMembers`, etc.) — adjust per-server in **Server Settings → Integrations** if you want finer control.

## Project structure

```
index.js                  Bot entry point (loads commands + events)
deploy-commands.js        Registers slash commands with Discord
config.js                 Loads .env into one object
commands/
  moderation/              ban, kick, timeout, warn, clear, role, slowmode, lockdown
  utility/                 help, userinfo, serverinfo, avatar, poll
  tickets/                 ticket-panel
  ai/                      ai
  leveling/                rank, leaderboard
  giveaway/                giveaway (start/end/reroll)
  roles/                   role-panel
  customcommands/          customcommand (add/remove/list)
  fun/                     8ball, coinflip, roll, rps
  announce/                announce
events/
  ready.js                 sets bot presence
  guildMemberAdd.js        welcome messages + auto-role + join log
  guildMemberRemove.js     leave log
  messageCreate.js         owner protection + auto-mod + ticket AI replies
  messageDelete.js         logs deleted messages
  messageUpdate.js         logs edited messages
  interactionCreate.js     routes slash commands + buttons
utils/
  gemini.js                Gemini REST API wrapper
  ticketManager.js         ticket create/claim/close logic + storage
  warnsStorage.js          JSON-file warn storage
  automod.js               spam/banned-word/invite/mention filtering
  modLog.js                sends embeds to the mod log channel
data/                      auto-created JSON storage (tickets.json, warns.json)
```

## Notes & next steps

- Storage is flat JSON files under `data/` — fine for a small/medium server. For heavier use, swap `utils/ticketManager.js` and `utils/warnsStorage.js` for a real database (SQLite/Postgres).
- For 24/7 uptime, deploy to a host like Railway, Fly.io, or a small VPS, and run `npm start` under a process manager (e.g. `pm2`) or a Docker container.
- Never commit your `.env` file — it's already in `.gitignore`.
