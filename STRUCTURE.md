## Estructura del Proyecto — Libryfix Backend (explicación ampliada)

### Resumen rápido

He reorganizado el backend para seguir patrones usados en proyectos Node/Express maduros: separación clara entre arranque, configuración, rutas, controladores y lógica de negocio. El objetivo es mejorar mantenibilidad, testabilidad y escalabilidad.

La estructura propuesta está en `src/` y el punto de entrada es `server.js` en la raíz. Los cambios principales son:

- Extraer la configuración compartida (`supabase`, `nodemailer`) a `src/config/` como singletons.
- Separar `controller` (HTTP) y `service` (lógica de negocio).
- Añadir middlewares reutilizables (`authMiddleware`, `errorHandler`).
- Validar variables de entorno en arranque para fallar rápido si falta algo crítico.

---

### Estructura escogida (detallada)

```
Libryfix-back/
├── .env
├── .gitignore
├── package.json
├── README.md
├── server.js                       ← Punto de entrada: arranca el servidor
└── src/
    ├── app.js                      ← Configura Express (middlewares, rutas, error handler)
    ├── config/
    │   ├── env.js                  ← Validación centralizada de variables de entorno
    │   ├── nodemailer.js           ← Transporte Nodemailer (singleton)
    │   └── supabase.js             ← Cliente Supabase (singleton)
    ├── controllers/
    │   ├── authController.js       ← HTTP: valida req, llama al service, responde
    │   └── userController.js
    ├── middlewares/
    │   ├── authMiddleware.js       ← Verificación JWT para rutas protegidas
    │   └── errorHandler.js         ← Manejador global de errores no controlados
    ├── models/
    │   └── User.js                 ← Entidad/clase de dominio (mapeo de resultados)
    ├── routes/
    │   ├── index.js                ← Montaje centralizado de todas las rutas
    │   ├── authRoutes.js
    │   └── userRoutes.js
    ├── services/
    │   ├── authService.js          ← Lógica de negocio de autenticación
    │   ├── emailService.js         ← Envío de correos (usa config/nodemailer)
    │   └── userService.js          ← Lógica de negocio de usuarios
    └── utils/
        └── validators.js           ← Constantes y utilidades compartidas (EMAIL_REGEX…)
```

---

### Explicación de las decisiones (qué cambia y por qué)

- `server.js` vs `src/app.js`: `server.js` lanza el proceso (solo `listen`). `src/app.js` exporta la app configurada. Esto permite tests con `supertest` y reinicio más seguro del servidor.

- `config/` como singletons: evita re-instanciar clientes (Supabase, Nodemailer) y centraliza configuración. Facilita cambiar el proveedor (ej. pasar a otro cliente DB) en un único sitio.

- `services/`: concentra la lógica de negocio (registro, login, generación de OTPs). Los servicios no conocen `req`/`res`, por tanto son fácilmente testeables y reutilizables.

- `controllers/`: validan la forma de la petición, llaman al service y devuelven respuesta HTTP. Si un service lanza un Error con `.status`, el controller lo traduce directo al cliente o lo pasa al `errorHandler`.

- `middlewares/`: `authMiddleware` centraliza la verificación del JWT para rutas privadas; `errorHandler` captura errores no controlados y evita duplicación de manejo de errores.

- `utils/validators.js`: utilidades compartidas para evitar duplicación (ej. `EMAIL_REGEX`).

---

### Cambios aplicados en el código (resumen técnico)

- Se creó `src/config/supabase.js` que exporta la instancia de Supabase.
- Se creó `src/config/env.js` que valida `SUPABASE_URL`, `SECRET_KEY_SUPABASE`, `JWT_SECRET` y cualquier otra variable crítica.
- Se movió la lógica de autenticación (generación/validación de OTP) a `src/services/authService.js` y se usa `otplib` para HOTP.
- Se añadió `src/middlewares/authMiddleware.js` y se protegió el endpoint de usuarios.
- Rutas, controladores y servicios fueron reorganizados bajo `src/`.

---

### Guía rápida de migración / cómo explicar los cambios

1. "Antes": carpeta raíz con `controller/`, `routes/`, `services/` y `app.js` que hacía `listen()`.
2. "Ahora": todo el código está bajo `src/`, con `server.js` solo para arrancar.
3. Beneficios clave:
   - Tests: `src/app.js` se puede importar en tests sin arrancar el servidor.
   - Menor acoplamiento: servicios independientes de Express.
   - Menos duplicación: config singletons y utils centrales.
   - Seguridad: validación de entorno en arranque y middleware de auth centralizado.

---

### Cómo ejecutar (rápido)

Desde la raiz del proyecto:

```bash
npm install
npm start
```

Desarrollo con reinicio automático (recomendada):

```bash
npm install -D nodemon
npx nodemon server.js
```

---

### Siguientes pasos recomendados

- Añadir `repositories/` para encapsular llamadas a Supabase y facilitar mocks en tests.
- Añadir validación de entradas con `zod` o `joi` dentro de `controllers` o en `middlewares`.
- Implementar tests unitarios para `services/` y tests de integración para `controllers/` con `supertest`.
- Añadir CI (GitHub Actions) que ejecute lint y tests.

---

Si quieres, puedo generar un diff limpio que muestre exactamente qué líneas se movieron/renombraron (útil para presentar en un repo público) o crear un `CHANGELOG.md` con los cambios aplicados. 

