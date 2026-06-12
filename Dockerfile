# Estágio de compilação (Build Stage)
FROM node:20-slim AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de desenvolvimento e produção para gerar o build
RUN npm install

# Copiar o restante do código do projeto
COPY . .

# Compilar o frontend do Vue 3 para produção (gera a pasta /app/dist)
RUN npm run build

# ---

# Estágio de execução (Runtime Stage)
FROM node:20-slim

WORKDIR /app

# Instalar bash, git e dependências úteis de sistema que possam ser usadas no terminal do TASS
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar apenas os arquivos necessários para execução
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/public ./public

# Instalar apenas as dependências de produção para o backend (Express, CORS, etc.)
RUN npm install --only=production

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=5176

# Expor a porta de funcionamento do TASS
EXPOSE 5176

# Comando para iniciar o servidor
CMD ["node", "server.js"]
