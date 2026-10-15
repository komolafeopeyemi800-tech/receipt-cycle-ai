-- Push notification admin: editable templates, campaigns, version history and the remaining guardrails.
ALTER TABLE `notification_templates` ADD `kind` text DEFAULT 'event' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `toggle` text DEFAULT 'marketingUpdates' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `audience` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `weight` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `cooldown_days` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `body_web_mention` text;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `sequence_day` integer;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `window_start` integer;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `window_end` integer;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `delay_minutes` integer;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `channels` text DEFAULT 'android,web' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE TABLE `notification_template_history` (`id` text PRIMARY KEY NOT NULL, `template_key` text NOT NULL, `version` integer NOT NULL, `snapshot` text NOT NULL, `updated_at` integer NOT NULL, `updated_by` text NOT NULL);--> statement-breakpoint
CREATE INDEX `notification_template_history_key_idx` ON `notification_template_history` (`template_key`,`version`);--> statement-breakpoint
CREATE TABLE `notification_campaigns` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `template_key` text NOT NULL, `fields` text DEFAULT '{}' NOT NULL, `audience` text DEFAULT '{}' NOT NULL, `send_mode` text DEFAULT 'now' NOT NULL, `send_at` integer, `status` text DEFAULT 'draft' NOT NULL, `created_by` text NOT NULL, `queued` integer DEFAULT 0 NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);--> statement-breakpoint
CREATE INDEX `notification_campaign_status_idx` ON `notification_campaigns` (`status`,`send_at`);--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `lifecycle_daily_cap` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `daily_reminder_cap` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `marketing_daily_cap` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `campaigns_per_week` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `campaign_min_gap_hours` integer DEFAULT 48 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `job_expiry_hours` integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `backoff_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `web_access_mentions_android` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `toggle` text DEFAULT 'marketingUpdates' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `kind` text DEFAULT 'event' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `body_web_mention` text;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `payload` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `collapse_key` text;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `ttl_seconds` integer DEFAULT 43200 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `channels` text DEFAULT 'android,web' NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_jobs` ADD `campaign_id` text;
