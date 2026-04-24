FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY services/profile_service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY shared /app/shared
COPY services/profile_service /app/services/profile_service

CMD ["uvicorn", "services.profile_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
