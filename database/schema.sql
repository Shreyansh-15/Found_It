-- FoundIt database schema
-- Smart Campus Lost and Found Management System

CREATE DATABASE IF NOT EXISTS foundit_db;
USE foundit_db;

CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    account_status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME
);


CREATE TABLE IF NOT EXISTS categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS campuses (
    campus_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campus_name VARCHAR(100) NOT NULL,
    campus_code VARCHAR(30) NOT NULL UNIQUE,
    address VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE IF NOT EXISTS campus_locations (
    location_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campus_id INT UNSIGNED NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    building_name VARCHAR(100),
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (campus_id, location_name),

    CONSTRAINT fk_location_campus
        FOREIGN KEY (campus_id)
        REFERENCES campuses(campus_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
	location_details VARCHAR(255),
	report_type ENUM('lost', 'found') NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('open', 'claim_pending', 'resolved', 'closed')
        NOT NULL DEFAULT 'open',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME,

    INDEX idx_items_user (user_id),
    INDEX idx_items_category (category_id),
    INDEX idx_items_location (location_id),
    INDEX idx_items_type_status (report_type, status),
    INDEX idx_items_event_date (event_date),

    CONSTRAINT fk_item_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_item_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_item_location
        FOREIGN KEY (location_id)
        REFERENCES campus_locations(location_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS item_images (
    image_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT UNSIGNED NOT NULL DEFAULT 1,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_images_item_order (item_id, display_order),

    CONSTRAINT fk_image_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS claims (
    claim_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id INT UNSIGNED NOT NULL,
    claimant_user_id INT UNSIGNED NOT NULL,
    claim_description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'withdrawn')
        NOT NULL DEFAULT 'pending',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id INT UNSIGNED,
    reviewed_at DATETIME,
    decision_reason TEXT,

    INDEX idx_claims_item_status (item_id, status),
    INDEX idx_claims_claimant (claimant_user_id),

    CONSTRAINT fk_claim_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_claim_claimant
        FOREIGN KEY (claimant_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_claim_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS claim_evidence (
    evidence_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    claim_id INT UNSIGNED NOT NULL,
    evidence_type ENUM('photo', 'receipt', 'description', 'other')
        NOT NULL,
    evidence_url VARCHAR(500) NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_evidence_claim (claim_id),

    CONSTRAINT fk_evidence_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(claim_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id INT UNSIGNED NOT NULL,
    notification_type ENUM(
        'claim',
        'match',
        'moderation',
        'system',
        'recovery'
    ) NOT NULL,
    message VARCHAR(500) NOT NULL,
    item_id INT UNSIGNED,
    claim_id INT UNSIGNED,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,

    INDEX idx_notifications_recipient_read
        (recipient_user_id, is_read),

    CONSTRAINT fk_notification_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_notification_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_notification_claim
        FOREIGN KEY (claim_id)
        REFERENCES claims(claim_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS moderation_reports (
    moderation_report_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id INT UNSIGNED NOT NULL,
    reported_item_id INT UNSIGNED,
    reported_user_id INT UNSIGNED,
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'under_review', 'resolved', 'dismissed')
        NOT NULL DEFAULT 'pending',
    handled_by_user_id INT UNSIGNED,
    admin_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,

    INDEX idx_moderation_status (status),

    CONSTRAINT fk_moderation_reporter
        FOREIGN KEY (reporter_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_moderation_item
        FOREIGN KEY (reported_item_id)
        REFERENCES items(item_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_moderation_user
        FOREIGN KEY (reported_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_moderation_handler
        FOREIGN KEY (handled_by_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performed_by_user_id INT UNSIGNED,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT UNSIGNED NOT NULL,
    details JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_entity (entity_type, entity_id),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (performed_by_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);