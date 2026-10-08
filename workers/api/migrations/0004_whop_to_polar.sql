-- Payments moved from Whop to Polar: rename the entitlement storage and clear any old Whop ids.
ALTER TABLE `whop_entitlements` RENAME TO `billing_entitlements`;--> statement-breakpoint
ALTER TABLE `billing_entitlements` RENAME COLUMN `whop_user_id` TO `polar_customer_id`;--> statement-breakpoint
ALTER TABLE `profile` RENAME COLUMN `whop_sub` TO `polar_customer_id`;--> statement-breakpoint
DROP INDEX IF EXISTS `whop_ent_user_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `whop_ent_email_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `profile_whop_sub_idx`;--> statement-breakpoint
UPDATE `billing_entitlements` SET `polar_customer_id` = NULL WHERE `polar_customer_id` IS NOT NULL AND `polar_customer_id` NOT LIKE '%-%-%-%-%';--> statement-breakpoint
UPDATE `profile` SET `polar_customer_id` = NULL WHERE `polar_customer_id` IS NOT NULL AND `polar_customer_id` NOT LIKE '%-%-%-%-%';--> statement-breakpoint
CREATE INDEX `billing_ent_customer_idx` ON `billing_entitlements` (`polar_customer_id`);--> statement-breakpoint
CREATE INDEX `billing_ent_email_idx` ON `billing_entitlements` (`email`);--> statement-breakpoint
CREATE INDEX `profile_polar_customer_idx` ON `profile` (`polar_customer_id`);
