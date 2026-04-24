"""
shared/service_config.py
Service URLs, ports, and connection strings.
Everyone imports from here — no hardcoded URLs.
"""

import os


class ServicePorts:
    PROFILE = 8001
    JOB = 8002
    APPLICATION = 8003
    MESSAGING = 8004
    ANALYTICS = 8005
    AI = 8006
    CLIENT = 3000


class KafkaConfig:
    # Inside Docker network
    BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    # For local testing from host machine
    BOOTSTRAP_SERVERS_LOCAL = "localhost:29092"


class MySQLConfig:
    HOST = os.getenv("MYSQL_HOST", "mysql")
    PORT = int(os.getenv("MYSQL_PORT", 3306))
    DATABASE = os.getenv("MYSQL_DATABASE", "linkedin_db")
    USER = os.getenv("MYSQL_USER", "appuser")
    PASSWORD = os.getenv("MYSQL_PASSWORD", "apppassword")

    @classmethod
    def url(cls) -> str:
        return f"mysql+pymysql://{cls.USER}:{cls.PASSWORD}@{cls.HOST}:{cls.PORT}/{cls.DATABASE}"


class MongoConfig:
    HOST = os.getenv("MONGO_HOST", "mongodb")
    PORT = int(os.getenv("MONGO_PORT", 27017))
    DATABASE = os.getenv("MONGO_DATABASE", "linkedin_events")
    USER = os.getenv("MONGO_USER", "root")
    PASSWORD = os.getenv("MONGO_PASSWORD", "rootpassword")

    @classmethod
    def uri(cls) -> str:
        return f"mongodb://{cls.USER}:{cls.PASSWORD}@{cls.HOST}:{cls.PORT}/{cls.DATABASE}?authSource=admin"


class RedisConfig:
    HOST = os.getenv("REDIS_HOST", "redis")
    PORT = int(os.getenv("REDIS_PORT", 6379))
    PASSWORD = os.getenv("REDIS_PASSWORD", "redispassword")
    DB = 0

    @classmethod
    def url(cls) -> str:
        return f"redis://:{cls.PASSWORD}@{cls.HOST}:{cls.PORT}/{cls.DB}"
