# =========================================================================
# Stage 1: Build Frontend (Vite) & Backend (TypeScript)
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including devDependencies for building)
RUN npm install && npm --prefix client install

# Copy all source files
COPY . .

# Build Vite frontend and TypeScript backend
RUN npm run build

# =========================================================================
# Stage 2: Production Lightweight Runtime Image
# =========================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root package.json and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled backend and frontend assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Expose unified service port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
