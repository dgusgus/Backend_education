FROM node:20-slim

# Instalar dependencias del sistema para Prisma + sudo
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /workspace

# Instalar pnpm globalmente (más rápido que npm)
RUN npm install -g pnpm

# Modificar usuario node existente y agregar sudo
RUN usermod -s /bin/bash node \
  && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Cambiar propietario del workspace
RUN chown -R node:node /workspace

USER node

# Exponer puerto para desarrollo
EXPOSE 3000

# Comando por defecto (se sobrescribe en docker-compose)
CMD ["sleep", "infinity"]