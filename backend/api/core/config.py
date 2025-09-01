from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    PROJECT_NAME: str = "Hero API"
    DATABASE_URL: str
    DEBUG: bool = False

    # JWT Settings
    JWT_SECRET: str  # Change in production
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 30  # minutes

    # MQTT Settings
    mqtt_broker: str
    mqtt_port: int
    mqtt_client_id: str
    sub_topic_rpi: str
    pub_topic_jetson: str

    # Redis Settings
    redis_host: str
    redis_port: int
    redis_gate_status_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
