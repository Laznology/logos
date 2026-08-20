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
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_page_title`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_page_author`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_page_created_at`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_page_updated_at`;--> statement-breakpoint
CREATE INDEX `idx_post_title` ON `posts` (`title`);--> statement-breakpoint
CREATE INDEX `idx_post_author` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_post_created_at` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_post_updated_at` ON `posts` (`updated_at`);--> statement-breakpoint
DROP TABLE `pages`;