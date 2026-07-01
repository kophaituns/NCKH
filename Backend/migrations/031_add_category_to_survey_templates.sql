-- Migration: Add category column to survey_templates table
-- Date: 2025-12-22
-- Description: Adds optional category field for better template organization

-- Add category column if it doesn't exist
ALTER TABLE survey_templates 
ADD COLUMN category VARCHAR(100) DEFAULT NULL 
COMMENT 'Category for template organization (education, business, health, etc.)';

-- Add index for faster category filtering
CREATE INDEX idx_survey_templates_category 
ON survey_templates (category);
