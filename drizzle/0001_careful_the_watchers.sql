CREATE TABLE `exercise_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(128) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_exercise_unique` UNIQUE(`userId`,`exerciseId`)
);
