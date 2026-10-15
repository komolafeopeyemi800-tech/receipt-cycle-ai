-- Admin-controlled daily caps per person for the paid AI features. Empty means the default (25, assistant 50).
ALTER TABLE `app_config` ADD `daily_scan_limit` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `daily_voice_limit` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `daily_upload_limit` integer;--> statement-breakpoint
ALTER TABLE `app_config` ADD `daily_assistant_limit` integer;
