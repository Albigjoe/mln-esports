FROM node:20-alpine

WORKDIR /app

# 1. Install dependencies inside /app/server (include devDeps like tsx)
COPY server/package*.json ./server/
RUN cd server && npm install

# 2. Copy prisma schema from repository root and generate client
COPY prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma

# 3. Copy server source code
COPY server ./server

# Expose backend port
EXPOSE 3001

# Start the server from the server directory
WORKDIR /app/server
CMD ["npx", "tsx", "server.ts"]
