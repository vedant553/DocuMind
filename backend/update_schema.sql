-- Drop the old 1536-dimensional embedding column
ALTER TABLE "DocumentChunk"
DROP COLUMN IF EXISTS embedding;

-- Add a new 768-dimensional embedding column for Gemini
ALTER TABLE "DocumentChunk"
ADD COLUMN embedding vector(768);