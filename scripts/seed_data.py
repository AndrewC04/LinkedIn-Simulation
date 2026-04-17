#!/usr/bin/env python3
"""
LinkedIn Simulation – Data Loader (Surya p2)
Populates MySQL + MongoDB with 10k+ realistic seed data.

Usage:
    pip install faker pymysql pymongo sqlalchemy --break-system-packages
    python seed_data.py            # default: 10k each
    python seed_data.py --scale 2  # 20k each
"""

import argparse
import json
import os
import random
import sys
import uuid
from datetime import datetime, timedelta

from faker import Faker
import pymysql
import pymongo
from pymongo import InsertOne


# Config — imports from shared/service_config.py when available,
# falls back to env vars for running outside Docker (localhost).

try:
    from shared.service_config import MySQLConfig, MongoConfig
    MYSQL_HOST     = MySQLConfig.HOST
    MYSQL_PORT     = MySQLConfig.PORT
    MYSQL_USER     = MySQLConfig.USER
    MYSQL_PASSWORD = MySQLConfig.PASSWORD
    MYSQL_DB       = MySQLConfig.DATABASE
    MONGO_URI      = MongoConfig.uri()
    MONGO_DB       = MongoConfig.DATABASE
except ImportError:
    MYSQL_HOST     = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT     = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER     = os.getenv("MYSQL_USER", "appuser")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "apppassword")
    MYSQL_DB       = os.getenv("MYSQL_DB", "linkedin_db")
    MONGO_URI      = os.getenv("MONGO_URI", "mongodb://root:rootpassword@localhost:27017/linkedin_events")
    MONGO_DB       = os.getenv("MONGO_DB", "linkedin_events")

fake = Faker()
Faker.seed(42)
random.seed(42)


# Skill + industry pools

SKILLS_POOL = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue.js",
    "Node.js", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Kafka",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch",
    "TensorFlow", "Data Analysis", "Pandas", "Spark", "Hadoop",
    "REST API", "GraphQL", "gRPC", "Microservices", "System Design",
    "Agile", "Scrum", "Project Management", "Leadership", "Communication",
    "Product Management", "UX Design", "Figma", "Adobe XD",
    "Cybersecurity", "Networking", "Linux", "Git", "HTML", "CSS",
    "Spring Boot", "Django", "Flask", "FastAPI", "Express.js",
    "Salesforce", "SAP", "Power BI", "Tableau", "Excel"
]

INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Education", "Retail",
    "Manufacturing", "Consulting", "Media", "Telecommunications",
    "Automotive", "Aerospace", "Energy", "Real Estate", "Legal",
    "Hospitality", "Transportation", "Agriculture", "Pharmaceutical",
    "Insurance", "Government"
]

SENIORITY_LEVELS = ["Internship", "Entry level", "Associate", "Mid-Senior level", "Director", "Executive"]
EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"]
WORK_MODES = ["onsite", "remote", "hybrid"]
COMPANY_SIZES = ["1-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"]

JOB_TITLES = [
    "Software Engineer", "Senior Software Engineer", "Staff Engineer",
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Scientist", "Data Engineer", "ML Engineer", "AI Researcher",
    "DevOps Engineer", "SRE", "Cloud Architect", "Solutions Architect",
    "Product Manager", "Technical Program Manager", "Engineering Manager",
    "UX Designer", "UI Developer", "QA Engineer", "Security Engineer",
    "Business Analyst", "Scrum Master", "Technical Writer",
    "Database Administrator", "Network Engineer", "Mobile Developer",
    "iOS Developer", "Android Developer", "Blockchain Developer"
]

APPLICATION_STATUSES = ["submitted", "reviewing", "interview", "offer", "rejected"]
CONNECTION_STATUSES  = ["pending", "accepted", "rejected"]

