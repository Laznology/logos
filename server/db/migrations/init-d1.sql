-- Migration tracking table
CREATE TABLE IF NOT EXISTS _hub_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ==========================================
-- Migration: 20260810082129_nosy_venus
-- ==========================================
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`avatar` text,
	`role` text DEFAULT 'user' NOT NULL,
	`provider` text,
	`provider_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_user_email` ON `users` (`email`);

CREATE INDEX `idx_user_name` ON `users` (`name`);

CREATE INDEX `idx_user_username` ON `users` (`username`);

CREATE INDEX `idx_user_role` ON `users` (`role`);

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260810082129_nosy_venus');

-- ==========================================
-- Migration: 20260811064247_add_fts_pages
-- ==========================================
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

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260811064247_add_fts_pages');

-- ==========================================
-- Migration: 20260811070203_reflective_cerise
-- ==========================================
PRAGMA foreign_keys=OFF;

CREATE TABLE `__new_pages` (
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

INSERT INTO `__new_pages`(`id`, `user_id`, `title`, `slug`, `metadata`, `content`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `title`, `slug`, `metadata`, `content`, `created_at`, `updated_at` FROM `pages`;

DROP TABLE `pages`;

ALTER TABLE `__new_pages` RENAME TO `pages`;

PRAGMA foreign_keys=ON;

CREATE INDEX `idx_page_title` ON `pages` (`title`);

CREATE INDEX `idx_page_author` ON `pages` (`user_id`);

CREATE INDEX `idx_page_created_at` ON `pages` (`created_at`);

CREATE INDEX `idx_page_updated_at` ON `pages` (`updated_at`);

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260811070203_reflective_cerise');

-- ==========================================
-- Migration: 20260811070457_solid_giant_girl
-- ==========================================
PRAGMA foreign_keys=OFF;

CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`username` text NOT NULL UNIQUE,
	`password` text,
	`avatar` text,
	`role` text DEFAULT 'user' NOT NULL,
	`provider` text,
	`provider_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

INSERT INTO `__new_users`(`id`, `email`, `name`, `username`, `password`, `avatar`, `role`, `provider`, `provider_id`, `created_at`, `updated_at`) SELECT `id`, `email`, `name`, `username`, `password`, `avatar`, `role`, `provider`, `provider_id`, `created_at`, `updated_at` FROM `users`;

DROP TABLE `users`;

ALTER TABLE `__new_users` RENAME TO `users`;

PRAGMA foreign_keys=ON;

DROP INDEX IF EXISTS `idx_user_email`;

DROP INDEX IF EXISTS `idx_user_username`;

CREATE INDEX `idx_user_name` ON `users` (`name`);

CREATE INDEX `idx_user_role` ON `users` (`role`);

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260811070457_solid_giant_girl');

-- ==========================================
-- Migration: 20260814062557_previous_tattoo
-- ==========================================
CREATE TABLE `posts` (
	`id` text PRIMARY KEY,
	`user_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`metadata` text,
	`content` text DEFAULT '{"type":"doc","content":[]}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

DROP INDEX IF EXISTS `idx_page_title`;

DROP INDEX IF EXISTS `idx_page_author`;

DROP INDEX IF EXISTS `idx_page_created_at`;

DROP INDEX IF EXISTS `idx_page_updated_at`;

CREATE INDEX `idx_post_title` ON `posts` (`title`);

CREATE INDEX `idx_post_author` ON `posts` (`user_id`);

CREATE INDEX `idx_post_created_at` ON `posts` (`created_at`);

CREATE INDEX `idx_post_updated_at` ON `posts` (`updated_at`);

DROP TABLE `pages`;

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260814062557_previous_tattoo');

-- ==========================================
-- Migration: 20260820070000_add_posts_fts
-- ==========================================
DROP TRIGGER IF EXISTS `pages_fts_ai`;

DROP TRIGGER IF EXISTS `pages_fts_ad`;

DROP TRIGGER IF EXISTS `pages_fts_au`;

DROP TABLE IF EXISTS `pages_fts`;

CREATE VIRTUAL TABLE IF NOT EXISTS `posts_fts` USING fts5(
  `id` UNINDEXED,
  `title`,
  `content`
);

DELETE FROM `posts_fts`;

INSERT INTO `posts_fts` (`id`, `title`, `content`)
SELECT `id`, `title`, json_extract(`content`, '$') FROM `posts`;

CREATE TRIGGER IF NOT EXISTS `posts_fts_ai` AFTER INSERT ON `posts` BEGIN
  INSERT INTO `posts_fts` (`id`, `title`, `content`)
  VALUES (new.`id`, new.`title`, json_extract(new.`content`, '$'));
END;

CREATE TRIGGER IF NOT EXISTS `posts_fts_ad` AFTER DELETE ON `posts` BEGIN
  DELETE FROM `posts_fts` WHERE `id` = old.`id`;
END;

CREATE TRIGGER IF NOT EXISTS `posts_fts_au` AFTER UPDATE ON `posts` BEGIN
  DELETE FROM `posts_fts` WHERE `id` = old.`id`;
  INSERT INTO `posts_fts` (`id`, `title`, `content`)
  VALUES (new.`id`, new.`title`, json_extract(new.`content`, '$'));
END;

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260820070000_add_posts_fts');

-- ==========================================
-- Migration: 20260826070306_wakeful_terror
-- ==========================================
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL UNIQUE,
	`user_agent` text,
	`ip_address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_activity` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_session_user_id` ON `sessions` (`user_id`);

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260826070306_wakeful_terror');

-- ==========================================
-- Migration: 20260903090419_kind_logan
-- ==========================================
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1,
	`graph_enabled_by_default` integer DEFAULT true NOT NULL,
	`registration_enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `idx_session_expires_at` ON `sessions` (`expires_at`);

INSERT OR IGNORE INTO _hub_migrations (name) VALUES ('20260903090419_kind_logan');
