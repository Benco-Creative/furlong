# AIO image that builds from YOUR monorepo (pnpm workspaces + Django in apps/api)

ARG NODE_VERSION=22
ARG PYTHON_IMAGE=python:3.12.10-alpine

# ========== STAGE: build web apps (Next.js) ==========
FROM node:22-alpine AS build-web
WORKDIR /repo

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace manifests first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy only package manifests from packages/ and apps/ to warm the install cache
COPY packages/ui/package.json                 packages/ui/
COPY packages/types/package.json              packages/types/
COPY packages/tailwind-config/package.json    packages/tailwind-config/
COPY packages/logger/package.json             packages/logger/
COPY packages/decorators/package.json         packages/decorators/
COPY packages/constants/package.json          packages/constants/
COPY packages/shared-state/package.json       packages/shared-state/
COPY packages/utils/package.json              packages/utils/
COPY packages/eslint-config/package.json      packages/eslint-config/
COPY packages/hooks/package.json              packages/hooks/
COPY packages/propel/package.json             packages/propel/
COPY packages/typescript-config/package.json  packages/typescript-config/
COPY packages/i18n/package.json               packages/i18n/
COPY packages/services/package.json           packages/services/
COPY packages/editor/package.json             packages/editor/

COPY apps/web/package.json    apps/web/
COPY apps/admin/package.json  apps/admin/
COPY apps/live/package.json   apps/live/
COPY apps/space/package.json  apps/space/

# Install workspace deps
RUN pnpm install --frozen-lockfile

# Now bring in the full sources and build each app
COPY packages ./packages
COPY apps ./apps

# Build all packages and apps using Turbo (handles dependencies automatically)
RUN pnpm build

# After this, each app will have its .next build output within apps/<name>.

# ========== STAGE: build backend (Django in apps/api) ==========
FROM python:3.12.10-alpine AS build-backend
WORKDIR /repo

# Build deps for common Python packages (psycopg, lxml, etc.)
RUN apk add --no-cache gcc musl-dev python3-dev libffi-dev cargo postgresql-dev

# Copy only dependency files first (if present)
COPY apps/api/requirements.txt apps/api/
COPY apps/api/requirements/ apps/api/requirements/
COPY apps/api/pyproject.toml apps/api/

# Install backend deps (support both requirements or poetry)
# Prefer requirements*.txt if present; else try poetry; else skip
RUN if [ -f apps/api/requirements.txt ]; then \
      pip install --no-cache-dir -r apps/api/requirements.txt ; \
    elif [ -f apps/api/requirements/production.txt ]; then \
      pip install --no-cache-dir -r apps/api/requirements/production.txt ; \
    elif [ -f apps/api/requirements/base.txt ]; then \
      pip install --no-cache-dir -r apps/api/requirements/base.txt ; \
    elif [ -f apps/api/pyproject.toml ]; then \
      pip install --no-cache-dir poetry && \
      cd apps/api && poetry config virtualenvs.create false && poetry install --only main --no-interaction --no-ansi ; \
    else \
      echo "No requirements/poetry files detected; assuming vendored deps or will install on runner"; \
    fi

# Copy full backend source
COPY apps/api ./apps/api

# (Optional) collectstatic can be done at runtime; skipping here to avoid needing DB
# ENV DJANGO_SETTINGS_MODULE=apps.api.settings
# RUN python apps/api/manage.py collectstatic --noinput || true

# ========== STAGE: runner (includes Node for next start + Python for Django) ==========
FROM python:3.12.10-alpine AS runner
WORKDIR /app

# OS libs similar to upstream AIO
RUN apk add --no-cache libpq libxslt xmlsec nss-tools bash curl uuidgen ncdu vim

# Bring in Node runtime for Next.js "next start" if needed
COPY --from=node:22-alpine /usr/local /usr/local

# Copy built web apps from build-web
COPY --from=build-web /repo/apps/web   /app/web
COPY --from=build-web /repo/apps/admin /app/admin
COPY --from=build-web /repo/apps/live  /app/live
COPY --from=build-web /repo/apps/space /app/space

# Copy backend deps and code from build-backend
COPY --from=build-backend /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=build-backend /usr/local/bin/ /usr/local/bin/
COPY --from=build-backend /repo/apps/api /app/backend

# Install Caddy directly instead of copying from external image
RUN apk add --no-cache caddy

# AIO control files from your repo (these exist in the community AIO folder)
# They define supervisor programs to run api + next apps + caddy
COPY apps/proxy/Caddyfile.ce         /app/proxy/Caddyfile
COPY deployments/aio/community/start.sh               /app/start.sh
COPY deployments/aio/community/supervisor.conf        /etc/supervisor/conf.d/supervisor.conf
COPY deployments/aio/community/variables.env         /app/plane.env

RUN mkdir -p /app/logs/access /app/logs/error /app/data \
 && chmod +x /app/start.sh

VOLUME ["/app/data", "/app/logs"]
EXPOSE 80 443
CMD ["/app/start.sh"]