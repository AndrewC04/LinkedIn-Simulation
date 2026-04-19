"""
services/profile_service.py – Profile business logic (Raniel P3)
Handles database queries, caching, and event publishing.
Implements the group's API specification.
"""

import json
from typing import List, Optional, Dict, Tuple, Any
from sqlalchemy import text
from datetime import datetime
import uuid

from shared.mysql_client import get_db
from shared.redis_cache import cache_get, cache_set, cache_delete, member_key
from services.profile_service.models.profile import (
    MemberCreateResponse, MemberGetResponse, MemberUpdateResponse,
    MemberSearchResult
)


class ProfileService:
    """Service for member CRUD operations with caching."""

    @staticmethod
    def create_member(member_data: Dict[str, Any]) -> MemberCreateResponse:
        """
        Create a new member profile.
        Returns member_id, full_name, created_at, profile_url.
        """
        member_id = f"mbr_{str(uuid.uuid4())[:8].upper()}"
        created_at = datetime.utcnow()
        profile_url = f"linkedin.com/in/{member_data['full_name'].lower().replace(' ', '-')}"

        # Parse full_name into first and last
        name_parts = member_data['full_name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        with get_db() as db:
            # Check email doesn't exist
            existing = db.execute(
                text("SELECT 1 FROM members WHERE email = :email"),
                {"email": member_data['email']}
            ).fetchone()
            if existing:
                raise ValueError(f"Email already registered: {member_data['email']}")

            # Insert member
            db.execute(
                text("""
                    INSERT INTO members
                    (member_id, first_name, last_name, email, headline,
                     location_city, location_state, location_country,
                     summary, skills, connections_count, profile_views)
                    VALUES (:member_id, :first_name, :last_name, :email, :headline,
                            :location_city, :location_state, :location_country,
                            :summary, :skills, 0, 0)
                """),
                {
                    "member_id": member_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": member_data['email'],
                    "headline": member_data['headline'],
                    "location_city": member_data['location'].split(',')[0].strip() if ',' in member_data['location'] else member_data['location'],
                    "location_state": member_data['location'].split(',')[1].strip() if ',' in member_data['location'] else "",
                    "location_country": "United States",
                    "summary": member_data.get('summary'),
                    "skills": json.dumps(member_data.get('skills', []))
                }
            )
            db.commit()

        return MemberCreateResponse(
            member_id=member_id,
            full_name=member_data['full_name'],
            created_at=created_at,
            profile_url=profile_url
        )

    @staticmethod
    def get_member_profile(member_id: str) -> Optional[MemberGetResponse]:
        """
        Get complete member profile by member_id.
        Cached with 5-min TTL.
        """
        cache_key = member_key(member_id)
        cached = cache_get(cache_key)
        if cached:
            return MemberGetResponse(**cached)

        with get_db() as db:
            result = db.execute(
                text("""
                    SELECT member_id, first_name, last_name, email, headline,
                           location_city, location_state, summary, skills,
                           connections_count, profile_views, created_at, updated_at
                    FROM members
                    WHERE member_id = :id
                """),
                {"id": member_id}
            ).fetchone()

        if not result:
            return None

        location = f"{result[5]}, {result[6]}" if result[5] and result[6] else result[5] or ""

        response_data = {
            "member_id": result[0],
            "full_name": f"{result[1]} {result[2]}",
            "headline": result[3],
            "location": location,
            "skills": json.loads(result[8]) if result[8] else None,
            "summary": result[7],
            "connections": result[9] or 0,
            "created_at": result[11] or datetime.utcnow(),
            "updated_at": result[12] or datetime.utcnow()
        }

        cache_set(cache_key, response_data, ttl_seconds=300)
        return MemberGetResponse(**response_data)

    @staticmethod
    def update_member(member_id: str, fields: Dict[str, Any]) -> Optional[MemberUpdateResponse]:
        """
        Update member profile fields.
        Invalidates cache on successful update.
        """
        with get_db() as db:
            # Check member exists
            check = db.execute(
                text("SELECT member_id FROM members WHERE member_id = :id"),
                {"id": member_id}
            ).fetchone()
            if not check:
                return None

            # Map API fields to DB columns
            field_mapping = {
                "headline": "headline",
                "summary": "summary",
                "location": "location_city",
                "skills": "skills"
            }

            update_dict = {}
            updated_fields = []

            for field, value in fields.items():
                if field in field_mapping:
                    db_field = field_mapping[field]
                    if field == "skills":
                        update_dict[db_field] = json.dumps(value)
                    else:
                        update_dict[db_field] = value
                    updated_fields.append(field)

            if not update_dict:
                return None

            # Build UPDATE query
            set_clause = ", ".join([f"{k} = :{k}" for k in update_dict.keys()])
            sql = f"UPDATE members SET {set_clause}, updated_at = NOW() WHERE member_id = :id"
            db.execute(text(sql), {**update_dict, "id": member_id})
            db.commit()

        # Invalidate cache
        cache_delete(member_key(member_id))

        return MemberUpdateResponse(
            member_id=member_id,
            updated_fields=updated_fields,
            updated_at=datetime.utcnow()
        )

    @staticmethod
    def delete_member(member_id: str) -> Optional[datetime]:
        """
        Delete member profile permanently.
        Returns deleted_at timestamp if successful, None if not found.
        """
        with get_db() as db:
            result = db.execute(
                text("DELETE FROM members WHERE member_id = :id"),
                {"id": member_id}
            )
            db.commit()

            if result.rowcount == 0:
                return None

        # Invalidate cache
        cache_delete(member_key(member_id))

        return datetime.utcnow()

    @staticmethod
    def search_members(
        filters: Optional[Dict[str, str]] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[MemberSearchResult], int]:
        """
        Search members by skill, location, and keyword.
        Returns (results, total_count).
        """
        filters = filters or {}
        offset = (page - 1) * page_size

        where_clauses = []
        params = {}

        if filters.get('skill'):
            where_clauses.append("skills LIKE :skill")
            params['skill'] = f"%{filters['skill']}%"

        if filters.get('location'):
            where_clauses.append("(location_city LIKE :location OR location_state LIKE :location)")
            params['location'] = f"%{filters['location']}%"

        if filters.get('keyword'):
            where_clauses.append("(headline LIKE :keyword OR summary LIKE :keyword)")
            params['keyword'] = f"%{filters['keyword']}%"

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        with get_db() as db:
            # Get total count
            count_result = db.execute(
                text(f"SELECT COUNT(*) FROM members WHERE {where_sql}"),
                params
            ).fetchone()
            total = count_result[0] if count_result else 0

            # Get paginated results
            query = f"""
                SELECT member_id, first_name, last_name, headline,
                       location_city, location_state, skills
                FROM members
                WHERE {where_sql}
                LIMIT :limit OFFSET :offset
            """
            results = db.execute(
                text(query),
                {**params, "limit": page_size, "offset": offset}
            ).fetchall()

        search_results = []
        for row in results:
            location = f"{row[4]}, {row[5]}" if row[4] and row[5] else row[4] or ""
            search_results.append(
                MemberSearchResult(
                    member_id=row[0],
                    full_name=f"{row[1]} {row[2]}",
                    headline=row[3],
                    location=location,
                    skills=json.loads(row[6]) if row[6] else None,
                    match_score=0.95  # Placeholder for relevance scoring
                )
            )

        return search_results, total