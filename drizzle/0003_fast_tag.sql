CREATE TABLE `body_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`language` enum('pt','en','es') NOT NULL,
	`confidence` int NOT NULL,
	`resultJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `body_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `body_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(64) NOT NULL,
	`assessmentDate` varchar(10) NOT NULL,
	`frontKey` varchar(255) NOT NULL,
	`sideKey` varchar(255) NOT NULL,
	`backKey` varchar(255) NOT NULL,
	`weightKg` varchar(32),
	`measurementsJson` text,
	`trainingNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `body_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalization_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('pt','en','es') NOT NULL DEFAULT 'pt',
	`consentAt` timestamp,
	`goal` varchar(255),
	`healthNotes` text,
	`weightKg` varchar(32),
	`measurementsJson` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalization_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `personalization_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `specialization_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisId` int NOT NULL,
	`active` int NOT NULL DEFAULT 0,
	`focus` varchar(128) NOT NULL,
	`rationale` text NOT NULL,
	`confidence` int NOT NULL,
	`sessionJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialization_plans_id` PRIMARY KEY(`id`)
);
