-- Migration: Create chat tables
-- File: 008_create_chat_tables.sql
-- Description: Create chat_conversations and chat_messages tables

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS `chat_conversations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `title` varchar(255) NOT NULL DEFAULT 'New Chat',
    `status` enum('active','archived','deleted') NOT NULL DEFAULT 'active',
    `last_message_at` timestamp NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_chat_conversations_user_id` (`user_id`),
    INDEX `idx_chat_conversations_status` (`status`),
    INDEX `idx_chat_conversations_created_at` (`created_at`),
    CONSTRAINT `fk_chat_conversations_user_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` int NOT NULL AUTO_INCREMENT,
    `conversation_id` int NOT NULL,
    `sender_type` enum('user','ai') NOT NULL,
    `message` text NOT NULL,
    `api_provider` enum('super_dev','gemini') NULL COMMENT 'API provider used for AI responses',
    `response_time` int NULL COMMENT 'Response time in milliseconds',
    `tokens_used` int NULL COMMENT 'Number of tokens used for AI response',
    `status` enum('sent','delivered','error') NOT NULL DEFAULT 'sent',
    `error_message` text NULL,
    `metadata` json NULL COMMENT 'Additional metadata for the message',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_chat_messages_conversation_id` (`conversation_id`),
    INDEX `idx_chat_messages_sender_type` (`sender_type`),
    INDEX `idx_chat_messages_created_at` (`created_at`),
    INDEX `idx_chat_messages_api_provider` (`api_provider`),
    CONSTRAINT `fk_chat_messages_conversation_id` 
        FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;