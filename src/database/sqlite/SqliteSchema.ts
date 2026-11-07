/**
 * SQLite & Relational Database Schema Definitions
 * Provides SQL DDL statements matching the application's entity structures,
 * enabling seamless transition to SQLite or PostgreSQL without changing repository interfaces.
 */

export const SQLITE_TABLES_DDL = `
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  sub_id TEXT,
  name TEXT NOT NULL,
  source TEXT,
  region TEXT,
  route TEXT,
  responsible TEXT,
  phone TEXT,
  significance TEXT,
  status TEXT,
  balance_yer REAL DEFAULT 0,
  balance_sar REAL DEFAULT 0,
  balance_usd REAL DEFAULT 0,
  address TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_visits (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  date TEXT NOT NULL,
  type TEXT,
  purpose TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  status TEXT,
  min_stock_alert INTEGER DEFAULT 5,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  sub_id TEXT UNIQUE NOT NULL,
  main_id TEXT,
  date TEXT NOT NULL,
  movement_type TEXT NOT NULL, -- 'توريد' | 'صرف'
  beneficiary TEXT,
  category TEXT,
  status TEXT,
  items_json TEXT NOT NULL, -- JSON object of item quantities
  description TEXT,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  day TEXT,
  importance TEXT,
  movement TEXT, -- 'قبض' | 'صرف' | 'حساب له' | 'حساب عليه'
  restriction TEXT,
  movement_type TEXT,
  category_account TEXT,
  restriction_account TEXT,
  account_name TEXT,
  description TEXT,
  number TEXT,
  amount_yer REAL DEFAULT 0,
  amount_sar REAL DEFAULT 0,
  amount_usd REAL DEFAULT 0,
  attachment_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  movement_type TEXT NOT NULL, -- 'له' | 'عليه'
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  date TEXT,
  due_date TEXT,
  currency TEXT DEFAULT 'YER',
  is_completed INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority TEXT,
  status TEXT,
  category TEXT,
  operation TEXT,
  assignee TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  device_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  record_id TEXT,
  details TEXT,
  old_value_json TEXT,
  new_value_json TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  device_id TEXT,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
  record_id TEXT NOT NULL,
  payload_json TEXT,
  status TEXT DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL
);
`;
