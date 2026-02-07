# Libryfix-back (Backend)

API REST del proyecto Libryfix: Express + Supabase. Sirve datos (usuarios, etc.) que consume el frontend Libryfix.

## Requisitos

- Node.js (v18 o superior recomendado)
- Cuenta en [Supabase](https://supabase.com) y proyecto con una tabla `Users`

## Estructura del proyecto

```
Libryfix-back/
├── controller/          # Lógica de negocio por recurso
│   └── userController.js
├── routes/              # Definición de rutas
│   └── userRoutes.js
├── .gitignore
├── app.js               # Punto de entrada (Express, middlewares, rutas)
├── package.json
└── README.md
```

- **app.js:** Carga variables de entorno, configura Express (JSON, CORS, morgan), monta las rutas y arranca el servidor en el puerto 3000.
- **routes/userRoutes.js:** Define las rutas bajo `/users` (ej. `GET /users/getUsers`) y las asocia a funciones del controlador.
- **controller/userController.js:** Conecta con Supabase y devuelve los datos (ej. listado de usuarios).

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (no subirlo a git):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SECRET_KEY_SUPABASE=tu_service_role_key
PUBLIC_KEY_SUPABASE=tu_anon_key
```

- **SUPABASE_URL** y **SECRET_KEY_SUPABASE** son obligatorios; si faltan, la aplicación no arranca.
- **PUBLIC_KEY_SUPABASE** se usa si en el futuro expones algo desde el cliente; el controlador actual usa la clave secreta en el servidor.

## Comandos

| Comando         | Descripción                    |
|-----------------|--------------------------------|
| `npm install`   | Instalar dependencias          |
| `npm start`     | Arrancar servidor (node app.js)|
| `npm run dev`   | Igual que start (desarrollo)   |
| `npm test`      | Tests (por defecto sin definir)|

## Desplegar en desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear `.env` con `SUPABASE_URL` y `SECRET_KEY_SUPABASE` (y opcionalmente `PUBLIC_KEY_SUPABASE`).

3. Arrancar el servidor:
   ```bash
   npm start
   ```
   o:
   ```bash
   node app.js
   ```

4. El API queda disponible en **http://localhost:3000**
   - Ruta de prueba: **GET** `http://localhost:3000/` → mensaje "API funcionando 🚀"
   - Usuarios: **GET** `http://localhost:3000/users/getUsers` → JSON con usuarios de Supabase

## Cómo funciona

- **Entrada:** `app.js` carga `dotenv`, Express, CORS, morgan y las rutas de usuarios.
- **Rutas:** Las peticiones a `/users/*` se delegan a `routes/userRoutes.js` (ej. `GET /users/getUsers` → `getAllUsers`).
- **Controlador:** `userController.js` usa el cliente de Supabase (con `SUPABASE_URL` y `SECRET_KEY_SUPABASE`) para leer la tabla `Users` y responder con JSON.
- **CORS:** Configurado para permitir peticiones desde `http://localhost:5173` (frontend Vite).
- **Logs:** Las peticiones se registran con morgan en `access.log`.

## Tecnologías

- **Express 5** (servidor HTTP)
- **Supabase** (@supabase/supabase-js) para base de datos
- **cors**, **dotenv**, **morgan**
- **mongoose** y **supabase** (CLI) en dependencias; la lógica actual usa solo el cliente JS de Supabase
