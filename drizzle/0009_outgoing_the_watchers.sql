CREATE TABLE `wearable_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`activityDate` varchar(10) NOT NULL,
	`startedAt` timestamp,
	`activityType` varchar(128),
	`durationMinutes` int,
	`caloriesKcal` int,
	`heartRateAvg` int,
	`heartRateMax` int,
	`steps` int,
	`distanceMeters` int,
	`rawMetricsJson` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wearable_activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `wearable_provider_activity_unique` UNIQUE(`userId`,`provider`,`externalId`)
);
--> statement-breakpoint
CREATE TABLE `wearable_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`status` enum('disconnected','connected','syncing','needs_reconnect') NOT NULL DEFAULT 'disconnected',
	`externalAccountId` varchar(255),
	`scopesJson` text,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wearable_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `wearable_user_provider_unique` UNIQUE(`userId`,`provider`)
);
