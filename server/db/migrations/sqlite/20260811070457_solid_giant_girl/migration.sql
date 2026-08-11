PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `email`, `name`, `username`, `password`, `avatar`, `role`, `provider`, `provider_id`, `created_at`, `updated_at`) SELECT `id`, `email`, `name`, `username`, `password`, `avatar`, `role`, `provider`, `provider_id`, `created_at`, `updated_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_user_email`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_user_username`;--> statement-breakpoint
CREATE INDEX `idx_user_name` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `idx_user_role` ON `users` (`role`);