from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_EMAIL: str = "admin@salon.rs"
    ADMIN_PASSWORD: str = "Admin123!"
    UPLOAD_DIR: str = "uploads"
    FROM_NAME: str = "Frizerski Salon"
    FROM_EMAIL: str = "miselinko95@gmail.com"
    GMAIL_USER: str = "miselinko95@gmail.com"
    GMAIL_APP_PASSWORD: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
