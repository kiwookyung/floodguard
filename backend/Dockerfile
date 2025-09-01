# 1. Use the official Python image
FROM python:3.12-slim

# (옵션) 기본 최적화
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 2. Set the working directory
WORKDIR /app

# 3. Install uv
RUN pip install --no-cache-dir uv

# 4. Copy project
COPY . .

# 5. Install deps
RUN uv sync

# 6. Expose the port the app runs on
EXPOSE 18000

# 7. Entrypoint: 컨테이너 기동 시 마이그레이션 적용 후 앱 실행
CMD sh -c "alembic upgrade head && uv run uvicorn api.main:app --host 0.0.0.0 --port 18000"