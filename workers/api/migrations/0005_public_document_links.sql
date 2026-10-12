CREATE TABLE `public_document_links` (
	`token` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`kind` text NOT NULL,
	`document_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_document_scope_kind_id_idx` ON `public_document_links` (`scope`,`kind`,`document_id`);
