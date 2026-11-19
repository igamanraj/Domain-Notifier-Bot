# 🌐 Domain Notifier Bot

A Telegram bot that monitors domain names and notifies users when a previously registered domain becomes available.

Built with **Cloudflare Workers**, **Cloudflare D1**, **Telegram Bot API**, **IANA RDAP**, and **Cron Triggers**.

## ✨ Features

- 🔎 Check domain availability through RDAP
- 🌐 Support domains across different TLDs
- 🤖 Telegram bot interface
- 🔔 Monitor registered domains
- 🎉 Notify users when a monitored domain becomes available
- 🔄 Change the domain being checked
- 💾 Persistent domain storage using Cloudflare D1
- ⏰ Automatic domain checks every 12 hours
- ☁️ Serverless deployment with Cloudflare Workers
- 🔐 Telegram bot token stored as a Worker secret
- 👥 Per-user domain monitoring
- 🚫 No server, VPS, or `setInterval()` required

---

## 🏗️ Architecture

```text
                    Telegram User
                         │
                         │ Telegram Message
                         ▼
                ┌─────────────────────┐
                │   Telegram Bot API  │
                └──────────┬──────────┘
                           │ Webhook
                           ▼
                ┌─────────────────────┐
                │  Cloudflare Worker   │
                │                     │
                │  ├─ Telegram Logic  │
                │  ├─ Domain Checker  │
                │  ├─ Database Logic  │
                │  └─ Cron Handler    │
                └───────┬───────┬─────┘
                        │       │
                 D1 Database     │ RDAP
                        │       ▼
                        │   ┌──────────────┐
                        │   │ IANA RDAP    │
                        │   │ Bootstrap    │
                        │   └──────┬───────┘
                        │          │
                        │          ▼
                        │   Authoritative
                        │   RDAP Server
                        │
                        ▼
                ┌─────────────────────┐
                │ Cloudflare D1       │
                │                     │
                │ watched_domains     │
                │ user_sessions       │
                └─────────────────────┘

                         ▲
                         │
                    Cron Trigger
                    Every 12 hours
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript | Application logic |
| Cloudflare Workers | Serverless runtime |
| Cloudflare D1 | SQLite-based persistent database |
| Telegram Bot API | Bot communication |
| IANA RDAP Bootstrap | Finding authoritative RDAP servers |
| RDAP | Domain registration/availability checks |
| Cloudflare Cron Triggers | Scheduled domain monitoring |
| Wrangler | Cloudflare CLI and deployment |
| Vitest | Testing |

---

## 📁 Project Structure

```text
domain-notifier-worker/
│
├── src/
│   ├── index.js
│   ├── database.js
│   ├── domainChecker.js
│   ├── telegram.js
│   └── watcher.js
│
├── test/
│   └── index.spec.js
│
├── schema.sql
├── wrangler.jsonc
├── package.json
├── package-lock.json
├── vitest.config.mjs
├── .prettierrc
├── .editorconfig
├── .gitignore
└── README.md
```

### Source Files

#### `src/index.js`

Main Cloudflare Worker entry point.

Handles:

- Telegram webhook requests
- `/start`
- domain input
- `🔔 Notify Me`
- `🔄 Change Domain`
- scheduled events

#### `src/database.js`

Contains all D1 database operations.

Handles:

- user sessions
- watched domains
- domain status updates
- retrieving monitored domains

#### `src/domainChecker.js`

Checks domain availability using RDAP.

The process is:

```text
Domain
   ↓
Extract TLD
   ↓
IANA RDAP Bootstrap
   ↓
Find authoritative RDAP server
   ↓
Query /domain/{domain}
   ↓
