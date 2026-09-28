CREATE TABLE `workout_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionDate` varchar(10) NOT NULL,
	`workoutId` varchar(32) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_date_unique` UNIQUE(`userId`,`sessionDate`)
);
