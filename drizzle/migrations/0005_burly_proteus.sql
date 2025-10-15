ALTER TABLE `staff` ADD `name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `staff` ADD `role` text DEFAULT 'stylist' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `active` integer DEFAULT true NOT NULL;