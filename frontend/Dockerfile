# ==== STAGE 1: build del frontend ====
FROM node:20-alpine AS builder

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo lo necesario para instalar deps
COPY package*.json ./

# Instala dependencias (usa npm ci si tienes package-lock.json)
RUN npm ci

# Ahora copiamos el resto del código
COPY . .

# Construimos la app (ajusta si tu script se llama distinto)
RUN npm run build

# ==== STAGE 2: servir estáticos con Nginx ====
FROM nginx:alpine

# Config de nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos ya compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
