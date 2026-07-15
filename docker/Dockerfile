FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
ARG REQUIREMENTS_FILE=development.txt
RUN pip install --no-cache-dir -r requirements/${REQUIREMENTS_FILE}

COPY . .
RUN chmod +x scripts/*.sh

EXPOSE 8000
ENTRYPOINT [ "scripts/start.sh" ]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
