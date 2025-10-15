PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` integer PRIMARY KEY NOT NULL,
	`service_id` integer NOT NULL,
	`staff_id` integer,
	`start_ts` integer NOT NULL,
	`end_ts` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("id", "service_id", "staff_id", "start_ts", "end_ts", "customer_name", "customer_contact", "status", "notes", "created_at", "updated_at") SELECT "id", "service_id", "staff_id", "start_ts", "end_ts", "customer_name", "customer_contact", "status", "notes", "created_at", "updated_at" FROM `bookings`;--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;