US_CITIES = [
    ("San Francisco", "CA"), ("San Jose", "CA"), ("Los Angeles", "CA"),
    ("Seattle", "WA"), ("Portland", "OR"), ("New York", "NY"),
    ("Boston", "MA"), ("Austin", "TX"), ("Dallas", "TX"), ("Houston", "TX"),
    ("Chicago", "IL"), ("Denver", "CO"), ("Atlanta", "GA"), ("Miami", "FL"),
    ("Phoenix", "AZ"), ("Philadelphia", "PA"), ("Minneapolis", "MN"),
    ("Detroit", "MI"), ("Raleigh", "NC"), ("Nashville", "TN"),
    ("Salt Lake City", "UT"), ("San Diego", "CA"), ("Pittsburgh", "PA"),
    ("Washington", "DC"), ("Charlotte", "NC"), ("Columbus", "OH"),
    ("Indianapolis", "IN"), ("Tampa", "FL"), ("Orlando", "FL"),
    ("St. Louis", "MO")
]

# Helper generators

def uid():
    return str(uuid.uuid4())

def rand_skills(min_n=2, max_n=8):
    return random.sample(SKILLS_POOL, random.randint(min_n, max_n))

def rand_city():
    return random.choice(US_CITIES)

def rand_date(start_days_ago=365, end_days_ago=0):
    delta = random.randint(end_days_ago, start_days_ago)
    return datetime.utcnow() - timedelta(days=delta)

def rand_salary():
    base = random.choice([50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200])
    return base * 1000, (base + random.randint(10, 40)) * 1000

def generate_resume_text(first, last, skills, headline):
    """Minimal fake resume text for AI parsing."""
    exp_years = random.randint(1, 15)
    return (
        f"{first} {last}\n{headline}\n\n"
        f"EXPERIENCE: {exp_years} years\n"
        f"SKILLS: {', '.join(skills)}\n\n"
        f"SUMMARY: Experienced professional with expertise in {', '.join(skills[:3])}. "
        f"Proven track record of delivering results across {exp_years} years in the industry."
    )


# MySQL seeder

