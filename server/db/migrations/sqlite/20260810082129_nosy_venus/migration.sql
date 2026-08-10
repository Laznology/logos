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
--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_name` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `idx_user_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_user_role` ON `users` (`role`);