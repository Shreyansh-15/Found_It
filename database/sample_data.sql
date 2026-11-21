-- FoundIt sample data
USE foundit_db;

-- Categories
INSERT IGNORE INTO categories
    (category_name, description)
VALUES
    ('Electronics', 'Phones, laptops, chargers, and electronic devices'),
    ('Books', 'Textbooks, notebooks, and study materials'),
    ('ID Cards', 'Student identity and access cards'),
    ('Wallets', 'Wallets, purses, and card holders'),
    ('Keys', 'Room keys, vehicle keys, and keychains'),
    ('Clothing', 'Jackets, sweaters, uniforms, and clothing');

-- Campuses
INSERT IGNORE INTO campuses
    (campus_name, campus_code)
VALUES
    ('Kandoli Campus', 'UPES-KAN'),
    ('Bidholi Campus', 'UPES-BID');

-- One neutral test location per campus
INSERT IGNORE INTO campus_locations
    (campus_id, location_name, description)
SELECT campus_id, 'Main Campus Area', 'General campus location'
FROM campuses
WHERE campus_code IN ('UPES-KAN', 'UPES-BID');


-- Demonstration users
-- These are database-test placeholders, not real login credentials.

INSERT IGNORE INTO users
    (full_name, email, password_hash, phone, role)
VALUES
    (
        'Aarav Sharma',
        'aarav.demo@foundit.local',
        'DEMO_HASH_REPLACE_IN_BACKEND',
        '9999990001',
        'student'
    ),
    (
        'Meera Kapoor',
        'meera.demo@foundit.local',
        'DEMO_HASH_REPLACE_IN_BACKEND',
        '9999990002',
        'student'
    ),
    (
        'FoundIt Administrator',
        'admin.demo@foundit.local',
        'DEMO_HASH_REPLACE_IN_BACKEND',
        NULL,
        'admin'
    );
    
    
-- Demonstration item reports

INSERT INTO items
    (
        user_id,
        category_id,
        location_id,
        report_type,
        item_name,
        description,
        event_date
    )
SELECT
    u.user_id,
    c.category_id,
    cl.location_id,
    'lost',
    'Black Smartphone',
    'Black smartphone with a protective case.',
    '2026-11-14'
FROM users u
JOIN categories c
    ON c.category_name = 'Electronics'
JOIN campus_locations cl
    ON cl.location_id = (
        SELECT cl2.location_id
        FROM campus_locations cl2
        JOIN campuses cp
            ON cl2.campus_id = cp.campus_id
        WHERE cp.campus_code = 'UPES-KAN'
          AND cl2.location_name = 'Main Campus Area'
    )
WHERE u.email = 'aarav.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM items
      WHERE item_name = 'Black Smartphone'
        AND report_type = 'lost'
  );

INSERT INTO items
    (
        user_id,
        category_id,
        location_id,
        report_type,
        item_name,
        description,
        event_date
    )
SELECT
    u.user_id,
    c.category_id,
    cl.location_id,
    'found',
    'Brown Leather Wallet',
    'Brown leather wallet found near the campus area.',
    '2026-11-14'
FROM users u
JOIN categories c
    ON c.category_name = 'Wallets'
JOIN campus_locations cl
    ON cl.location_id = (
        SELECT cl2.location_id
        FROM campus_locations cl2
        JOIN campuses cp
            ON cl2.campus_id = cp.campus_id
        WHERE cp.campus_code = 'UPES-BID'
          AND cl2.location_name = 'Main Campus Area'
    )
WHERE u.email = 'meera.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM items
      WHERE item_name = 'Brown Leather Wallet'
        AND report_type = 'found'
  );
  
  
-- Demonstration public item images

INSERT INTO item_images
    (item_id, image_url, is_primary, display_order)
SELECT
    i.item_id,
    'https://example.com/images/black-smartphone.jpg',
    TRUE,
    1
