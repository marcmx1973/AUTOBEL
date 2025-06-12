-- Create table to store weekly status counts
CREATE TABLE weekly_status_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    week_date date NOT NULL,
    status text NOT NULL CHECK (status IN ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'LOST', 'AWARDED', 'STANDBY', 'CANCELED', 'CLOSED')),
    count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_weekly_status_week_date ON weekly_status_counts(week_date);
CREATE INDEX idx_weekly_status_status ON weekly_status_counts(status);

-- Enable RLS
ALTER TABLE weekly_status_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read weekly status counts"
    ON weekly_status_counts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert weekly status counts"
    ON weekly_status_counts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create function to capture weekly status counts
CREATE OR REPLACE FUNCTION capture_weekly_status_counts()
RETURNS void AS $$
BEGIN
    -- Insert new counts for the current week
    INSERT INTO weekly_status_counts (week_date, status, count)
    SELECT 
        date_trunc('week', CURRENT_DATE)::date as week_date,
        phase_status as status,
        COUNT(*) as count
    FROM rfq
    GROUP BY phase_status;
END;
$$ LANGUAGE plpgsql;