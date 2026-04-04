-- Run this script ONCE to fix the banners table
-- Connect: mysql -u root -proot ksrfruits < database/fix_banners.sql

USE ksrfruits;

-- Increase max_allowed_packet for this session (for large base64 images)
SET SESSION max_allowed_packet = 67108864;

-- Drop old banners table if it exists (Hibernate will recreate with correct column types)
DROP TABLE IF EXISTS banners;

-- Hibernate (ddl-auto=update) will recreate the table on next product-service startup
-- with the correct LONGTEXT column for image_url

SELECT 'banners table dropped — restart product-service to recreate it' AS status;
