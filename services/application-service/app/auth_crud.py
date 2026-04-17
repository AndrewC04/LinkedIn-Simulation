from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.security import hash_password, verify_password


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

    import uuid
    member_id = str(uuid.uuid4())
    password_hash = hash_password(password)

    db.execute(
        text(
            """
            INSERT INTO members (
                member_id, first_name, last_name, email, password_hash
            )
            VALUES (
                :member_id, :first_name, :last_name, :email, :password_hash
            )
            """
        ),
        {
            "member_id": member_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password_hash": password_hash,
        },
    )
    db.commit()

    return {
        "user_id": member_id,
        "email": email,
        "role": "member",
        "first_name": first_name,
        "last_name": last_name,
    }


def create_recruiter_account(
    db: Session,
    *,
    recruiter_id: str,
    company_id: str,
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

    return {
        "user_id": recruiter_id,
        "email": email,
        "role": "recruiter",
        "first_name": first_name,
        "last_name": last_name,
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

        if row is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not row[4] or not verify_password(password, row[4]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "user_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "role": "member",
        }

    if role == "recruiter":
        row = db.execute(
            text(
                """
                SELECT recruiter_id, first_name, last_name, email, password_hash
                FROM recruiters
                WHERE email = :email
                """
            ),
            {"email": email},
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not row[4] or not verify_password(password, row[4]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "user_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "role": "recruiter",
        }

    raise HTTPException(status_code=400, detail="Role must be member or recruiter")