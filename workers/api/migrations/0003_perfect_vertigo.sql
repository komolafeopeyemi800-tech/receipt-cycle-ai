CREATE TABLE `sales_records` (
	`scope` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`updated_by` text,
	PRIMARY KEY(`scope`, `kind`, `id`)
);
--> statement-breakpoint
CREATE INDEX `sales_records_scope_updated_idx` ON `sales_records` (`scope`,`updated_at`);