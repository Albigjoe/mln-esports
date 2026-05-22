FROM node:20-alpine

WORKDIR /app

# 1. Install dependencies inside /app/server (includes dev dependencies like tsx)
COPY server/package*.json ./server/
RUN cd server && npm install

# 2. Copy prisma schema and server source code
COPY prisma ./server/prisma
COPY server ./server

# Set a dummy DATABASE_URL environment variable so Prisma schema parser 
# doesn't crash during the build phase. (Render overrides this at runtime).
ENV DATABASE_URL="postgresql://mockuser:mockpassword@localhost:5432/mockdb"

# 3. Generate prisma client inside server node_modules
RUN cd server && npx prisma generate --schema=prisma/schema.prisma

# Expose backend port
EXPOSE 3001

# Start the server from the server directory
WORKDIR /app/server
CMD ["npx", "tsx", "server.ts"]
