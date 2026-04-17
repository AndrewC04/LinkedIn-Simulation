from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "application-service"
    app_env: str = "dev"
    app_host: str = "0.0.0.0"
    app_port: int = 8005
    database_url: str
    enable_kafka: bool = False
    job_service_url: str = "http://localhost:8004"
    profile_service_url: str = "http://localhost:8003"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()