HTTP 404 → Available
HTTP 200 → Registered
Other → Unknown/Error
```

#### `src/telegram.js`

Contains the Telegram Bot API integration.

The Worker communicates directly with Telegram using `fetch()`.

#### `src/watcher.js`

Handles scheduled monitoring.

It:

1. Gets all monitored domains from D1.
2. Checks each domain through RDAP.
3. Determines its current status.
4. Sends a Telegram message.
5. Updates the stored status.

---

# 🚀 Getting Started

## Prerequisites

You need:

- Node.js
- npm
- A Cloudflare account
- A Telegram account
- A Telegram bot
- Wrangler CLI

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

# 1. Clone the Repository

```bash
git clone https://github.com/igamanraj/Domain-Notifier-Bot.git
cd Domain-Notifier-Bot
```

---

# 2. Install Dependencies

```bash
npm install
```

---

# 3. Create a Telegram Bot

Open Telegram and search for:

```text
@BotFather
```

Create a new bot using:

```text
/newbot
```

BotFather will provide a bot token.

### ⚠️ Security

Never commit the Telegram bot token to GitHub.

Do not put it directly inside:

```text
src/
wrangler.jsonc
README.md
```

The token should be stored as a Cloudflare Worker secret.

---

# 4. Create the Cloudflare D1 Database

Create a D1 database:

```bash
npx wrangler d1 create domain-notifier-db
```

Cloudflare will return a database ID.

Add the database configuration to `wrangler.jsonc`:

```json
{
  "name": "domain-notifier-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-11-18",

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "domain-notifier-db",
      "database_id": "YOUR_DATABASE_ID"
    }
  ],

  "triggers": {
    "crons": [
      "0 0,12 * * *"
    ]
  }
}
```

Replace:

```text
YOUR_DATABASE_ID
```

with your actual Cloudflare D1 database ID.

---

# 5. Initialize the Database Schema

The project includes:

```text
schema.sql
```

Apply it to your remote D1 database:

```bash
npx wrangler d1 execute domain-notifier-db --remote --file=./schema.sql
```

Verify the tables:

```bash
npx wrangler d1 execute domain-notifier-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:

```text
watched_domains
user_sessions
```

---

# 6. Configure the Telegram Bot Token

Store the Telegram token as a Cloudflare Worker secret:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

Wrangler will prompt you to enter the token.

Do **not** put the token inside `wrangler.jsonc`.

---

# 7. Deploy the Worker

Deploy the Worker:

```bash
npx wrangler deploy
```

After deployment, Cloudflare will provide a Worker URL similar to:

```text
https://domain-notifier-worker.<your-subdomain>.workers.dev
```

---

# 8. Configure the Telegram Webhook

Set the Telegram webhook to your deployed Worker URL.

Using PowerShell:

```powershell
$token=$env:TELEGRAM_BOT_TOKEN

Invoke-RestMethod `
  -Method Post `
  -Uri ("https://api.telegram.org/bot" + $token + "/setWebhook") `
  -ContentType "application/json" `
  -Body (@{
      url="https://YOUR_WORKER_URL"
  } | ConvertTo-Json)
```

Replace:

```text
YOUR_WORKER_URL
```

with your deployed Cloudflare Worker URL.

Telegram should return:

```text
ok     result     description
--     ------     -----------
True   True       Webhook was set
```

---

# 🤖 Using the Bot

Open your Telegram bot and send:

```text
/start
```

The bot will ask for a domain.

For example:

```text
sanskargupta.dev
```

The bot checks the domain and returns its current status.

### Registered Domain

```text
❌ Domain unavailable.

🌐 example.com

This domain is currently registered.

What would you like to do?
```

The user can then select:

```text
🔔 Notify Me
```

The domain is stored in D1 and will be checked automatically.

### Available Domain

If the domain is available:

```text
🎉 Good news!

🌐 example.com

The domain appears to be AVAILABLE.
```

---

# 🔔 Domain Monitoring

When a user selects:

```text
🔔 Notify Me
```

the domain is stored in the `watched_domains` table.

Example:

```text
user_id:    1570694216
domain:     example.com
status:     registered
```

The Worker periodically checks all monitored domains.

---

# ⏰ Scheduled Monitoring

The project uses a Cloudflare Cron Trigger:

```text
0 0,12 * * *
```

Cron schedules use UTC.

For India Standard Time:

```text
00:00 UTC → 05:30 AM IST
12:00 UTC → 05:30 PM IST
```

The scheduled Worker executes:

```text
scheduled()
    ↓
checkWatchedDomains()
    ↓
getAllWatchedDomains()
    ↓
checkDomain()
    ↓
sendMessage()
    ↓
updateDomainStatus()
```

---

# 🗄️ Database

The project uses two main D1 tables.

## `watched_domains`

Stores domains that users want to monitor.

```sql
CREATE TABLE IF NOT EXISTS watched_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    username TEXT,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered',
    notified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, domain)
);
```

## `user_sessions`

Stores the current state of each user's bot interaction.

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    step TEXT NOT NULL,
    domain TEXT,
    status TEXT,
    updated_at TEXT NOT NULL
);
```

Persistent sessions are important because Cloudflare Workers are serverless and should not rely on an in-memory JavaScript `Map` for user state.

---

# 🔎 Domain Availability Detection

The bot uses the IANA RDAP bootstrap registry:

```text
https://data.iana.org/rdap/dns.json
```

The TLD is extracted from the domain.

For example:

```text
example.com
       ↓
      com
