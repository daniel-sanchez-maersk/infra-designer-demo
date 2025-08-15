# Build stage (installs deps, compiles TS, downloads Terraform)
FROM --platform=$BUILDPLATFORM node:22-bullseye-slim AS build
WORKDIR /app

# 1) Install dependencies (no lockfile required)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# 2) Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3) Copy static client files (HTML/CSS) into dist so the server can serve them
#    TypeScript won't copy non-TS assets automatically.
RUN mkdir -p dist/client \
 && cp src/client/index.html dist/client/ \
 && cp src/client/styles.css dist/client/

# 4) (Optional) bring public/ into the build stage for reference
COPY public ./public

# 5) Install Terraform CLI (Linux ARM64)
ARG TF_VERSION=1.12.2
RUN apt-get update && apt-get install -y curl unzip ca-certificates && rm -rf /var/lib/apt/lists/* \
 && curl -sSLo /tmp/terraform.zip https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_arm64.zip \
 && mkdir -p /opt/tf && unzip /tmp/terraform.zip -d /opt/tf

# Runtime stage
FROM --platform=linux/arm64 node:22-bullseye-slim
ENV NODE_ENV=production
WORKDIR /app

# App files
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /opt/tf/terraform /usr/local/bin/terraform

# 6) Install production deps (no lockfile required)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

EXPOSE 3000
CMD ["npm","start"]
