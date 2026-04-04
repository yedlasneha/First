-- ============================================================
-- KSR Fruits - Production MySQL Schema
-- Database : ksrfruits
-- Charset  : utf8mb4 / utf8mb4_unicode_ci
-- Engine   : InnoDB
--
-- Usage (first-time setup only):
--   mysql -u root -proot -h 127.0.0.1 < database/schema.sql
--
-- NOTE: Hibernate ddl-auto=update keeps the schema in sync
--       automatically on every service start. This file is
--       only needed for a clean environment setup.
-- ============================================================

CREATE DATABASE IF NOT EXISTS ksrfruits
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ksrfruits;

-- ── Users (auth-service) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    name             VARCHAR(100)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    email            VARCHAR(150)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    password         VARCHAR(255)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    phone            VARCHAR(15)     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    role             VARCHAR(20)     COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
    address          TEXT            COLLATE utf8mb4_unicode_ci,
    receiver_name    VARCHAR(100)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    receiver_mobile  VARCHAR(15)     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    profile_complete TINYINT(1)      NOT NULL DEFAULT 0,
    created_at       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Categories (product-service) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    description VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    image_url   VARCHAR(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Products (product-service) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    name                VARCHAR(100)    COLLATE utf8mb4_unicode_ci NOT NULL,
    description         VARCHAR(255)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    price               DECIMAL(10,2)   NOT NULL,
    unit                VARCHAR(20)     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    discount_percentage INT             DEFAULT 0,
    quantity            INT             DEFAULT 0,
    active              TINYINT(1)      DEFAULT 1,
    image_url           VARCHAR(1000)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    category_id         BIGINT          DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (active),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Orders (order-service) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    user_id          BIGINT          NOT NULL,
    total_amount     DECIMAL(10,2)   NOT NULL,
    status           VARCHAR(30)     COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PLACED',
    delivery_address VARCHAR(255)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    payment_id       VARCHAR(50)     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    created_at       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Order Items (order-service) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    order_id     BIGINT          NOT NULL,
    product_id   BIGINT          NOT NULL,
    product_name VARCHAR(100)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    quantity     INT             NOT NULL,
    price        DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── No seed data: products and categories are managed via Admin UI ────────
