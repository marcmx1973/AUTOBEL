-- Create table for RFQ comments
CREATE TABLE rfq_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT comment_not_empty CHECK (length(trim(comment)) > 0)
);

-- Create index for efficient querying
CREATE INDEX idx_rfq_comments_rfq_id ON rfq_comments(rfq_id);
CREATE INDEX idx_rfq_comments_created_at ON rfq_comments(created_at DESC);

-- Enable RLS
ALTER TABLE rfq_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all comments"
    ON rfq_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert comments"
    ON rfq_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);