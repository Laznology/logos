DROP TRIGGER IF EXISTS `pages_fts_ai`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `pages_fts_ad`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `pages_fts_au`;--> statement-breakpoint
DROP TABLE IF EXISTS `pages_fts`;--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS `posts_fts` USING fts5(
  `id` UNINDEXED,
  `title`,
  `content`
);--> statement-breakpoint
DELETE FROM `posts_fts`;--> statement-breakpoint
INSERT INTO `posts_fts` (`id`, `title`, `content`)
SELECT `id`, `title`, json_extract(`content`, '$') FROM `posts`;--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `posts_fts_ai` AFTER INSERT ON `posts` BEGIN
  INSERT INTO `posts_fts` (`id`, `title`, `content`)
  VALUES (new.`id`, new.`title`, json_extract(new.`content`, '$'));
END;--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `posts_fts_ad` AFTER DELETE ON `posts` BEGIN
  DELETE FROM `posts_fts` WHERE `id` = old.`id`;
END;--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `posts_fts_au` AFTER UPDATE ON `posts` BEGIN
  DELETE FROM `posts_fts` WHERE `id` = old.`id`;
  INSERT INTO `posts_fts` (`id`, `title`, `content`)
  VALUES (new.`id`, new.`title`, json_extract(new.`content`, '$'));
END;
