import pymysql, pymongo, random, os
from datetime import datetime, timezone, timedelta
from uuid import uuid4

MONGO_URI = os.getenv("MONGO_URI", "mongodb://root:rootpassword@mongodb:27017")

conn = pymysql.connect(host='mysql', port=3306, user='appuser', password='apppassword', database='linkedin_db')
cur = conn.cursor()
cur.execute('SELECT member_id FROM members LIMIT 500')
member_ids = [r[0] for r in cur.fetchall()]
cur.execute('SELECT job_id FROM jobs LIMIT 500')
job_ids = [r[0] for r in cur.fetchall()]
conn.close()

client = pymongo.MongoClient(MONGO_URI, authSource='admin')
db = client['linkedin_events']

events = []
now = datetime.now(timezone.utc)
for _ in range(2000):
    job_id = random.choice(job_ids)
    member_id = random.choice(member_ids)
    days_ago = random.randint(0, 30)
    ts = (now - timedelta(days=days_ago)).isoformat()
    for etype in ['job.viewed', 'job.saved']:
        events.append({
            'event_type': etype,
            'trace_id': str(uuid4()),
            'timestamp': ts,
            'actor_id': member_id,
            'entity': {'entity_type': 'job', 'entity_id': job_id},
            'payload': {'job_id': job_id, 'member_id': member_id},
            'idempotency_key': str(uuid4()),
            '_ingested_at': now.isoformat(),
            'source': 'seed'
        })

db.events.insert_many(events)
print(f'Seeded {len(events)} MongoDB events')
client.close()
