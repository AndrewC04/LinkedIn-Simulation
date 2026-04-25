from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid

from shared.security import hash_password, verify_password, create_access_token


def create_member_account(
    db: Session,
    *,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
) -> dict:
    existing = db.execute(
        text("SELECT member_id FROM members WHERE email = :email"),
        {"email": email},
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Member email already exists",
        )

    member_id = f"mem_{uuid.uuid4().hex[:8]}"
    password_hash = hash_password(password)

    db.execute(
        text(
            """
            INSERT INTO members (
                member_id, first_name, last_name, email, password_hash, headline
            )
            VALUES (
                :member_id, :first_name, :last_name, :email, :password_hash, :headline
            )
            """
        ),
        {
            "member_id": member_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password_hash": password_hash,
            "headline": "Looking for work",
        },
    )
    db.commit()

    access_token = create_access_token(
        {"sub": member_id, "role": "member", "email": email}
    )

    return {
        "user_id": member_id,
        "email": email,
        "role": "member",
        "first_name": first_name,
        "last_name": last_name,
        "access_token": access_token,
        "token_type": "bearer",
    }


def create_recruiter_account(
    db: Session,
    *,
    first_name: str,
    last_name: str,
    email: str,
    company_name: str,
    password: str,
) -> dict:
    existing = db.execute(
        text("SELECT recruiter_id FROM recruiters WHERE email = :email"),
        {"email": email},
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recruiter email already exists",
        )

    recruiter_id = f"rec_{uuid.uuid4().hex[:8]}"
    company_id = f"comp_{uuid.uuid4().hex[:8]}"
    password_hash = hash_password(password)

    db.execute(
        text(
            """
            INSERT INTO recruiters (
                recruiter_id, company_id, first_name, last_name, email, company_name, password_hash
            )
            VALUES (
                :recruiter_id, :company_id, :first_name, :last_name, :email, :company_name, :password_hash
            )
            """
        ),
        {
            "recruiter_id": recruiter_id,
            "company_id": company_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "company_name": company_name,
            "password_hash": password_hash,
        },
    )
    db.commit()

    access_token = create_access_token(
        {"sub": recruiter_id, "role": "recruiter", "email": email}
    )

    return {
        "user_id": recruiter_id,
        "email": email,
        "role": "recruiter",
        "first_name": first_name,
        "last_name": last_name,
        "company_id": company_id,
        "access_token": access_token,
        "token_type": "bearer",
    }


def login_user(db: Session, *, email: str, password: str, role: str) -> dict:
    role = role.strip().lower()

    if role == "member":
        row = db.execute(
            text(
                """
                SELECT member_id, first_name, last_name, email, password_hash
                FROM members
                WHERE email = :email
                """
            ),
            {"email": email},
        ).fetchone()

        if row is None or not row[4] or not verify_password(password, row[4]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(
            {"sub": row[0], "role": "member", "email": row[3]}
        )

        return {
            "user_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "role": "member",
            "access_token": access_token,
            "token_type": "bearer",
        }

    if role == "recruiter":
        row = db.execute(
            text(
                """
                SELECT recruiter_id, first_name, last_name, email, company_name, password_hash, company_id
                FROM recruiters
                WHERE email = :email
                """
            ),
            {"email": email},
        ).fetchone()

        if row is None or not row[5] or not verify_password(password, row[5]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(
            {"sub": row[0], "role": "recruiter", "email": row[3]}
        )

        return {
            "user_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "company_name": row[4],
            "company_id": row[6],
            "role": "recruiter",
            "access_token": access_token,
            "token_type": "bearer",
        }

    raise HTTPException(status_code=400, detail="Role must be member or recruiter")


def get_recruiter(db: Session, *, recruiter_id: str) -> dict | None:
    row = db.execute(
        text(
            """
            SELECT recruiter_id, first_name, last_name, email, company_name
            FROM recruiters
            WHERE recruiter_id = :recruiter_id
            """
        ),
        {"recruiter_id": recruiter_id},
    ).fetchone()

    if not row:
        return None

    return {
        "recruiter_id": row[0],
        "first_name": row[1],
        "last_name": row[2],
        "full_name": f"{row[1]} {row[2]}".strip(),
        "email": row[3],
        "company_name": row[4],
    }


def search_recruiters(db: Session, *, name: str = "", limit: int = 8) -> list:
    rows = db.execute(
        text(
            """
            SELECT recruiter_id, first_name, last_name, email, company_name
            FROM recruiters
            WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE :q
               OR LOWER(company_name) LIKE :q
            ORDER BY first_name
            LIMIT :limit
            """
        ),
        {"q": f"%{name.strip().lower()}%", "limit": limit},
    ).fetchall()

    return [
        {
            "recruiter_id": r[0],
            "first_name": r[1],
            "last_name": r[2],
            "full_name": f"{r[1]} {r[2]}".strip(),
            "email": r[3],
            "company_name": r[4],
        }
        for r in rows
    ]
