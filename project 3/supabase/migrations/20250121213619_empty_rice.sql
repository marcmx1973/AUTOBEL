-- Create view for RFQ comments with user info
CREATE OR REPLACE VIEW rfq_comments_with_users AS
SELECT 
    c.id,
    c.rfq_id,
    c.comment,
    c.created_at,
    c.created_by,
    u.email as user_email
FROM rfq_comments c
LEFT JOIN auth.users u ON c.created_by = u.id
ORDER BY c.created_at DESC;