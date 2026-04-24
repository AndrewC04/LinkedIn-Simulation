FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY services/analytics-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY shared /app/shared
COPY services/analytics-service /app/services/analytics-service

WORKDIR /app/services/analytics-service

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
