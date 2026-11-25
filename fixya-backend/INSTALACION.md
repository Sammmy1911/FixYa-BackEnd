# FixYa - Guia de instalacion

## 1. Requisitos

Tener instalado:

- Node.js 22.20.0
- Docker Desktop
- Git

Antes de comenzar, abrir Docker Desktop.

## 2. Ejecutar el backend

Abrir una terminal y entrar a la carpeta del backend:

```powershell
cd FixYa-BackEnd/fixya-backend
```

Crear el archivo de configuracion:

```powershell
Copy-Item .env.example .env
```

Abrir el archivo .env y cambiar JWT_SECRET por una clave privada y aleatoria.

Si es la primera instalacion y la base de datos esta vacia, cambiar DB_SYNC=false por DB_SYNC=true.

Ejecutar los siguientes comandos:

```powershell
docker compose up -d
npx --yes npm@11 ci
npm run start:dev
```

El backend estara disponible en:

http://localhost:3000

Despues del primer inicio exitoso, detener el backend con Ctrl+C, cambiar DB_SYNC=false en el archivo .env y volver a ejecutar:

```powershell
npm run start:dev
```

## 3. Ejecutar el frontend

Abrir otra terminal desde la carpeta principal de FixYa:

```powershell
cd FixYa-FrontEnd/mi-app
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Abrir en el navegador:

http://localhost:3001

## 4. Usar FixYa

- Registrar una cuenta como cliente o tecnico.
- Iniciar sesion.
- Crear y consultar solicitudes de servicios.
- Los tecnicos deben estar verificados para atender solicitudes.

## 5. Volver a ejecutar el proyecto

No es necesario instalar las dependencias nuevamente.

Backend:

```powershell
docker compose up -d
npm run start:dev
```

Frontend:

```powershell
npm run dev
```

Mantener ambas terminales abiertas mientras se utiliza FixYa.

## Importante

- No subir los archivos .env o .env.local a GitHub.
- No activar DB_SYNC=true en bases de datos existentes.
- Si se utiliza una base de datos anterior de FG-15, revisar
  sql/001-integracion-sprint-2.sql antes de actualizarla.