FROM items i
WHERE i.item_name = 'Black Smartphone'
  AND i.report_type = 'lost'
  AND NOT EXISTS (
      SELECT 1
      FROM item_images im
      WHERE im.item_id = i.item_id
  );

INSERT INTO item_images
    (item_id, image_url, is_primary, display_order)
SELECT
    i.item_id,
    'https://example.com/images/brown-wallet.jpg',
    TRUE,
    1
FROM items i
WHERE i.item_name = 'Brown Leather Wallet'
  AND i.report_type = 'found'
  AND NOT EXISTS (
      SELECT 1
      FROM item_images im
      WHERE im.item_id = i.item_id
  );

-- Demonstration claim

INSERT INTO claims
    (item_id, claimant_user_id, claim_description)
SELECT
    i.item_id,
    u.user_id,
    'The wallet contains my student ID and a distinctive family photograph.'
FROM items i
JOIN users u
    ON u.email = 'aarav.demo@foundit.local'
WHERE i.item_name = 'Brown Leather Wallet'
  AND i.report_type = 'found'
  AND NOT EXISTS (
      SELECT 1
      FROM claims cl
      WHERE cl.item_id = i.item_id
        AND cl.claimant_user_id = u.user_id
  );
  
  
-- Private claim evidence

INSERT INTO claim_evidence
    (claim_id, evidence_type, evidence_url)
SELECT
    cl.claim_id,
    'description',
    'https://example.com/private-evidence/wallet-details.txt'
FROM claims cl
JOIN items i
    ON cl.item_id = i.item_id
JOIN users u
    ON cl.claimant_user_id = u.user_id
WHERE i.item_name = 'Brown Leather Wallet'
  AND i.report_type = 'found'
  AND u.email = 'aarav.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM claim_evidence ce
      WHERE ce.claim_id = cl.claim_id
  );

-- Notification for the finder

INSERT INTO notifications
    (
        recipient_user_id,
        notification_type,
        message,
        item_id,
        claim_id
    )
SELECT
    finder.user_id,
    'claim',
    'A new claim has been submitted for the found wallet.',
    i.item_id,
    cl.claim_id
FROM users finder
JOIN items i
    ON i.item_name = 'Brown Leather Wallet'
   AND i.report_type = 'found'
JOIN claims cl
    ON cl.item_id = i.item_id
JOIN users claimant
    ON cl.claimant_user_id = claimant.user_id
WHERE finder.email = 'meera.demo@foundit.local'
  AND claimant.email = 'aarav.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM notifications n
      WHERE n.claim_id = cl.claim_id
        AND n.recipient_user_id = finder.user_id
  );

-- Demonstration moderation report

INSERT INTO moderation_reports
    (
        reporter_user_id,
        reported_item_id,
        reason,
        description
    )
SELECT
    reporter.user_id,
    i.item_id,
    'Suspicious listing',
    'The listing details should be reviewed by an administrator.'
FROM users reporter
JOIN items i
    ON i.item_name = 'Brown Leather Wallet'
   AND i.report_type = 'found'
WHERE reporter.email = 'aarav.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM moderation_reports mr
      WHERE mr.reporter_user_id = reporter.user_id
        AND mr.reported_item_id = i.item_id
  );

-- Demonstration audit log

INSERT INTO audit_logs
    (
        performed_by_user_id,
        action_type,
        entity_type,
        entity_id,
        details
    )
SELECT
    admin.user_id,
    'REVIEW_MODERATION_REPORT',
    'moderation_report',
    mr.moderation_report_id,
    JSON_OBJECT(
        'note',
        'Administrator opened the moderation report for review'
    )
FROM users admin
JOIN moderation_reports mr
WHERE admin.email = 'admin.demo@foundit.local'
  AND NOT EXISTS (
      SELECT 1
      FROM audit_logs al
      WHERE al.entity_type = 'moderation_report'
        AND al.entity_id = mr.moderation_report_id
        AND al.action_type = 'REVIEW_MODERATION_REPORT'
  );