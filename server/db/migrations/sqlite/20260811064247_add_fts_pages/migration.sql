CREATE TABLE IF NOT EXISTS `pages` (
  `id` text PRIMARY KEY,
  `user_id` text,
  `title` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `metadata` text,
  `content` text DEFAULT '{"type":"doc","content":[]}',
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  CONSTRAINT `fk_pages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_page_title` ON `pages` (`title`);
CREATE INDEX IF NOT EXISTS `idx_page_author` ON `pages` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_page_created_at` ON `pages` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_page_updated_at` ON `pages` (`updated_at`);

-- FTS5 Virtual Table & Triggers for pages
CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
  id UNINDEXED,
  title,
  content
);

INSERT INTO pages_fts(id, title, content)
SELECT id, title, CAST(content AS TEXT) FROM pages;

CREATE TRIGGER IF NOT EXISTS pages_fts_ai AFTER INSERT ON pages BEGIN
  INSERT INTO pages_fts(id, title, content)
  VALUES (new.id, new.title, CAST(new.content AS TEXT));
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_ad AFTER DELETE ON pages BEGIN
  DELETE FROM pages_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_au AFTER UPDATE ON pages BEGIN
  DELETE FROM pages_fts WHERE id = old.id;
  INSERT INTO pages_fts(id, title, content)
  VALUES (new.id, new.title, CAST(new.content AS TEXT));
END;