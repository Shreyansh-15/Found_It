USE foundit_db;

SELECT 'users' AS table_name, COUNT(*) AS total_rows FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'campuses', COUNT(*) FROM campuses
UNION ALL
SELECT 'campus_locations', COUNT(*) FROM campus_locations
UNION ALL
SELECT 'items', COUNT(*) FROM items
UNION ALL
SELECT 'item_images', COUNT(*) FROM item_images
UNION ALL
SELECT 'claims', COUNT(*) FROM claims
UNION ALL
SELECT 'claim_evidence', COUNT(*) FROM claim_evidence
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'moderation_reports', COUNT(*) FROM moderation_reports
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- Open found reports with campus and location
SELECT
    i.item_id,
    i.item_name,
    c.category_name,
    cp.campus_name,
    cl.location_name,
    u.full_name AS reported_by,
    i.event_date,
    i.status
FROM items i
JOIN categories c ON i.category_id = c.category_id
JOIN campus_locations cl ON i.location_id = cl.location_id
JOIN campuses cp ON cl.campus_id = cp.campus_id
JOIN users u ON i.user_id = u.user_id
WHERE i.report_type = 'found'
  AND i.status = 'open';

-- Count reports by type and status
SELECT
    report_type,
    status,
    COUNT(*) AS total_reports
FROM items
GROUP BY report_type, status;

-- Users who have submitted claims
SELECT
    user_id,
    full_name,
    email
FROM users
WHERE user_id IN (
    SELECT claimant_user_id
    FROM claims
);

-- Unread notifications
SELECT
    notification_id,
    recipient_user_id,
    notification_type,
    message,
    created_at
FROM notifications
WHERE is_read = FALSE;