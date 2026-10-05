CREATE TABLE `upload_parses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`file_hash` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text,
	`source` text NOT NULL,
	`row_count` integer NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upload_parses_user_hash_idx` ON `upload_parses` (`user_id`,`file_hash`);--> statement-breakpoint
CREATE INDEX `upload_parses_user_created_idx` ON `upload_parses` (`user_id`,`created_at`);