```

The IANA bootstrap registry is used to find the appropriate authoritative RDAP server.

The Worker then performs a request similar to:

```text
https://rdap-server.example/domain/example.com
```

The result is interpreted as:

| RDAP Response | Bot Status |
|---|---|
| HTTP 404 | Available |
| HTTP 200 | Registered |
| Other response | Unknown |
| Request failure | Error |

---

# 🧪 Local Development

Start the Worker locally:

```bash
npx wrangler dev
```

The local Worker normally runs at:

```text
http://127.0.0.1:8787
```

### Testing Cron Locally

Cloudflare does not automatically trigger scheduled events during local development.

Trigger one manually:

```bash
curl "http://127.0.0.1:8787/cdn-cgi/local/scheduled"
```

You should see logs similar to:

```text
⏰ Cron triggered!
🔎 Checking watched domains...
📭 No watched domains.
```

If your local D1 database contains watched domains, the Worker will check them.

---

# 🧪 Testing the Remote Database

To inspect the production D1 database:

```bash
npx wrangler d1 execute domain-notifier-db --remote --command="SELECT * FROM watched_domains;"
```

Example:

```text
id | user_id | username | domain | status
1  | 123456  | username | example.com | registered
```

---

# 🔐 Security

Never commit secrets.

The following files should not be committed:

```text
.env
.dev.vars
.wrangler/
node_modules/
```

The repository's `.gitignore` already excludes sensitive/local files.

Telegram bot tokens should be stored using Cloudflare Worker secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

If a bot token is accidentally exposed, immediately revoke/rotate it through BotFather.

---

# 📦 Deployment

The normal production deployment process is:

```bash
npm install
npx wrangler deploy
```

Cloudflare will deploy:

- Worker code
- D1 binding
- Cron configuration

The production Worker is then available through its Cloudflare Workers URL.

---

# 🔄 Updating the Bot

After making code changes:

```bash
git status
```

Review the changes.

Then:

```bash
git add .
git commit -m "describe your change"
git push
```

Deploy the new version:

```bash
npx wrangler deploy
```

---

# 🧹 Useful Wrangler Commands

### Start local development

```bash
npx wrangler dev
```

### Deploy

```bash
npx wrangler deploy
```

### View D1 tables

```bash
npx wrangler d1 execute domain-notifier-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### View watched domains

```bash
npx wrangler d1 execute domain-notifier-db --remote --command="SELECT * FROM watched_domains;"
```

### View user sessions

```bash
npx wrangler d1 execute domain-notifier-db --remote --command="SELECT * FROM user_sessions;"
```

### Update D1 schema

```bash
npx wrangler d1 execute domain-notifier-db --remote --file=./schema.sql
```

---

# 📌 Current Limitations

The current version intentionally keeps the bot simple.

Currently implemented:

- Domain checking
- Domain monitoring
- Scheduled checks
- Telegram notifications
- D1 persistence

Possible future improvements include:

- `/help`
- `/list`
- `/add`
- `/remove`
- Multiple domain management through Telegram commands
- Inline keyboards
- Configurable monitoring intervals
- Retry handling for temporary RDAP failures
- Rate limiting
- Better monitoring statistics
- Domain expiration information
- More detailed RDAP information

---

# 🛣️ Roadmap

### Version 1.0

- [x] Telegram bot
- [x] Domain availability checking
- [x] RDAP integration
- [x] Cloudflare Worker
- [x] Cloudflare D1
- [x] Telegram webhook
- [x] Domain monitoring
- [x] Cron-based checking
- [x] Telegram notifications

### Future

- [ ] `/help`
- [ ] `/list`
- [ ] `/add`
- [ ] `/remove`
- [ ] Multiple domains per user management
- [ ] Inline keyboard interface
- [ ] Better error/retry handling
- [ ] Rate limiting
- [ ] Monitoring dashboard

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch:

```bash
git checkout -b feature/my-feature
```

3. Make your changes.
4. Test the Worker locally.
5. Commit your changes:

```bash
git commit -m "feat: add my feature"
```

6. Push the branch:

```bash
git push origin feature/my-feature
```

7. Open a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

# 👨‍💻 Author

**Aman Raj**

GitHub:

https://github.com/igamanraj

---

## ⭐ Support

If this project was useful, consider giving the repository a ⭐ on GitHub.