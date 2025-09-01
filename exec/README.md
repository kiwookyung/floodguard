# exec
## 기술 스택 및 버전
- React 19.1.0
- Zustand
- CSS
- JS (ES6+)

- FastAPI(Python 3.12)
- Redis 8.2
- PostgreSQL 15

- Traefik 3.5
- Docker 28.3.3

## 환경 변수
- backend
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname

# python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=

# MQTT Configuration
MQTT_BROKER=
MQTT_PORT=1883
MQTT_CLIENT_ID=
SUB_TOPIC_RPI=
PUB_TOPIC_JETSON=

# Redis Configuration
REDIS_HOST=
REDIS_PORT=6379
REDIS_GATE_STATUS_KEY=
```

- Docker Compose
```
DATABASE_URL: postgresql+asyncpg://username:pw@databaseUrl:5432/databasename
POSTGRES_USER:
POSTGRES_PASSWORD: 
POSTGRES_DB:
```

## 배포 시
- docker-compose.yml 파일을 git 폴더 외부로 이동

`sudo docker compose up -d --build`

- *실제 서비스 시 백엔드 main.py 내 swagger 끄기*
- url/api/docs/ 접근 후 사용자 계정 생성
