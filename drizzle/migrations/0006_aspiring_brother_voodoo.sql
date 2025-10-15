PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blackouts` (
	`id` integer PRIMARY KEY NOT NULL,
	`staff_id` integer,
	`start_ts` integer NOT NULL,
	`end_ts` integer NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_blackouts`("id", "staff_id", "start_ts", "end_ts", "reason", "created_at", "updated_at") SELECT "id", "staff_id", "start_ts", "end_ts", "reason", "created_at", "updated_at" FROM `blackouts`;--> statement-breakpoint
DROP TABLE `blackouts`;--> statement-breakpoint
ALTER TABLE `__new_blackouts` RENAME TO `blackouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` integer PRIMARY KEY NOT NULL,
	`customer_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`staff_id` integer NOT NULL,
	`start_ts` integer NOT NULL,
	`end_ts` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("id", "customer_id", "service_id", "staff_id", "start_ts", "end_ts", "status", "payment_status", "notes", "created_at", "updated_at") SELECT "id", "customer_id", "service_id", "staff_id", "start_ts", "end_ts", "status", "payment_status", "notes", "created_at", "updated_at" FROM `bookings`;--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
CREATE TABLE `__new_staff_schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`staff_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`slot_interval_min` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_staff_schedules`("id", "staff_id", "weekday", "start_min", "end_min", "slot_interval_min", "created_at", "updated_at") SELECT "id", "staff_id", "weekday", "start_min", "end_min", "slot_interval_min", "created_at", "updated_at" FROM `staff_schedules`;--> statement-breakpoint
DROP TABLE `staff_schedules`;--> statement-breakpoint
ALTER TABLE `__new_staff_schedules` RENAME TO `staff_schedules`;