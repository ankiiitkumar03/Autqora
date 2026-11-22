FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CLIPS_DIR=/app/clips

RUN apk add --no-cache ffmpeg \
    && addgroup -S app \
    && adduser -S -G app app \
    && mkdir -p /app/clips \
    && chown -R app:app /app

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=app:app app.py ./app.py

USER app

EXPOSE 8090
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8090"]
