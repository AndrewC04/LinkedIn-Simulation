FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY services/ai_service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY services/ai_service /app/services/ai_service

WORKDIR /app/services/ai_service

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
