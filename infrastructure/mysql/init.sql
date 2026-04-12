-- linkedin_db schema skeleton
-- Person 2 owns full schema; this is the bootstrap stub

CREATE DATABASE IF NOT EXISTS linkedin_db;
USE linkedin_db;

-- Members (applicants)
CREATE TABLE IF NOT EXISTS members (
    member_id    VARCHAR(36)  PRIMARY KEY,
    full_name    VARCHAR(255) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    phone        VARCHAR(50),
    location     VARCHAR(255),
    headline     VARCHAR(500),
    summary      TEXT,
    skills       JSON,
    profile_photo_url VARCHAR(500),
    connections_count INT DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recruiters
CREATE TABLE IF NOT EXISTS recruiters (
    recruiter_id  VARCHAR(36)  PRIMARY KEY,
    company_id    VARCHAR(36)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    company_name  VARCHAR(255),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Job postings
CREATE TABLE IF NOT EXISTS jobs (
    job_id           VARCHAR(36)  PRIMARY KEY,
    recruiter_id     VARCHAR(36)  NOT NULL,
    company_id       VARCHAR(36)  NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    seniority_level  VARCHAR(100),
    employment_type  VARCHAR(100),
    location         VARCHAR(255),
    work_mode        VARCHAR(50),
    industry         VARCHAR(255),
    skills_required  JSON,
    salary_min       INT,
    salary_max       INT,
    status           ENUM('open','closed') DEFAULT 'open',
    views_count      INT DEFAULT 0,
    applicants_count INT DEFAULT 0,
    posted_datetime  DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at        DATETIME
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    application_id   VARCHAR(36) PRIMARY KEY,
    job_id           VARCHAR(36) NOT NULL,
    member_id        VARCHAR(36) NOT NULL,
    resume_url       VARCHAR(500),
    cover_letter     TEXT,
    status           ENUM('submitted','reviewing','interview','offer','rejected') DEFAULT 'submitted',
    idempotency_key  VARCHAR(255) UNIQUE,
    submitted_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_application (job_id, member_id)
);

-- Connection requests
CREATE TABLE IF NOT EXISTS connections (
    connection_id  VARCHAR(36) PRIMARY KEY,
    requester_id   VARCHAR(36) NOT NULL,
    receiver_id    VARCHAR(36) NOT NULL,
    status         ENUM('pending','accepted','rejected') DEFAULT 'pending',
    requested_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at    DATETIME,
    UNIQUE KEY unique_connection (requester_id, receiver_id)
);

-- Recruiter notes on applications
CREATE TABLE IF NOT EXISTS application_notes (
    note_id        VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    recruiter_id   VARCHAR(36) NOT NULL,
    note           TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);