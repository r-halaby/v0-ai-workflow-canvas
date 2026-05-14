-- Add final_output column to workflow_executions table
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS final_output TEXT;
