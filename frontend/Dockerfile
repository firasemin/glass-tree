FROM node:25-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY ./nextjs/package.json ./nextjs/yarn.lock ./
COPY ./nextjs/.yarnrc.yml ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the remainder of the app source
COPY ./nextjs .

# Build the Next.js app (produces standalone output)
RUN yarn run build

FROM node:25-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy the minimal standalone server output along with static assets and public files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose default Next.js port
EXPOSE 3000

# Start the production server
CMD ["node", "server.js"]
