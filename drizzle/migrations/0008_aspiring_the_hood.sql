PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_staff_schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`staff_id` integer NOT NULL,
	`weekdays` text DEFAULT '[]' NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`slot_interval_min` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_staff_schedules`("id", "staff_id", "weekdays", "start_min", "end_min", "slot_interval_min", "created_at", "updated_at") SELECT "id", "staff_id", json_array("weekday"), "start_min", "end_min", "slot_interval_min", "created_at", "updated_at" FROM `staff_schedules`;--> statement-breakpoint
DROP TABLE `staff_schedules`;--> statement-breakpoint
ALTER TABLE `__new_staff_schedules` RENAME TO `staff_schedules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;