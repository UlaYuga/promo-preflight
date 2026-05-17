# Promo Preflight — Integrations

## Currently supported

### Telegram bot

Promo Preflight sends a formatted message to a Telegram channel or group chat on every completed run. The message format depends on the verdict (`GO` / `WARN` / `BLOCK`) and includes the top blockers and assignable owners.

**Step-by-step setup**

**Step 1 — Create a bot**

Open Telegram and start a chat with [@BotFather](https://t.me/BotFather). Send `/newbot`, follow the prompts, and copy the token it gives you. It looks like `7412345678:AAHxxxxxxx`.

```bash
# Verify the token works
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
# Expected: {"ok":true,"result":{"id":...,"username":"YourBotName",...}}
```

**Step 2 — Create a private channel (or group)**

Create a new Telegram channel (e.g. `#promo-preflight-alerts`). Set it to private.

**Step 3 — Add the bot as admin**

Go to the channel settings → Administrators → Add Administrator. Search for your bot's username and add it. It needs the **Post Messages** permission.

**Step 4 — Get the channel chat_id**

Post any message in the private channel, then run:

```bash
curl -s https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates | jq '.result[] | {message: .message.chat.id, channel_post: .channel_post.chat.id}'
```

For a private channel, `chat_id` is negative and typically starts with `-100` (example: `-1001234567890`). If `getUpdates` is empty, post one more message in the channel and re-run the command.

**Step 5 — Save `.env.local` values**

```env
TELEGRAM_BOT_TOKEN=7412345678:AAHxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
```

**Step 6 — Test the bot with `sendMessage`**

```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"-1001234567890","text":"Preflight Telegram adapter test","parse_mode":"MarkdownV2"}'
```

Expected response includes `"ok": true` and the message appears in your private channel.

**Step 7 — Restart the worker**

```bash
# local
npm run worker

# or docker-compose
docker compose restart worker
```

**Step 8 — Trigger a BLOCK run and confirm delivery**

Trigger a run via API using a fixture that produces blockers:

```bash
curl -X POST http://localhost:3000/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @./schemas/fixtures.ts.json
```

Confirm the run returns `verdict: "BLOCK"` and, within ~1 outbox poll interval, a Telegram message appears in the channel. A `BLOCK` verdict message looks like:

```
🚨 Run abc-123 BLOCKED (3 blockers, 2 warnings)
Campaign: BR Welcome Q2 2026 (BR)
Owners to notify: legal, compliance, payments
Top blockers:
• [BLOCK] BR-SPA-LICENSE-REQUIRED — T&C for BR must include the SPA/MF license number
• [BLOCK] BR-FORBIDDEN-PHRASE-GARANTIDO — 'bônus garantido' prohibited by CONAR 2024
• [BLOCK] IN-UPI-GAMING-BLOCKED — UPI blocked for gaming by NPCI since Q3 2022
View: http://localhost:3000/runs/abc-123
```

## Roadmap

The following adapters are scoped for future sprints. Each implements the `IHandoffAdapter` port from `application/port/handoff.ts`.

| Adapter | What it does | Port | Config |
|---|---|---|---|
| **Slack incoming webhook** | Posts the same verdict message to a Slack channel | `ISlackHandoffAdapter` | `SLACK_WEBHOOK_URL` |
| **Jira issue creator** | Opens a Jira ticket for each `BLOCK` verdict with blockers as sub-tasks | `IJiraHandoffAdapter` | `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` |
| **Linear issue creator** | Creates a Linear issue in a configured team/project | `ILinearHandoffAdapter` | `LINEAR_API_KEY`, `LINEAR_TEAM_ID` |
| **Discord webhook** | Sends embed messages to a Discord channel | `IDiscordHandoffAdapter` | `DISCORD_WEBHOOK_URL` |
| **Generic webhook** | POSTs the raw run JSON to any URL | `IGenericWebhookAdapter` | `WEBHOOK_URL`, `WEBHOOK_SECRET` |

## Building your own adapter

1. Implement `IHandoffAdapter` from [`application/port/handoff.ts`](../application/port/handoff.ts):
   ```ts
   export interface IHandoffAdapter {
     notify(event: RunCompletedEvent): Promise<void>;
   }
   ```
2. Create your implementation in `infrastructure/` (e.g. `infrastructure/slack/SlackAdapter.ts`).
3. Register it in the DI registry at `infrastructure/registry/index.ts` under a new adapter key.
4. Set `HANDOFF_ADAPTER=your-adapter-name` in `.env`.
5. No changes to core domain or application code are needed.

See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for a full explanation of the port/adapter pattern used throughout Preflight.
