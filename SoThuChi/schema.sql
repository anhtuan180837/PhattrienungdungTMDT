CREATE TABLE IF NOT EXISTS transactions (
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
 category TEXT NOT NULL CHECK(category IN ('Lương & thưởng','Thu nhập khác','Ăn uống','Di chuyển','Học tập','Mua sắm','Sinh hoạt','Khác')),
 amount INTEGER NOT NULL CHECK(amount > 0 AND amount <= 1000000000000),
 transaction_date TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('planned','completed')),
 note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

