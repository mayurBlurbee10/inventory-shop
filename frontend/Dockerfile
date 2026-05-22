# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* .npmrc* ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.yarn \
    --mount=type=cache,target=/root/.npm \
    if [ -f yarn.lock ]; then \
      yarn --frozen-lockfile --network-timeout 100000; \
    elif [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      echo "Lockfile not found." && \
      yarn install --network-timeout 100000 || npm install --legacy-peer-deps; \
    fi

# ============================================
# Stage 2: Builder
# ============================================
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package.json first (needed for build scripts)
COPY --from=deps /app/package.json ./package.json

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build arguments
ARG BOX_CLIENT_ID
ARG BOX_CLIENT_SECRET
ARG BOX_ENTERPRISE_ID
ARG BOX_PRIVATE_KEY
ARG BOX_PRIVATE_KEY_PASSWORD
ARG BOX_PUBLIC_KEY_ID
ARG BOX_PASSPHRASE
ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_JWT_SECRET_KEY
ARG AZURE_COMMUNICATION_CONNECTION_STRING
ARG AZURE_COMMUNICATION_SENDER_EMAIL
ARG NEXT_PUBLIC_OKTA_CLIENT_ID
ARG NEXT_PUBLIC_OKTA_ISSUER
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG AZURE_STORAGE_CONNECTION_STRING
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY
ARG ZENDESK_API_TOKEN
ARG ZENDESK_ADMIN_EMAIL
ARG ZENDESK_SUBDOMAIN_URL

ENV BOX_CLIENT_ID=$BOX_CLIENT_ID
ENV BOX_CLIENT_SECRET=$BOX_CLIENT_SECRET
ENV BOX_ENTERPRISE_ID=$BOX_ENTERPRISE_ID
ENV BOX_PRIVATE_KEY=$BOX_PRIVATE_KEY
ENV BOX_PRIVATE_KEY_PASSWORD=$BOX_PRIVATE_KEY_PASSWORD
ENV BOX_PUBLIC_KEY_ID=$BOX_PUBLIC_KEY_ID
ENV BOX_PASSPHRASE=$BOX_PASSPHRASE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_JWT_SECRET_KEY=$NEXT_PUBLIC_JWT_SECRET_KEY
ENV AZURE_COMMUNICATION_CONNECTION_STRING=$AZURE_COMMUNICATION_CONNECTION_STRING
ENV AZURE_COMMUNICATION_SENDER_EMAIL=$AZURE_COMMUNICATION_SENDER_EMAIL
ENV NEXT_PUBLIC_OKTA_CLIENT_ID=$NEXT_PUBLIC_OKTA_CLIENT_ID
ENV NEXT_PUBLIC_OKTA_ISSUER=$NEXT_PUBLIC_OKTA_ISSUER
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CRYPTO_SECRET_KEY=$NEXT_PUBLIC_CRYPTO_SECRET_KEY
ENV ZENDESK_API_TOKEN=$ZENDESK_API_TOKEN
ENV ZENDESK_ADMIN_EMAIL=$ZENDESK_ADMIN_EMAIL
ENV ZENDESK_SUBDOMAIN_URL=$ZENDESK_SUBDOMAIN_UR

# Build with cache mount for Next.js cache
# Check for lockfile and use appropriate package manager
RUN --mount=type=cache,target=/app/.next/cache \
    if [ -f yarn.lock ]; then \
      echo "Found yarn.lock, building with yarn..." && \
      yarn build || exit 1; \
    elif [ -f package-lock.json ]; then \
      echo "Found package-lock.json, building with npm..." && \
      npm run build || exit 1; \
    else \
      echo "No lockfile found. Attempting yarn build (fallback)..." && \
      (yarn build || (echo "Yarn build failed, trying npm..." && npm run build)) || exit 1; \
    fi

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output structure:
# - .next/standalone/ contains server.js and minimal node_modules
# - .next/static/ contains static assets
# - public/ needs to be copied separately
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set environment variables (runtime)
ARG BOX_CLIENT_ID
ARG BOX_CLIENT_SECRET
ARG BOX_ENTERPRISE_ID
ARG BOX_PRIVATE_KEY
ARG BOX_PRIVATE_KEY_PASSWORD
ARG BOX_PUBLIC_KEY_ID
ARG BOX_PASSPHRASE
ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_JWT_SECRET_KEY
ARG AZURE_COMMUNICATION_CONNECTION_STRING
ARG AZURE_COMMUNICATION_SENDER_EMAIL
ARG NEXT_PUBLIC_OKTA_CLIENT_ID
ARG NEXT_PUBLIC_OKTA_ISSUER
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG AZURE_STORAGE_CONNECTION_STRING
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY
ARG ZENDESK_API_TOKEN
ARG ZENDESK_ADMIN_EMAIL
ARG ZENDESK_SUBDOMAIN_URL

ENV BOX_CLIENT_ID=$BOX_CLIENT_ID
ENV BOX_CLIENT_SECRET=$BOX_CLIENT_SECRET
ENV BOX_ENTERPRISE_ID=$BOX_ENTERPRISE_ID
ENV BOX_PRIVATE_KEY=$BOX_PRIVATE_KEY
ENV BOX_PRIVATE_KEY_PASSWORD=$BOX_PRIVATE_KEY_PASSWORD
ENV BOX_PUBLIC_KEY_ID=$BOX_PUBLIC_KEY_ID
ENV BOX_PASSPHRASE=$BOX_PASSPHRASE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_JWT_SECRET_KEY=$NEXT_PUBLIC_JWT_SECRET_KEY
ENV AZURE_COMMUNICATION_CONNECTION_STRING=$AZURE_COMMUNICATION_CONNECTION_STRING
ENV AZURE_COMMUNICATION_SENDER_EMAIL=$AZURE_COMMUNICATION_SENDER_EMAIL
ENV NEXT_PUBLIC_OKTA_CLIENT_ID=$NEXT_PUBLIC_OKTA_CLIENT_ID
ENV NEXT_PUBLIC_OKTA_ISSUER=$NEXT_PUBLIC_OKTA_ISSUER
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CRYPTO_SECRET_KEY=$NEXT_PUBLIC_CRYPTO_SECRET_KEY
ENV ZENDESK_API_TOKEN=$ZENDESK_API_TOKEN
ENV ZENDESK_ADMIN_EMAIL=$ZENDESK_ADMIN_EMAIL
ENV ZENDESK_SUBDOMAIN_URL=$ZENDESK_SUBDOMAIN_UR

USER nextjs

EXPOSE 3008

ENV PORT=3008
ENV HOSTNAME="0.0.0.0"

# With standalone output, use node server.js directly (faster startup)
# The standalone output includes server.js in the root
CMD ["node", "server.js"]