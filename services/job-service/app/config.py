from pydantic import BaseModel
from dotenv import load_dotenv
import os


load_dotenv()



class Settings(BaseModel):
    mysql_host: str = os.getenv("MYSQL_HOST", "localhost")
    mysql_port: int = int(os.getenv("MYSQL_PORT", "3306"))
    mysql_database: str = os.getenv("MYSQL_DATABASE", "linkedin_db")
    mysql_user: str = os.getenv("MYSQL_USER", "appuser")
    mysql_password: str = os.getenv("MYSQL_PASSWORD", "apppassword")

    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    redis_password: str | None = os.getenv("REDIS_PASSWORD") or None  # ← fixed

    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
    kafka_enabled: bool = os.getenv("KAFKA_ENABLED", "false").lower() == "true"

    job_service_host: str = os.getenv("JOB_SERVICE_HOST", "0.0.0.0")
    job_service_port: int = int(os.getenv("JOB_SERVICE_PORT", "8002"))

    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://appuser:apppassword@localhost:3306/linkedin_db",
    )

    @property
    def sqlalchemy_url(self) -> str:
        return self.database_url



settings = Settings()