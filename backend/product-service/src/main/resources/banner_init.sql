-- This file is NOT auto-run. Use fix_banners.sql manually.
-- Kept for reference only.
CREATE TABLE IF NOT EXISTS banners (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url     LONGTEXT,
    title         VARCHAR(500) NOT NULL,
    subtitle      LONGTEXT,
    tag           TEXT,
    badges        TEXT,
    display_order INT DEFAULT 0,
    active        TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
