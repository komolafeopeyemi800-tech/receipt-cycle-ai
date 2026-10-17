-- Original files people upload (statements, receipts, invoices) and the details read from them. The file itself lives in R2
-- under receipts/<userId>/, so account deletion removes it with the other receipts; the row is removed with the user.
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`meta` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `documents_user_created_idx` ON `documents` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `documents_r2_key_idx` ON `documents` (`r2_key`);
