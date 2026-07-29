-- AlterTable users: add role
ALTER TABLE `users` ADD COLUMN `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member';
CREATE INDEX `users_role_idx` ON `users`(`role`);

-- AlterTable orders: payment + shipping meta
ALTER TABLE `orders` ADD COLUMN `payment_method` ENUM('bank', 'whatsapp') NOT NULL DEFAULT 'bank';
ALTER TABLE `orders` ADD COLUMN `payment_proof` VARCHAR(255) NULL;
ALTER TABLE `orders` ADD COLUMN `shipping_service` VARCHAR(40) NULL;
ALTER TABLE `orders` ADD COLUMN `shipping_eta` VARCHAR(40) NULL;
