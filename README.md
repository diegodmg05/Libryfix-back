# Libryfix-back (Backend)

API REST del proyecto Libryfix: Express + Supabase. Provee endpoints para autenticación, recuperación de contraseña, usuarios, libros y categorías.

## Requisitos

- Node.js (v18 o superior recomendado)
- Cuenta en [Supabase](https://supabase.com) con las tablas necesarias (`Users`, `Books`, `Categories`, `password_reset_otps`, ...)

## Estructura actual del proyecto

```
Libryfix-back/
├── .env
├── .gitignore
├── package.json
├── server.js                # Punto de entrada (arranca la app)
├── STRUCTURE.md
└── src/
    ├── app.js              # Configura Express, middlewares y rutas
    ├── config/
    │   ├── env.js          # Validación de variables de entorno
    │   ├── supabase.js     # Cliente Supabase (singleton)
    │   └── nodemailer.js   # Transporte nodemailer (singleton)
    ├── controllers/        # Adaptadores HTTP (req/res)
    │   ├── authController.js
    │   └── userController.js
    ├── middlewares/
    │   ├── authMiddleware.js
    │   └── errorHandler.js
    ├── models/
    │   ├── User.js
    │   ├── Book.js
    │   └── Category.js
    ├── routes/
    │   ├── index.js
    │   ├── authRoutes.js
    │   └── userRoutes.js
    ├── services/
    │   ├── authService.js
    │   ├── emailService.js
    │   └── userService.js
    └── utils/
        └── validators.js
```

## Qué ha cambiado y por qué

- Separación clara entre arranque (`server.js`) y configuración/express (`src/app.js`) para facilitar testing y despliegue.
- Lógica de negocio movida a `src/services/` y controladores HTTP a `src/controllers/` (mejor testabilidad y separación de responsabilidades).
- `src/config/` contiene singletons para Supabase y Nodemailer.
- Se añadió autenticación JWT con middleware (`authMiddleware`) y manejo global de errores (`errorHandler`).
- Recuperación de contraseña ahora usa HOTP (`otplib`) guardando el secret en la tabla de OTPs.

## Variables de entorno (obligatorias)

Crear un `.env` en la raíz con al menos:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SECRET_KEY_SUPABASE=tu_service_role_key
JWT_SECRET=una_clave_larga_y_segura
SMTP_HOST=smtp.example.com     # opcional para enviar correos
SMTP_PORT=587
SMTP_USER=usuario
SMTP_PASS=pass
FRONTEND_URL=http://localhost:5173
```

`src/config/env.js` validará la presencia de las variables críticas al arrancar.

## Comandos habituales

```bash
npm install
npm start         # arranca server.js
npm run dev       # usar nodemon si lo configuras (instala devDependency)
```

Para desarrollo con reinicio automático recomendamos `nodemon`:

```bash
npm install -D nodemon
npx nodemon server.js
```

## Endpoints de ejemplo

- `GET /` → `API funcionando 🚀`
- `POST /auth/register` → registrar usuario
- `POST /auth/login` → login (devuelve JWT)
- `POST /auth/request-password-reset` → solicita código de recuperación (envía HOTP por email)
- `POST /auth/verify-token` → verifica código
- `POST /auth/reset-password` → resetea contraseña
- `GET /users/getUsers` → lista de usuarios (protegido por JWT)

## Notas técnicas

- HOTP: la implementación actual genera un secret y guarda ese secret en `password_reset_otps.otp`. El token enviado por email se genera con HOTP y se verifica con `otplib`.
- Singletons: `src/config/supabase.js` y `src/config/nodemailer.js` exportan instancias reutilizables para evitar múltiples conexiones.
- Models: `src/models/Book.js` y `src/models/Category.js` mapean las columnas de las tablas `Books` y `Categories` de la base de datos.

## Desarrollo y pruebas

- Importa `src/app.js` en tus tests para usar `supertest` sin arrancar el servidor.
- Añadir `repositories/` para encapsular llamadas a Supabase es recomendable si el proyecto crece.

## Recursos y referencia

- Estructura y motivación: `STRUCTURE.md`
- Buenas prácticas Node.js: https://github.com/goldbergyoni/nodebestpractices

