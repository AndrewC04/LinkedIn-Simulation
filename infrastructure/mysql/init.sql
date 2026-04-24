-- LinkedIn Simulation – MySQL Schema (Surya)
-- Database: linkedin_db

CREATE DATABASE IF NOT EXISTS linkedin_db;
USE linkedin_db;

-- App-level user
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';
GRANT ALL PRIVILEGES ON linkedin_db.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

-- 1. MEMBERS (applicants / job-seekers)
CREATE TABLE IF NOT EXISTS members (
    member_id         VARCHAR(36)  PRIMARY KEY,          -- UUID
    first_name        VARCHAR(128) NOT NULL,
    last_name         VARCHAR(128) NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     VARCHAR(255),
    phone             VARCHAR(50),
    location_city     VARCHAR(128),
    location_state    VARCHAR(128),
    location_country  VARCHAR(128) DEFAULT 'United States',
    headline          VARCHAR(500),
    summary           TEXT,
    skills            JSON,                               -- ["Python","SQL",…]
    profile_photo_url VARCHAR(500),
    banner_photo_url  VARCHAR(500),
    resume_url        VARCHAR(500),
    resume_text       TEXT,                               
    connections_count INT          DEFAULT 0,
    profile_views     INT          DEFAULT 0,
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_members_location  (location_city, location_state),
    INDEX idx_members_email     (email),
    FULLTEXT INDEX ft_members_headline_summary (headline, summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. MEMBER EXPERIENCE  (structured work history)
CREATE TABLE IF NOT EXISTS member_experience (
    experience_id  VARCHAR(36)  PRIMARY KEY,
    member_id      VARCHAR(36)  NOT NULL,
    title          VARCHAR(255) NOT NULL,
    company_name   VARCHAR(255),
    location       VARCHAR(255),
    start_date     DATE,
    end_date       DATE,                                  -- NULL = current role
    description    TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_exp_member (member_id),
    CONSTRAINT fk_exp_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. MEMBER EDUCATION
CREATE TABLE IF NOT EXISTS member_education (
    education_id   VARCHAR(36)  PRIMARY KEY,
    member_id      VARCHAR(36)  NOT NULL,
    school_name    VARCHAR(255) NOT NULL,
    degree         VARCHAR(255),
    field_of_study VARCHAR(255),
    start_year     INT,
    end_year       INT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_edu_member (member_id),
    CONSTRAINT fk_edu_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. RECRUITERS
CREATE TABLE IF NOT EXISTS recruiters (
    recruiter_id   VARCHAR(36)  PRIMARY KEY,
    company_id     VARCHAR(36)  NOT NULL,
    first_name     VARCHAR(128) NOT NULL,
    last_name      VARCHAR(128) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255),
    phone          VARCHAR(50),
    company_name   VARCHAR(255) NOT NULL,
    company_industry VARCHAR(255),
    company_size   VARCHAR(50),                           -- e.g. "1001-5000"
    role_level     VARCHAR(100) DEFAULT 'admin',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_recruiter_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. JOB POSTINGS
CREATE TABLE IF NOT EXISTS jobs (
    job_id           VARCHAR(36)  PRIMARY KEY,
    recruiter_id     VARCHAR(36)  NOT NULL,
    company_id       VARCHAR(36)  NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    seniority_level  VARCHAR(100),                        -- Entry, Mid, Senior, Director, VP
    employment_type  VARCHAR(100),                        -- Full-time, Part-time, Contract, Internship
    location         VARCHAR(255),
    work_mode        ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
    industry         VARCHAR(255),
    skills_required  JSON,                                -- ["React","Node.js",…]
    salary_min       INT,
    salary_max       INT,
    status           ENUM('open','closed') DEFAULT 'open',
    views_count      INT DEFAULT 0,
    applicants_count INT DEFAULT 0,
    posted_datetime  DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at        DATETIME,

    INDEX idx_jobs_recruiter   (recruiter_id),
    INDEX idx_jobs_company     (company_id),
    INDEX idx_jobs_status      (status),
    INDEX idx_jobs_location    (location),
    INDEX idx_jobs_posted      (posted_datetime),
    INDEX idx_jobs_industry    (industry),
    FULLTEXT INDEX ft_jobs_title_desc (title, description),
    CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id)
        REFERENCES recruiters(recruiter_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    application_id   VARCHAR(36) PRIMARY KEY,
    job_id           VARCHAR(36) NOT NULL,
    member_id        VARCHAR(36) NOT NULL,
    resume_url       VARCHAR(500),
    cover_letter     TEXT,
    status           ENUM('submitted','reviewing','interview','offer','rejected')
                     DEFAULT 'submitted',
    idempotency_key  VARCHAR(255) UNIQUE,
    submitted_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_app_job_member (job_id, member_id),
    INDEX idx_app_member   (member_id),
    INDEX idx_app_status   (status),
    INDEX idx_app_submitted (submitted_at),
    CONSTRAINT fk_app_job    FOREIGN KEY (job_id)
        REFERENCES jobs(job_id) ON DELETE CASCADE,
    CONSTRAINT fk_app_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 7. APPLICATION NOTES (recruiter review comments)
CREATE TABLE IF NOT EXISTS application_notes (
    note_id        VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NOT NULL,
    recruiter_id   VARCHAR(36) NOT NULL,
    note           TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_note_app (application_id),
    CONSTRAINT fk_note_app FOREIGN KEY (application_id)
        REFERENCES applications(application_id) ON DELETE CASCADE,
    CONSTRAINT fk_note_recruiter FOREIGN KEY (recruiter_id)
        REFERENCES recruiters(recruiter_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 8. CONNECTIONS
CREATE TABLE IF NOT EXISTS connections (
    connection_id  VARCHAR(36) PRIMARY KEY,
    requester_id   VARCHAR(36) NOT NULL,
    receiver_id    VARCHAR(36) NOT NULL,
    status         ENUM('pending','accepted','rejected') DEFAULT 'pending',
    requested_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at    DATETIME,

    UNIQUE KEY uq_connection (requester_id, receiver_id),
    INDEX idx_conn_receiver  (receiver_id),
    INDEX idx_conn_status    (status),
    CONSTRAINT fk_conn_requester FOREIGN KEY (requester_id)
        REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_conn_receiver  FOREIGN KEY (receiver_id)
        REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 9. SAVED JOBS  (member bookmarks a job)
CREATE TABLE IF NOT EXISTS saved_jobs (
    saved_id    VARCHAR(36) PRIMARY KEY,
    member_id   VARCHAR(36) NOT NULL,
    job_id      VARCHAR(36) NOT NULL,
    saved_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_saved (member_id, job_id),
    INDEX idx_saved_job (job_id),
    CONSTRAINT fk_saved_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_job    FOREIGN KEY (job_id)
        REFERENCES jobs(job_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 10. PROFILE VIEWS (daily aggregated for member dashboard)
CREATE TABLE IF NOT EXISTS profile_views_daily (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id   VARCHAR(36) NOT NULL,
    view_date   DATE        NOT NULL,
    view_count  INT         DEFAULT 1,

    UNIQUE KEY uq_pv (member_id, view_date),
    CONSTRAINT fk_pv_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. PROCESSED EVENTS (idempotency de-dup for Kafka consumers)
CREATE TABLE IF NOT EXISTS processed_events (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    event_type      VARCHAR(100) NOT NULL,
    processed_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_pe_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