class MySQLSeeder:
    def __init__(self, scale):
        self.scale = scale
        self.n_members    = 10_000 * scale
        self.n_recruiters = 10_000 * scale
        self.n_jobs       = 10_000 * scale
        self.n_companies  = 2_000 * scale
        self.conn = None

        # store IDs for FK references
        self.member_ids    = []
        self.recruiter_ids = []
        self.job_ids       = []
        self.company_ids   = []
        self.company_map   = {}  # company_id -> (name, industry, size)

    def connect(self):
        self.conn = pymysql.connect(
            host=MYSQL_HOST, port=MYSQL_PORT,
            user=MYSQL_USER, password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            charset="utf8mb4",
            autocommit=False
        )
        print(f"Connected to MySQL {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}")

    def close(self):
        if self.conn:
            self.conn.close()

    def _exec_batch(self, sql, rows, batch_size=2000):
        cursor = self.conn.cursor()
        for i in range(0, len(rows), batch_size):
            chunk = rows[i:i+batch_size]
            cursor.executemany(sql, chunk)
            self.conn.commit()
        cursor.close()

    # --- Companies (helper, not a table, used to fill recruiter data) ---
    def gen_companies(self):
        print(f"  Generating {self.n_companies} companies …")
        for _ in range(self.n_companies):
            cid = uid()
            self.company_ids.append(cid)
            self.company_map[cid] = (
                fake.company(),
                random.choice(INDUSTRIES),
                random.choice(COMPANY_SIZES)
            )

    # --- Members ---
    def seed_members(self):
        print(f"  Seeding {self.n_members} members …")
        rows = []
        for _ in range(self.n_members):
            mid = uid()
            self.member_ids.append(mid)
            first = fake.first_name()
            last  = fake.last_name()
            city, state = rand_city()
            skills = rand_skills()
            headline = f"{random.choice(JOB_TITLES)} | {random.choice(INDUSTRIES)}"
            rows.append((
                mid, first, last,
                f"{first.lower()}.{last.lower()}{random.randint(1,999)}@{fake.free_email_domain()}",
                fake.phone_number()[:20],
                city, state, "United States",
                headline,
                fake.paragraph(nb_sentences=3),
                json.dumps(skills),
                None,  # profile_photo_url
                None,  # resume_url
                generate_resume_text(first, last, skills, headline),
                0, 0
            ))

        sql = """INSERT INTO members
            (member_id, first_name, last_name, email, phone,
             location_city, location_state, location_country,
             headline, summary, skills, profile_photo_url,
             resume_url, resume_text, connections_count, profile_views)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} members inserted")

    # --- Member experience ---
    def seed_experience(self):
        print(f"  Seeding member experience …")
        rows = []
        for mid in self.member_ids:
            n_exp = random.randint(1, 4)
            for _ in range(n_exp):
                start = fake.date_between(start_date="-10y", end_date="-1y")
                end = fake.date_between(start_date=start, end_date="today") if random.random() > 0.3 else None
                rows.append((
                    uid(), mid,
                    random.choice(JOB_TITLES),
                    fake.company(),
                    f"{rand_city()[0]}, {rand_city()[1]}",
                    start, end,
                    fake.sentence(nb_words=12)
                ))

        sql = """INSERT INTO member_experience
            (experience_id, member_id, title, company_name, location,
             start_date, end_date, description)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} experience records inserted")

    # --- Member education ---
    def seed_education(self):
        print(f"  Seeding member education …")
        rows = []
        schools = [
            "Stanford University", "MIT", "UC Berkeley", "Carnegie Mellon",
            "Georgia Tech", "UT Austin", "University of Michigan",
            "University of Washington", "UCLA", "Columbia University",
            "SJSU", "Cal Poly", "Arizona State University",
            "University of Illinois", "Purdue University", "Ohio State",
            "Penn State", "NYU", "USC", "Cornell University"
        ]
        degrees = ["B.S.", "B.A.", "M.S.", "M.B.A.", "Ph.D."]
        fields  = [
            "Computer Science", "Electrical Engineering", "Data Science",
            "Information Systems", "Business Administration", "Mathematics",
            "Mechanical Engineering", "Economics", "Physics", "Statistics"
        ]
        for mid in self.member_ids:
            n_edu = random.randint(1, 2)
            for _ in range(n_edu):
                sy = random.randint(2005, 2022)
                rows.append((
                    uid(), mid,
                    random.choice(schools),
                    random.choice(degrees),
                    random.choice(fields),
                    sy, sy + random.randint(2, 5)
                ))

        sql = """INSERT INTO member_education
            (education_id, member_id, school_name, degree, field_of_study,
             start_year, end_year)
            VALUES (%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} education records inserted")

    # --- Recruiters ---
    def seed_recruiters(self):
        print(f"  Seeding {self.n_recruiters} recruiters …")
        rows = []
        for _ in range(self.n_recruiters):
            rid = uid()
            self.recruiter_ids.append(rid)
            cid = random.choice(self.company_ids)
            cname, cind, csize = self.company_map[cid]
            first = fake.first_name()
            last  = fake.last_name()
            rows.append((
                rid, cid, first, last,
                f"{first.lower()}.{last.lower()}{random.randint(1,999)}@{fake.free_email_domain()}",
                fake.phone_number()[:20],
                cname, cind, csize, "admin"
            ))

        sql = """INSERT INTO recruiters
            (recruiter_id, company_id, first_name, last_name, email, phone,
             company_name, company_industry, company_size, role_level)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} recruiters inserted")

    # --- Jobs ---
    def seed_jobs(self):
        print(f"  Seeding {self.n_jobs} jobs …")
        rows = []
        for _ in range(self.n_jobs):
            jid = uid()
            self.job_ids.append(jid)
            rid = random.choice(self.recruiter_ids)
            # Look up company from recruiter (simplified: random company)
            cid = random.choice(self.company_ids)
            cname, cind, _ = self.company_map[cid]
            city, state = rand_city()
            sal_min, sal_max = rand_salary()
            is_closed = random.random() < 0.1
            posted = rand_date(365, 30)
            rows.append((
                jid, rid, cid,
                random.choice(JOB_TITLES),
                fake.paragraph(nb_sentences=5),
                random.choice(SENIORITY_LEVELS),
                random.choice(EMPLOYMENT_TYPES),
                f"{city}, {state}",
                random.choice(WORK_MODES),
                cind,
                json.dumps(rand_skills(3, 7)),
                sal_min, sal_max,
                "closed" if is_closed else "open",
                random.randint(0, 5000),
                random.randint(0, 200),
                posted,
                posted + timedelta(days=random.randint(30, 90)) if is_closed else None
            ))

        sql = """INSERT INTO jobs
            (job_id, recruiter_id, company_id, title, description,
             seniority_level, employment_type, location, work_mode,
             industry, skills_required, salary_min, salary_max,
             status, views_count, applicants_count,
             posted_datetime, closed_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} jobs inserted")

    # --- Applications ---
    def seed_applications(self):
        n_apps = int(self.n_jobs * 3.5)   # ~35k applications for 10k jobs
        print(f"  Seeding ~{n_apps} applications …")
        seen = set()
        rows = []
        attempts = 0
        while len(rows) < n_apps and attempts < n_apps * 3:
            attempts += 1
            jid = random.choice(self.job_ids)
            mid = random.choice(self.member_ids)
            key = (jid, mid)
            if key in seen:
                continue
            seen.add(key)
            idem = uid()
            rows.append((
                uid(), jid, mid,
                None,  # resume_url
                fake.sentence(nb_words=20) if random.random() > 0.5 else None,
                random.choices(
                    APPLICATION_STATUSES,
                    weights=[40, 25, 15, 10, 10]
                )[0],
                idem,
                rand_date(180, 1)
            ))

        sql = """INSERT INTO applications
            (application_id, job_id, member_id, resume_url, cover_letter,
             status, idempotency_key, submitted_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} applications inserted")

    # --- Connections ---
    def seed_connections(self):
        n_conns = self.n_members * 3  # avg 3 connections per member
        print(f"  Seeding ~{n_conns} connections …")
        seen = set()
        rows = []
        attempts = 0
        while len(rows) < n_conns and attempts < n_conns * 3:
            attempts += 1
            a = random.choice(self.member_ids)
            b = random.choice(self.member_ids)
            if a == b:
                continue
            key = tuple(sorted([a, b]))
            if key in seen:
                continue
            seen.add(key)
            status = random.choices(CONNECTION_STATUSES, weights=[15, 75, 10])[0]
            req_at = rand_date(300, 1)
            rows.append((
                uid(), a, b, status, req_at,
                req_at + timedelta(days=random.randint(0, 7)) if status != "pending" else None
            ))

        sql = """INSERT INTO connections
            (connection_id, requester_id, receiver_id, status,
             requested_at, resolved_at)
            VALUES (%s,%s,%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} connections inserted")

    # --- Saved jobs ---
    def seed_saved_jobs(self):
        n_saved = self.n_members * 2
        print(f"  Seeding ~{n_saved} saved jobs …")
        seen = set()
        rows = []
        attempts = 0
        while len(rows) < n_saved and attempts < n_saved * 3:
            attempts += 1
            mid = random.choice(self.member_ids)
            jid = random.choice(self.job_ids)
            key = (mid, jid)
            if key in seen:
                continue
            seen.add(key)
            rows.append((uid(), mid, jid, rand_date(120, 1)))

        sql = """INSERT INTO saved_jobs (saved_id, member_id, job_id, saved_at)
            VALUES (%s,%s,%s,%s)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} saved jobs inserted")

    # --- Profile views daily ---
    def seed_profile_views(self):
        print(f"  Seeding profile view data (last 30 days) …")
        rows = []
        # Only ~30% of members get profile views
        viewed_members = random.sample(self.member_ids, int(len(self.member_ids) * 0.3))
        for mid in viewed_members:
            n_days = random.randint(5, 30)
            for d in random.sample(range(30), min(n_days, 30)):
                vdate = (datetime.utcnow() - timedelta(days=d)).date()
                rows.append((mid, vdate, random.randint(1, 25)))

        sql = """INSERT INTO profile_views_daily (member_id, view_date, view_count)
            VALUES (%s,%s,%s)
            ON DUPLICATE KEY UPDATE view_count = view_count + VALUES(view_count)"""
        self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} profile-view rows inserted")

    # --- Application notes ---
    def seed_application_notes(self):
        print(f"  Seeding application notes …")
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT application_id, job_id FROM applications
            WHERE status IN ('reviewing','interview','offer','rejected')
            LIMIT 5000
        """)
        apps = cursor.fetchall()
        cursor.close()

        rows = []
        notes_pool = [
            "Strong candidate – schedule phone screen.",
            "Skills match well, but lacks leadership experience.",
            "Excellent cultural fit. Move to panel interview.",
            "Resume doesn't match job requirements closely enough.",
            "Referred by internal employee. Prioritize.",
            "Good communication skills evident in cover letter.",
            "Overqualified for this role; consider for senior opening.",
            "Technical assessment score: above average.",
            "Not enough relevant experience. Reject.",
            "Top 10% candidate. Extend offer ASAP."
        ]
        for app_id, _ in apps:
            if random.random() > 0.4:
                continue
            rows.append((
                uid(), app_id,
                random.choice(self.recruiter_ids),
                random.choice(notes_pool),
            ))

        sql = """INSERT INTO application_notes
            (note_id, application_id, recruiter_id, note)
            VALUES (%s,%s,%s,%s)"""
        if rows:
            self._exec_batch(sql, rows)
        print(f"    ✓ {len(rows)} application notes inserted")

    # --- Run all ---
    def run(self):
        self.connect()
        try:
            self.gen_companies()
            self.seed_members()
            self.seed_experience()
            self.seed_education()
            self.seed_recruiters()
            self.seed_jobs()
            self.seed_applications()
            self.seed_connections()
            self.seed_saved_jobs()
            self.seed_profile_views()
            self.seed_application_notes()

            # Update connections_count on members
            print("  Updating connections_count …")
            cursor = self.conn.cursor()
            cursor.execute("""
                UPDATE members m SET connections_count = (
                    SELECT COUNT(*) FROM connections c
                    WHERE c.status = 'accepted'
                      AND (c.requester_id = m.member_id OR c.receiver_id = m.member_id)
                )
            """)
            self.conn.commit()
            cursor.close()
            print("    ✓ connections_count updated")

        finally:
            self.close()



# MongoDB seeder

class MongoSeeder:
    def __init__(self, scale, member_ids, recruiter_ids, job_ids):
        self.scale = scale
        self.member_ids    = member_ids
        self.recruiter_ids = recruiter_ids
        self.job_ids       = job_ids
        self.client = None
        self.db = None

    def connect(self):
        self.client = pymongo.MongoClient(MONGO_URI)
        self.db = self.client[MONGO_DB]
        print(f"Connected to MongoDB {MONGO_URI}/{MONGO_DB}")

    def close(self):
        if self.client:
            self.client.close()

    # --- Threads + Messages ---
    def seed_messages(self):
        n_threads = int(5_000 * self.scale)
        print(f"  Seeding {n_threads} threads + messages …")
        thread_docs = []
        message_docs = []

        for _ in range(n_threads):
            tid = uid()
            p1 = random.choice(self.member_ids)
            p2 = random.choice(self.member_ids)
            if p1 == p2:
                continue
            thread_created = rand_date(180, 1)
            n_msgs = random.randint(1, 10)
            last_ts = thread_created
            last_preview = ""

            for j in range(n_msgs):
                sender = p1 if j % 2 == 0 else p2
                receiver = p2 if j % 2 == 0 else p1
                ts = last_ts + timedelta(minutes=random.randint(1, 1440))
                text = fake.sentence(nb_words=random.randint(4, 20))
                last_ts = ts
                last_preview = text[:80]
                message_docs.append({
                    "message_id": uid(),
                    "thread_id": tid,
                    "sender_id": sender,
                    "receiver_id": receiver,
                    "message_text": text,
                    "sent_at": ts,
                    "read": random.random() > 0.3
                })

            thread_docs.append({
                "thread_id": tid,
                "participants": [p1, p2],
                "created_at": thread_created,
                "last_message_at": last_ts,
                "last_message_preview": last_preview
            })

        if thread_docs:
            self.db.threads.insert_many(thread_docs, ordered=False)
        if message_docs:
            # bulk insert in chunks
            for i in range(0, len(message_docs), 5000):
                self.db.messages.insert_many(message_docs[i:i+5000], ordered=False)
        print(f"    ✓ {len(thread_docs)} threads, {len(message_docs)} messages inserted")

    # --- Events (analytics log) ---
    def seed_events(self):
        n_events = int(50_000 * self.scale)
        print(f"  Seeding {n_events} analytics events …")

        event_types = [
            ("job.viewed",             "job",         0.35),
            ("job.saved",              "job",         0.15),
            ("job.applied",            "job",         0.10),
            ("application.submitted",  "application", 0.15),
            ("application.status.updated", "application", 0.05),
            ("message.sent",           "thread",      0.10),
            ("connection.requested",   "connection",  0.05),
            ("connection.accepted",    "connection",  0.05),
        ]
        types, entities, weights = zip(*event_types)

        docs = []
        for _ in range(n_events):
            idx = random.choices(range(len(types)), weights=weights)[0]
            etype = types[idx]
            ent_type = entities[idx]
            if ent_type == "job":
                ent_id = random.choice(self.job_ids)
            else:
                ent_id = uid()

            docs.append({
                "event_type": etype,
                "trace_id": uid(),
                "timestamp": rand_date(90, 0),
                "actor_id": random.choice(self.member_ids),
                "entity": {"entity_type": ent_type, "entity_id": ent_id},
                "payload": {},
                "idempotency_key": uid()
            })

        for i in range(0, len(docs), 5000):
            self.db.events.insert_many(docs[i:i+5000], ordered=False)
        print(f"    ✓ {len(docs)} events inserted")

    # --- Agent traces (sample) ---
    def seed_agent_traces(self):
        n_tasks = int(200 * self.scale)
        print(f"  Seeding {n_tasks} AI agent tasks + traces …")
        task_docs = []
        trace_docs = []
        steps = ["resume_parse", "match_score", "outreach_draft"]

        for _ in range(n_tasks):
            task_id = uid()
            trace_id = uid()
            rid = random.choice(self.recruiter_ids)
            jid = random.choice(self.job_ids)
            created = rand_date(60, 1)
            status = random.choice(["completed", "completed", "completed", "failed", "running"])

            completed_steps = steps[:random.randint(1, 3)] if status == "completed" else steps[:random.randint(0, 2)]

            task_docs.append({
                "task_id": task_id,
                "trace_id": trace_id,
                "recruiter_id": rid,
                "job_id": jid,
                "task_type": "shortlist_candidates",
                "status": status,
                "steps_completed": completed_steps,
                "result": {"shortlisted_count": random.randint(3, 15)} if status == "completed" else None,
                "created_at": created,
                "updated_at": created + timedelta(seconds=random.randint(5, 120))
            })

            for step in completed_steps:
                started = created + timedelta(seconds=random.randint(1, 10))
                trace_docs.append({
                    "trace_id": trace_id,
                    "task_id": task_id,
                    "step": step,
                    "status": "completed",
                    "input": {"job_id": jid},
                    "output": {"score": round(random.uniform(0.3, 0.99), 2)},
                    "started_at": started,
                    "completed_at": started + timedelta(seconds=random.randint(1, 30)),
                    "error": None
                })

        if task_docs:
            self.db.agent_tasks.insert_many(task_docs, ordered=False)
        if trace_docs:
            self.db.agent_traces.insert_many(trace_docs, ordered=False)
        print(f"    ✓ {len(task_docs)} tasks, {len(trace_docs)} traces inserted")

    def run(self):
        self.connect()
        try:
            self.seed_messages()
            self.seed_events()
            self.seed_agent_traces()
        finally:
            self.close()



# Main
def main():
    parser = argparse.ArgumentParser(description="Seed LinkedIn simulation databases")
    parser.add_argument("--scale", type=int, default=1, help="Multiplier (1 = 10k each)")
    parser.add_argument("--mysql-only", action="store_true")
    parser.add_argument("--mongo-only", action="store_true")
    args = parser.parse_args()

    print(f"🚀 LinkedIn Data Loader — scale={args.scale}x")
    print(f"   Target: ~{10_000*args.scale} members, ~{10_000*args.scale} jobs, "
          f"~{10_000*args.scale} recruiters\n")

    mysql_seeder = MySQLSeeder(args.scale)

    if not args.mongo_only:
        print("═══ MySQL ═══")
        mysql_seeder.run()
        print()

    if not args.mysql_only:
        print("═══ MongoDB ═══")
        mongo_seeder = MongoSeeder(
            args.scale,
            mysql_seeder.member_ids,
            mysql_seeder.recruiter_ids,
            mysql_seeder.job_ids
        )
        mongo_seeder.run()
        print()

    print("Seeding complete!")
    print(f"   MySQL:   members={len(mysql_seeder.member_ids)}, "
          f"recruiters={len(mysql_seeder.recruiter_ids)}, "
          f"jobs={len(mysql_seeder.job_ids)}")
    print(f"   MongoDB: threads, messages, events, agent_tasks, agent_traces")


if __name__ == "__main__":
    main()
