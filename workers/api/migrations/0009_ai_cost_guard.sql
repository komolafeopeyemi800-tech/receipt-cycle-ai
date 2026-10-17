-- Cost guard for the paid AI features: spend per person per UTC day, a short log of paid calls (for the burst rule),
-- and the automatic lockouts. Admin settings live on app_config; empty means the default.
CREATE TABLE `ai_spend` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`micros` integer DEFAULT 0 NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);--> statement-breakpoint
CREATE INDEX `ai_spend_day_idx` ON `ai_spend` (`day`);--> statement-breakpoint
CREATE TABLE `ai_call_log` (
	`user_id` text NOT NULL,
	`at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `ai_call_log_user_at_idx` ON `ai_call_log` (`user_id`, `at`);--> statement-breakpoint
CREATE TABLE `ai_lockouts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`locked_until` integer NOT NULL,
	`reason` text NOT NULL,
	`strikes` integer DEFAULT 1 NOT NULL,
	`last_strike_at` integer NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
ALTER TABLE `app_config` ADD `ai_daily_budget_cents` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `ai_monthly_budget_cents` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `ai_burst_calls` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `ai_guard_enabled` integer;
