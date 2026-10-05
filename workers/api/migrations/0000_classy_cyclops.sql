CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`icon_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `accounts_scope_idx` ON `accounts` (`scope`);--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`details` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `admin_audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `app_config` (
	`key` text PRIMARY KEY NOT NULL,
	`maintenance_mode` integer,
	`scanner_enabled` integer,
	`upload_enabled` integer,
	`manual_add_enabled` integer,
	`export_enabled` integer,
	`web_dashboard_enabled` integer,
	`web_transactions_enabled` integer,
	`web_upload_enabled` integer,
	`web_settings_enabled` integer,
	`mobile_scan_page_enabled` integer,
	`mobile_upload_page_enabled` integer,
	`mobile_add_page_enabled` integer,
	`admin_managed_preferences` integer,
	`pref_reimbursements` integer,
	`pref_txn_number` integer,
	`pref_scan_payment` integer,
	`pref_require_pay` integer,
	`pref_require_notes` integer,
	`free_camera_limit` integer,
	`free_upload_limit` integer,
	`free_manual_limit` integer,
	`updated_at` integer,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`category` text NOT NULL,
	`month` text NOT NULL,
	`limit_amount` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_scope_month_category_idx` ON `budgets` (`scope`,`month`,`category`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `categories_scope_idx` ON `categories` (`scope`);--> statement-breakpoint
CREATE TABLE `profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`plan` text,
	`pro_subscription_active` integer DEFAULT false NOT NULL,
	`trial_started_at` integer,
	`trial_lifetime_adds` integer,
	`role` text,
	`status` text,
	`google_sub` text,
	`whop_sub` text,
	`legacy_password_hash` text,
	`legacy_convex_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profile_google_sub_idx` ON `profile` (`google_sub`);--> statement-breakpoint
CREATE INDEX `profile_whop_sub_idx` ON `profile` (`whop_sub`);--> statement-breakpoint
CREATE INDEX `profile_legacy_convex_idx` ON `profile` (`legacy_convex_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace` text DEFAULT 'personal' NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`merchant` text,
	`date` text NOT NULL,
	`description` text,
	`payment_method` text,
	`account_id` text,
	`tags` text,
	`is_recurring` integer,
	`receipt_url` text,
	`receipt_data` text,
	`entry_source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `txn_user_workspace_date_idx` ON `transactions` (`user_id`,`workspace`,`date`);--> statement-breakpoint
CREATE INDEX `txn_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`currency` text NOT NULL,
	`date_format` text NOT NULL,
	`merchants` text NOT NULL,
	`locations` text NOT NULL,
	`reimbursements` integer,
	`txn_number` integer,
	`scan_payment` integer,
	`require_pay` integer,
	`require_notes` integer,
	`voice_input_language` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whop_entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`whop_user_id` text,
	`email` text,
	`membership_id` text,
	`subscription_status` text NOT NULL,
	`pro_active` integer NOT NULL,
	`payment_status` text,
	`source` text,
	`last_event_type` text NOT NULL,
	`last_event_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `whop_ent_user_idx` ON `whop_entitlements` (`whop_user_id`);--> statement-breakpoint
CREATE INDEX `whop_ent_email_idx` ON `whop_entitlements` (`email`);--> statement-breakpoint
CREATE TABLE `workspace_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_key` text NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`status` text NOT NULL,
	`invited_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invites_token_unique` ON `workspace_invites` (`token`);--> statement-breakpoint
CREATE INDEX `invites_workspace_idx` ON `workspace_invites` (`workspace_key`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_key` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_user_workspace_idx` ON `workspace_members` (`user_id`,`workspace_key`);--> statement-breakpoint
CREATE INDEX `members_workspace_idx` ON `workspace_members` (`workspace_key`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text DEFAULT 'team' NOT NULL,
	`owner_user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);--> statement-breakpoint
CREATE INDEX `workspaces_owner_idx` ON `workspaces` (`owner_user_id`);