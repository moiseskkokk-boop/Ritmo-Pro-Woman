CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`browserEnabled` int NOT NULL DEFAULT 0,
	`dailyReminder` int NOT NULL DEFAULT 1,
	`reminderTime` varchar(5) NOT NULL DEFAULT '18:00',
		`reminderDaysJson` text,
	`weeklySummary` int NOT NULL DEFAULT 1,
	`weeklyDay` varchar(1) NOT NULL DEFAULT '0',
	`weeklyTime` varchar(5) NOT NULL DEFAULT '20:00',
	`monthlyCheckIn` int NOT NULL DEFAULT 1,
	`quietStart` varchar(5) NOT NULL DEFAULT '22:00',
	`quietEnd` varchar(5) NOT NULL DEFAULT '07:00',
	`customMessage` varchar(180),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
