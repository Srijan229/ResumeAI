FROM node:22-bookworm-slim
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV LATEX_COMPILER=local
ENV DATABASE_URL=postgresql://user:password@localhost:5432/applypilot?schema=public

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    latexmk \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm run start"]
