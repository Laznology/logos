PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
--> statement-breakpoint
INSERT INTO `__new_pages`(`id`, `user_id`, `title`, `slug`, `metadata`, `content`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `title`, `slug`, `metadata`, `content`, `created_at`, `updated_at` FROM `pages`;--> statement-breakpoint
DROP TABLE `pages`;--> statement-breakpoint
ALTER TABLE `__new_pages` RENAME TO `pages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_page_title` ON `pages` (`title`);--> statement-breakpoint
CREATE INDEX `idx_page_author` ON `pages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_page_created_at` ON `pages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_page_updated_at` ON `pages` (`updated_at`);