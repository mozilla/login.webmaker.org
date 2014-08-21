START TRANSACTION;

  -- Create LoginTokens Table
  CREATE TABLE `LoginTokens` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `token` varchar(5) DEFAULT NULL,
    `failedAttempts` int(11) NOT NULL DEFAULT 0,
    `used` tinyint(1) NOT NULL DEFAULT 0,
    `createdAt` datetime NOT NULL,
    `updatedAt` datetime NOT NULL,
    `UserId` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB

  -- Create Passwords Table
  CREATE TABLE `Passwords` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `saltedHash` varchar(60) NOT NULL,
    `createdAt` datetime NOT NULL,
    `updatedAt` datetime NOT NULL,
    `UserId` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB

  -- Create ResetAuthorizations Table
  CREATE TABLE `ResetAuthorizations` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `token` varchar(32) NOT NULL,
    `used` tinyint(1) NOT NULL DEFAULT '0',
    `createdAt` datetime NOT NULL,
    `updatedAt` datetime NOT NULL,
    `UserId` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB

  -- Add verified Column
  ALTER TABLE `Users` ADD COLUMN verified TINYINT(1) NOT NULL DEFAULT 0;

  -- Add usePasswordLogin Column
  ALTER TABLE `Users` ADD COLUMN usePasswordLogin TINYINT(1) NOT NULL DEFAULT 0;

COMMIT;
