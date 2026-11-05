CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  impact TEXT DEFAULT 'neutral',
  importance TEXT DEFAULT '보통',
  horizon TEXT DEFAULT '단기',
  source TEXT,
  url TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  issue_key TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_created ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category, created_at DESC);
CREATE TABLE IF NOT EXISTS issues (
  issue_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  importance TEXT DEFAULT '보통',
  horizon TEXT DEFAULT '중기',
  sectors TEXT,
  first_seen TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status, updated_at DESC);
CREATE TABLE IF NOT EXISTS issue_updates (
  id TEXT PRIMARY KEY,
  issue_key TEXT NOT NULL,
  news_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(issue_key) REFERENCES issues(issue_key)
);
CREATE TABLE IF NOT EXISTS briefings (
  id TEXT PRIMARY KEY,
  summary TEXT,
  positive_json TEXT,
  negative_json TEXT,
  market_view TEXT,
  created_at TEXT NOT NULL
);
