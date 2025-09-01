from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str

    # JWT Settings
    JWT_SECRET: str

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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()