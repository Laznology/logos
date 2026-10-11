CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `apikeys` (
	`id` text PRIMARY KEY,
	`config_id` text DEFAULT 'default' NOT NULL,
	`name` text,
	`start` text,
	`reference_id` text NOT NULL,
	`prefix` text,
	`key` text NOT NULL,
	`refill_interval` integer,
	`refill_amount` integer,
	`last_refill_at` integer,
	`enabled` integer DEFAULT true,
	`rate_limit_enabled` integer DEFAULT true,
	`rate_limit_time_window` integer DEFAULT 3600000,
	`rate_limit_max` integer DEFAULT 100,
	`request_count` integer DEFAULT 0,
	`remaining` integer,
	`last_request` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`permissions` text,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`logo` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_members_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_invitations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invitations_inviter_id_users_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
-- Users are altered in place, never rebuilt: D1 ignores PRAGMA foreign_keys
-- inside a migration, so `DROP TABLE users` would cascade-delete every post.
-- The legacy `password`/`provider`/`provider_id` columns are nullable and stay;
-- Better Auth's schema check allows extra nullable columns.
ALTER TABLE `users` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `display_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `banned` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `ban_expires` integer;--> statement-breakpoint
UPDATE `users` SET `display_username` = `username`;--> statement-breakpoint
-- Legacy Adonis scrypt hashes become credential accounts. They keep working
-- because lib/auth.ts verifies the `$scrypt$` PHC format directly.
INSERT INTO `accounts` (`id`, `account_id`, `provider_id`, `user_id`, `password`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), `id`, 'credential', `id`, `password`, `created_at`, `updated_at`
FROM `users` WHERE `password` IS NOT NULL;--> statement-breakpoint
-- Old sessions stored a token *hash* and a different cookie, so they cannot be
-- resumed. Rebuild the table (nothing references sessions, so this is safe).
DROP TABLE `sessions`;--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`user_id` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`impersonated_by` text,
	`active_organization_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
-- One personal workspace per user; the id suffix keeps slugs unique.
INSERT INTO `organizations` (`id`, `name`, `slug`, `created_at`)
SELECT lower(hex(randomblob(16))), `name` || '''s Workspace',
       lower(replace(coalesce(`username`, `name`), ' ', '-')) || '-' || substr(`id`, 1, 6),
       `created_at`
FROM `users`;--> statement-breakpoint
INSERT INTO `members` (`id`, `organization_id`, `user_id`, `role`, `created_at`)
SELECT lower(hex(randomblob(16))), o.`id`, u.`id`, 'owner', u.`created_at`
FROM `organizations` o JOIN `users` u
  ON o.`slug` = lower(replace(coalesce(u.`username`, u.`name`), ' ', '-')) || '-' || substr(u.`id`, 1, 6);--> statement-breakpoint
ALTER TABLE `posts` ADD `organization_id` text REFERENCES organizations(id) ON DELETE CASCADE;--> statement-breakpoint
UPDATE `posts` SET `organization_id` = (
  SELECT m.`organization_id` FROM `members` m
  WHERE m.`user_id` = `posts`.`user_id` LIMIT 1
);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_session_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
-- idx_user_name / idx_user_role already exist from the initial migration.
CREATE INDEX `idx_account_user_id` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_apikey_reference_id` ON `apikeys` (`reference_id`);--> statement-breakpoint
CREATE INDEX `idx_apikey_key` ON `apikeys` (`key`);--> statement-breakpoint
CREATE INDEX `idx_invitation_organization_id` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_invitation_email` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_member_organization_id` ON `members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_member_user_id` ON `members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_organization_slug` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_post_organization` ON `posts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_verification_identifier` ON `verifications` (`identifier`);
