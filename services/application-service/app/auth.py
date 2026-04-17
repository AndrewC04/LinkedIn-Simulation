from dataclasses import dataclass

from fastapi import Header, HTTPException, status


@dataclass
class CurrentUser:
    user_id: str
    role: str


def get_current_user(
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
) -> CurrentUser:
    if not x_user_id or not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication headers",
        )

    role = x_user_role.strip().lower()
    if role not in {"member", "recruiter"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role",
        )

    return CurrentUser(user_id=x_user_id, role=role)


def require_member(user: CurrentUser) -> None:
    if user.role != "member":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member access required",
        )


def require_recruiter(user: CurrentUser) -> None:
    if user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required",
        )