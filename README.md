# 🌸 MoonBloom

> Plataforma de seguimiento del ciclo menstrual y bienestar. Registra tu ciclo, anota cómo te sientes cada día y descubre patrones en tu cuerpo.

Proyecto académico desarrollado para la materia **Tecnologías de Desarrollo en el Servidor (Primavera 2026)** en el ITESO (Instituto Tecnológico y de Estudios Superiores de Occidente).

---

## 📑 Tabla de contenidos

- [Acerca del proyecto](#-acerca-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológico](#️-stack-tecnológico)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación paso a paso](#-instalación-paso-a-paso)
- [Configuración del archivo .env](#-configuración-del-archivo-env)
- [Cómo correr el proyecto](#-cómo-correr-el-proyecto)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Endpoints API REST](#-endpoints-api-rest)
- [Rutas UI (Handlebars)](#-rutas-ui-handlebars)
- [Eventos de Socket.io](#-eventos-de-socketio)
- [Cómo probar cada feature](#-cómo-probar-cada-feature)
- [Solución de problemas comunes](#-solución-de-problemas-comunes)
- [Equipo](#-equipo)

---

## 📖 Acerca del proyecto

**MoonBloom** es una aplicación web donde las usuarias pueden:

- 📅 Registrar el inicio y fin de sus ciclos menstruales
- 📝 Anotar diariamente su estado de ánimo, síntomas, flujo y notas personales
- 🔔 Recibir recordatorios por correo si olvidan registrar el día
- 🌙 Visualizar su historial en un calendario
- 🔄 Sincronizar sus datos entre dispositivos en tiempo real (Socket.io)

---

## ✨ Funcionalidades

### Autenticación y permisos
- Registro y login con email/password
- **Sign-in con Google** (OAuth 2.0)
- Hash seguro de contraseñas con bcrypt (10 salt rounds)
- JWT en cookies httpOnly (web) + Authorization Bearer (API)
- Middleware de ownership: cada usuaria solo accede a sus propios recursos

### Gestión del ciclo
- CRUD completo de ciclos menstruales
- CRUD completo de registros diarios
- Dashboard con resumen del ciclo actual
- Calendario con historial visual
- Validaciones automáticas en los modelos

### Correos electrónicos
- Correo de bienvenida al registrarse (cualquier método)
- Recordatorio diario por email (cron a las 20:00)
- Plantillas HTML con la identidad visual de MoonBloom
- Modo desarrollo: si no hay SMTP configurado, los correos se imprimen en consola

### Tiempo real
- Sincronización multi-dispositivo con Socket.io
- Toasts elegantes para notificaciones en vivo
- Rooms privados por usuaria
- Reconexión automática si se pierde la conexión

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Lenguaje | TypeScript | 5.8.x |
| Runtime | Node.js | 20+ |
| Servidor HTTP | Express | 5.x |
| Base de datos | MongoDB (via Mongoose) | 9.x |
| Motor de plantillas | express-handlebars | 8.x |
| Autenticación | JWT + bcrypt | 9.x / 5.x |
| OAuth | Passport + passport-google-oauth20 | 0.7.x / 2.x |
| Correos | Nodemailer + Handlebars | 6.9.x |
| Tiempo real | Socket.io | 4.8.x |
| Cron jobs | node-cron | 3.x |
| Frontend | Bootstrap 5 + Bootstrap Icons | CDN |

---

## 📦 Prerrequisitos

Antes de instalar el proyecto necesitas tener en tu máquina:

### 1. Node.js 20 o superior

Verifica con:

```bash
node -v
# debe mostrar v20.x.x o superior
```

Si no lo tienes, descárgalo de [nodejs.org](https://nodejs.org/) o instálalo con:

```bash
# macOS (Homebrew)
brew install node

# Windows (con Chocolatey)
choco install nodejs

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

### 2. MongoDB

Tienes dos opciones:

**Opción A — MongoDB local (recomendada para desarrollo):**

```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows: descarga el instalador desde mongodb.com/try/download/community

# Linux (Ubuntu)
sudo apt install mongodb
sudo systemctl start mongod
```

Verifica que está corriendo:

```bash
# debe responder al puerto 27017
mongosh
```

**Opción B — MongoDB Atlas (nube):**

Crea cuenta gratis en [cloud.mongodb.com](https://cloud.mongodb.com), crea un cluster M0 (free tier), agrega tu IP a Network Access y obtén el connection string.

### 3. Git

```bash
git --version
# si no lo tienes:
# macOS: brew install git
# Windows: descarga desde git-scm.com
# Linux: sudo apt install git
```

### 4. (Opcional) MongoDB Compass

[Compass](https://www.mongodb.com/products/compass) es un GUI para inspeccionar la BD. Útil pero no obligatorio.

---

## 🚀 Instalación paso a paso

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/LuisCacho-py/Moonbloom_2.git
cd Moonbloom_2
git checkout bugfix/sprint3-fixes
```

### Paso 2 — Entrar a la carpeta backend e instalar dependencias

```bash
cd backend
npm install
```

Esto instala TODAS las dependencias listadas en `package.json` automáticamente. Si por alguna razón faltara alguna, aquí está el comando completo de respaldo:

```bash
# Dependencias de producción
npm install express mongoose dotenv cors express-handlebars \
  bcrypt jsonwebtoken cookie-parser \
  passport passport-google-oauth20 \
  nodemailer node-cron socket.io

# Dependencias de desarrollo (tipos de TypeScript + herramientas)
npm install -D typescript ts-node nodemon \
  @types/node @types/express @types/cors \
  @types/bcrypt @types/jsonwebtoken @types/cookie-parser \
  @types/passport @types/passport-google-oauth20 \
  @types/nodemailer @types/node-cron
```

### Paso 3 — Crear el archivo `.env`

Crea un archivo llamado `.env` dentro de la carpeta `backend/` con el siguiente contenido (ver siguiente sección para el detalle de cada variable):

```env
# Servidor
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Base de datos local
MONGO_URI=mongodb://localhost:27017/moonbloom

# JWT — generar uno único con: openssl rand -hex 32
JWT_SECRET=cambia_esto_por_un_string_aleatorio_largo_de_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# Google OAuth (opcional — déjalo vacío si no vas a usar Google login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# SMTP (opcional — déjalo vacío y los correos saldrán por consola)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=MoonBloom <noreply@moonbloom.tech>

# Cron del recordatorio diario
REMINDER_CRON=0 20 * * *
DISABLE_JOBS=false
```

> ⚠️ **IMPORTANTE:** el `.env` debe estar en `.gitignore` (no se sube al repo). Si vas a desplegar, configura las variables en tu plataforma (Render, Railway, etc.).

### Paso 4 — Verificar que MongoDB esté corriendo

```bash
# macOS / Linux
brew services list | grep mongodb     # debe estar "started"
# o
sudo systemctl status mongod          # debe estar "active (running)"

# O simplemente abre MongoDB Compass y conéctate a mongodb://localhost:27017
```

---

## 🔐 Configuración del archivo .env

Detalle de cada variable:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `PORT` | ⚪ Opcional | Puerto donde corre el server (default: 3000) |
| `NODE_ENV` | ⚪ Opcional | `development` o `production` |
| `APP_URL` | ⚪ Opcional | URL base de la app (para links en correos) |
| `CORS_ORIGIN` | ⚪ Opcional | Origen permitido por CORS |
| `MONGO_URI` | ✅ **Sí** | Connection string de MongoDB |
| `JWT_SECRET` | ✅ **Sí** | Llave para firmar tokens JWT — debe ser largo y único |
| `JWT_EXPIRES_IN` | ⚪ Opcional | Duración del token (default: 7d) |
| `GOOGLE_CLIENT_ID` | ⚪ Opcional | Cliente de Google OAuth — vacío desactiva el botón |
| `GOOGLE_CLIENT_SECRET` | ⚪ Opcional | Secret de Google OAuth |
| `GOOGLE_CALLBACK_URL` | ⚪ Opcional | URL de callback (default: `/api/auth/google/callback`) |
| `SMTP_HOST` | ⚪ Opcional | Host SMTP — vacío imprime correos en consola |
| `SMTP_PORT` | ⚪ Opcional | Puerto SMTP (587 para TLS, 465 para SSL) |
| `SMTP_USER` | ⚪ Opcional | Usuario SMTP |
| `SMTP_PASS` | ⚪ Opcional | Contraseña SMTP (o app password) |
| `EMAIL_FROM` | ⚪ Opcional | Remitente que aparece en los correos |
| `REMINDER_CRON` | ⚪ Opcional | Patrón cron del recordatorio (default: 20:00 diario) |
| `DISABLE_JOBS` | ⚪ Opcional | `true` desactiva todos los cron jobs |

### Cómo generar un JWT_SECRET seguro

```bash
# macOS / Linux
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | %{ Get-Random -Maximum 256 }))

# O simplemente usa cualquier string largo aleatorio
```

### Cómo obtener credenciales de Google OAuth (opcional)

1. Entra a [Google Cloud Console — Credentials](https://console.cloud.google.com/apis/credentials)
2. Crea un nuevo proyecto (o selecciona uno existente)
3. Click en **Create Credentials → OAuth client ID**
4. Tipo: **Web application**
5. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copia el `Client ID` y `Client Secret` a tu `.env`

### Cómo configurar SMTP con Mailtrap (recomendado para demos)

1. Regístrate gratis en [mailtrap.io](https://mailtrap.io)
2. Ve a **Email Testing → My Inbox**
3. Click en **Show Credentials** o pestaña **SMTP Settings**
4. Selecciona **Nodemailer** en el dropdown de integrations
5. Copia los valores a tu `.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu_user_de_mailtrap
SMTP_PASS=tu_pass_de_mailtrap
```

### Cómo configurar SMTP con Gmail (correos reales)

1. Activa la **autenticación de 2 pasos** en tu cuenta Gmail
2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Genera una **App Password** (16 caracteres)
4. Configura `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=los_16_caracteres_de_la_app_password
```

---

## ▶️ Cómo correr el proyecto

Desde la carpeta `backend/`:

```bash
npm start
```

Si todo está bien configurado, deberías ver:

```
[passport] Google OAuth activo
[email] SMTP no configurado — los correos se mostrarán en consola
[socket] Socket.io inicializado
🌸 MoonBloom corriendo en http://localhost:3000
[jobs] Recordatorio diario programado: '0 20 * * *'
```

Abre tu navegador en **http://localhost:3000** y verás la pantalla de login.

### Scripts disponibles

```bash
npm start        # Arranca el servidor con ts-node
npm run dev      # Arranca con nodemon (recarga automática al editar)
```

---

## 📁 Estructura del proyecto

```
Moonbloom_2/
└── backend/
    ├── .env                          ← variables de entorno (no se sube)
    ├── package.json
    ├── tsconfig.json
    ├── nodemon.json
    └── src/
        ├── app.ts                    ← punto de entrada
        │
        ├── config/
        │   ├── db.ts                 ← conexión a MongoDB
        │   └── passport.ts           ← estrategia Google OAuth
        │
        ├── middleware/
        │   ├── auth.middleware.ts    ← requireAuth, requireAuthUI, requireOwnership
        │   └── error.middleware.ts   ← manejo global de errores
        │
        ├── models/
        │   ├── user.model.ts         ← User + bcrypt + comparePassword
        │   ├── cycle.model.ts        ← Cycle
        │   └── dailyLog.model.ts     ← DailyLog
        │
        ├── controllers/
        │   ├── auth.controller.ts    ← register, login, logout, googleCallback
        │   ├── user.controller.ts
        │   ├── cycle.controller.ts   ← filtra por usuario + emite sockets
        │   └── dailyLog.controller.ts
        │
        ├── routes/
        │   ├── auth.routes.ts        ← /api/auth/* + /login + /registro
        │   ├── user.routes.ts        ← /api/users/*
        │   ├── cycle.routes.ts       ← /api/cycles/*
        │   ├── dailyLog.routes.ts    ← /api/dailylogs/*
        │   └── ui.routes.ts          ← /dashboard, /calendario, /ciclos, /registros
        │
        ├── services/
        │   ├── email.service.ts      ← Nodemailer + templates
        │   └── notification.service.ts ← despachador (correo + socket)
        │
        ├── sockets/
        │   └── index.ts              ← setup Socket.io + auth + rooms
        │
        ├── jobs/
        │   ├── index.ts              ← registry de jobs
        │   └── reminder.job.ts       ← cron diario 20:00
        │
        ├── templates/
        │   └── email/
        │       ├── welcome.hbs
        │       ├── daily-reminder.hbs
        │       └── cycle-prediction.hbs
        │
        ├── public/
        │   └── css/
        │       └── style.css         ← estilos del frontend
        │
        └── views/
            ├── layouts/
            │   └── main.handlebars   ← layout principal (incluye socket-client)
            ├── partials/
            │   └── socket-client.handlebars
            ├── auth/
            │   ├── login.handlebars
            │   └── register.handlebars
            ├── cycles/
            │   ├── create.handlebars
            │   ├── edit.handlebars
            │   └── index.handlebars
            ├── logs/
            │   └── create.handlebars
            ├── users/
            ├── dashboard.handlebars
            ├── calendar.handlebars
            └── home.handlebars
```

---

## 🔌 Endpoints API REST

Todos los endpoints excepto los de autenticación requieren JWT (cookie `token` o header `Authorization: Bearer <token>`).

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registro con email y password | ❌ |
| POST | `/api/auth/login` | Login con email y password | ❌ |
| POST | `/api/auth/logout` | Cerrar sesión | ❌ |
| GET | `/api/auth/me` | Datos de la usuaria autenticada | ✅ |
| GET | `/api/auth/google` | Inicia flujo OAuth de Google | ❌ |
| GET | `/api/auth/google/callback` | Callback tras autorización en Google | ❌ |

### Ciclos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cycles` | Lista ciclos de la usuaria autenticada |
| POST | `/api/cycles` | Crea un nuevo ciclo |
| GET | `/api/cycles/:id` | Obtiene un ciclo (valida ownership) |
| PUT | `/api/cycles/:id` | Actualiza un ciclo (valida ownership) |
| DELETE | `/api/cycles/:id` | Elimina un ciclo (valida ownership) |

### Registros diarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dailylogs` | Lista registros de la usuaria autenticada |
| POST | `/api/dailylogs` | Crea un nuevo registro |
| GET | `/api/dailylogs/:id` | Obtiene un registro (valida ownership) |
| PUT | `/api/dailylogs/:id` | Actualiza un registro (valida ownership) |
| DELETE | `/api/dailylogs/:id` | Elimina un registro (valida ownership) |

---

## 🌐 Rutas UI (Handlebars)

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | Redirige a `/dashboard` o `/login` | ❌ |
| `/login` | Formulario de login + botón Google | ❌ |
| `/registro` | Formulario de registro + botón Google | ❌ |
| `/logout` | Cierra sesión y redirige a login | ❌ |
| `/dashboard` | Resumen del ciclo actual | ✅ |
| `/calendario` | Vista calendario con historial | ✅ |
| `/ciclos/nuevo` | Formulario nuevo ciclo | ✅ |
| `/ciclos/:id/editar` | Formulario editar ciclo | ✅ |
| `/registros/nuevo` | Formulario nuevo registro diario | ✅ |

---

## 📡 Eventos de Socket.io

| Evento | Dirección | Disparador |
|--------|-----------|------------|
| `connected` | Server → Cliente | Al establecer conexión exitosa |
| `log:created` | Server → Cliente | Cuando la usuaria crea un DailyLog |
| `cycle:created` | Server → Cliente | Cuando la usuaria crea un Cycle |
| `cycle:updated` | Server → Cliente | Cuando la usuaria actualiza un Cycle |
| `reminder:daily` | Server → Cliente | Cron de recordatorio diario (20:00) |
| `tip:wellness` | Server → Cliente | Predicción / consejo de bienestar |

El cliente se conecta automáticamente al cargar cualquier página privada gracias al partial `socket-client.handlebars` incluido en `main.handlebars`.

---

## 🧪 Cómo probar cada feature

### 1. Registro con email/password

Abre http://localhost:3000/registro, llena el formulario y registra una cuenta. Deberías:
- Ser redirigida automáticamente al dashboard
- Ver en la consola del server el correo de bienvenida (si SMTP no está configurado)
- O recibirlo en tu inbox (si SMTP sí está configurado)

### 2. Registro/Login con Google

Click en **"Continuar con Google"** en la pantalla de login. Te redirige a Google, autorizas y regresas al dashboard.

### 3. Protección de rutas

Cierra sesión (`/logout`) y trata de ir a `/dashboard` → debes ser redirigida a `/login`.

### 4. CRUD vía API REST

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Login (te devuelve un JWT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Listar ciclos (reemplaza TOKEN)
curl http://localhost:3000/api/cycles \
  -H "Authorization: Bearer TOKEN"

# Crear ciclo
curl -X POST http://localhost:3000/api/cycles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-05-01","durationDays":5,"notes":"Ciclo regular"}'
```

### 5. Permisos (ownership)

Crea dos cuentas (A y B). Loguéate con A, crea un ciclo, copia su `_id`. Loguéate con B, intenta hacer `GET /api/cycles/:id` con el id del ciclo de A → debe devolver **403 Forbidden**.

### 6. Sincronización en tiempo real (sockets)

Abre el dashboard en **dos pestañas** con la misma cuenta. Crea un ciclo o registro desde una pestaña. En la otra pestaña debe aparecer un toast y la página recargarse sola.

### 7. Cron de recordatorio diario

Para probar sin esperar las 20:00, cambia temporalmente en `.env`:

```env
REMINDER_CRON=*/2 * * * *
```

Reinicia el server. Cada 2 minutos verás en la consola:

```
[jobs] Ejecutando recordatorio diario...
[jobs] X usuarias sin registro hoy
```

Si tienes una pestaña abierta, también aparecerá el toast en vivo.

> ⚠️ **Acuérdate** de regresar `REMINDER_CRON=0 20 * * *` antes de hacer commit final.

---

## 🩺 Solución de problemas comunes

### Error: `Cannot find module 'X'`

Falta instalar alguna dependencia. Corre:

```bash
npm install
```

### Error: `JWT_SECRET no está configurado`

No creaste el `.env`, está vacío, o no tiene la variable. Verifica:

```bash
cat .env | grep JWT_SECRET
```

Debe imprimir una línea con un valor (no vacío).

### Error: `querySrv ENOTFOUND` o `connect ECONNREFUSED` en MongoDB

**Si usas MongoDB local:**
```bash
# Verifica que esté corriendo
brew services list | grep mongodb    # macOS
sudo systemctl status mongod         # Linux
```

**Si usas MongoDB Atlas:**
- Verifica que la `MONGO_URI` esté completa (incluya usuario, password, cluster y nombre de BD)
- Ve a Atlas → Network Access → agrega tu IP actual (o `0.0.0.0/0` para desarrollo)

### Error: `error TS2349: 'SaveOptions' has no call signatures`

Es un conflicto entre los tipos de Mongoose v9 y bcrypt en el pre-save hook. Ya está corregido en la rama `bugfix/sprint3-fixes` usando `// @ts-ignore` en el pre hook. Si lo ves, asegúrate de estar en la rama correcta:

```bash
git checkout bugfix/sprint3-fixes
```

### El toast de socket no aparece

Verifica que el partial esté incluido en el layout. Abre `src/views/layouts/main.handlebars` y confirma que antes de `</body>` tenga:

```handlebars
{{> socket-client}}
```

### Los correos no llegan a mi inbox real

- Si `SMTP_*` están vacíos en `.env`, los correos se imprimen en consola (no se envían). Es intencional para desarrollo.
- Si configuraste SMTP, revisa la consola del server por mensajes de error de Nodemailer.
- Con Gmail asegúrate de usar una **App Password**, no tu contraseña normal.

### Google OAuth no funciona

- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` no estén vacíos
- Confirma que `GOOGLE_CALLBACK_URL` coincida exactamente con el "Authorized redirect URI" configurado en Google Cloud Console
- Si lo cambias, espera 1-2 minutos a que se propague

### El puerto 3000 ya está ocupado

Cambia el puerto en `.env`:

```env
PORT=3001
```

O encuentra y mata el proceso que lo ocupa:

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "El correo de bienvenida no llega cuando entro con Google"

Conocido — no se envía intencionalmente solo en el flujo de Google. Si quieres habilitarlo, edita `src/config/passport.ts` y agrega la llamada a `sendWelcomeEmail()` después de crear el usuario nuevo.

---

## 👥 Equipo

| Integrante | Área principal |
|------------|----------------|
| Jorge Eduardo Moreno Gutiérrez | Autenticación JWT + Google OAuth + middlewares |
| Luis Gerardo Cacho Nafarrate | Sockets + service layer + refactor de controllers |
| Katherine Alessandra Pérez | Correos electrónicos + cron jobs + templates |

**Profesor:** Ing. Francisco Javier Sevilla Medina
**Materia:** Tecnologías de Desarrollo en el Servidor
**Periodo:** Primavera 2026
**Institución:** ITESO

---

## 📚 Historial de Sprints

| Sprint | Tema principal | Estado |
|--------|----------------|--------|
| **Sprint 1** | Estructura base, modelos y conexión a BD | ✅ Completado |
| **Sprint 2** | CRUDs completos, validaciones, manejo de errores | ✅ Completado |
| **Sprint 3** | Autenticación JWT/OAuth, correos, sockets, arquitectura | ✅ Completado |
| **Sprint 4** | Predicción de ciclos, dashboard analítico, testing, despliegue | 📋 Planeado |

---

## 📄 Licencia

Este proyecto es de uso académico para la materia de Tecnologías de Desarrollo en el Servidor (ITESO, Primavera 2026).

---

<p align="center">
  🌸 <strong>MoonBloom</strong> — Tu ciclo, tu bienestar 🌸
</p>
