-- Drop existing rfq_comments table
DROP TABLE IF EXISTS rfq_comments CASCADE;

-- Recreate rfq_comments table with proper relationships
CREATE TABLE rfq_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT comment_not_empty CHECK (length(trim(comment)) > 0)
);

-- Create indexes for efficient querying
CREATE INDEX idx_rfq_comments_rfq_id ON rfq_comments(rfq_id);
CREATE INDEX idx_rfq_comments_created_at ON rfq_comments(created_at DESC);
CREATE INDEX idx_rfq_comments_created_by ON rfq_comments(created_by);

-- Enable RLS
ALTER TABLE rfq_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all comments"
    ON rfq_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON rfq_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Create view to get comments with user info
CREATE OR REPLACE VIEW rfq_comments_with_users AS
SELECT 
    c.*,
    u.email as user_email
FROM rfq_comments c
LEFT JOIN auth.users u ON c.created_by = u.id;