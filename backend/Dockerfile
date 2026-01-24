FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    build-essential \
    util-linux \
    gosu \
    gcc \
    curl \
    postgresql-client \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m django-user
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY --chown=django-user:django-user . .
COPY --chown=django-user:django-user entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]