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

CREATE TABLE IF NOT EXISTS user_sessions (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    step TEXT NOT NULL,
    domain TEXT,
    status TEXT,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watched_domains_status
ON watched_domains(status);

CREATE INDEX IF NOT EXISTS idx_watched_domains_user_id
ON watched_domains(user_id);