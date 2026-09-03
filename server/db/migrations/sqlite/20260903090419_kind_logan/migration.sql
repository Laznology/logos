CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1,
	`graph_enabled_by_default` integer DEFAULT true NOT NULL,
	`registration_enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_session_expires_at` ON `sessions` (`expires_at`);