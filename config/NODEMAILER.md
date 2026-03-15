# Nodemailer – Guía en este proyecto

Documentación basada en la [documentación oficial de Nodemailer](https://nodemailer.com/). Sirve como referencia para configurar el transporter y los mensajes en `config/nodemailer.js` y en cualquier servicio que envíe correos.

---

## 1. Crear el transporter: `createTransport(options[, defaults])`

El transporter es el objeto que se usa para enviar correos. Se crea con:

```js
const transporter = nodemailer.createTransport(opcionesSMTP [, opcionesPorDefecto])
```

### 1.1 Opciones del transporter (SMTP)

Objeto que define la conexión al servidor SMTP.

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **host** | string | Servidor SMTP (ej. `'smtp.ethereal.email'`, `'smtp.gmail.com'`). Por defecto `'localhost'`. |
| **port** | number | Puerto (587 para STARTTLS, 465 para SSL). Por defecto 587 si `secure: false`, 465 si `secure: true`. |
| **secure** | boolean | `true` = SSL/TLS en el puerto 465; `false` = STARTTLS en 587. |
| **auth** | object | Credenciales: `{ user: 'email@ejemplo.com', pass: 'contraseña' }`. |
| **authMethod** | string | Método de autenticación preferido (por defecto `'PLAIN'`). |

**TLS / seguridad**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **tls** | object | Opciones del socket TLS (ej. `{ rejectUnauthorized: true }`). |
| **ignoreTLS** | boolean | Desactiva TLS aunque el servidor anuncie STARTTLS. |
| **requireTLS** | boolean | Fuerza el uso de STARTTLS. |

**Conexión y tiempos**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **connectionTimeout** | number | Milisegundos para establecer la conexión (por defecto 2 min). |
| **socketTimeout** | number | Milisegundos de inactividad permitidos (por defecto 10 min). |
| **dnsTimeout** | number | Tiempo de espera para resolución DNS (por defecto 30 s). |

**Pool de conexiones** (varios correos sin cerrar conexión)

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **pool** | boolean | `true` para usar pool de conexiones. |
| **maxConnections** | number | Conexiones simultáneas máximas (por defecto 5). |
| **maxMessages** | number | Mensajes por conexión antes de reconectar (por defecto 100). |

**Atajos con `service`**

En lugar de poner `host` y `port` a mano, puedes usar:

```js
const transporter = nodemailer.createTransport({
  service: 'Gmail',  // también: 'Outlook', 'SendGrid', 'Yahoo', etc.
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
})
```

Nodemailer aplica host y puerto según el servicio. Ver [Well-Known Services](https://nodemailer.com/smtp/well-known-services).

### 1.2 Segundo parámetro: `defaults`

Opciones que se mezclan con **cada** mensaje enviado con ese transporter. Útil para no repetir `from`, `replyTo`, etc.

```js
const transporter = nodemailer.createTransport(
  { host: '...', port: 587, auth: { ... } },
  {
    from: '"Libryfix" <noreply@libryfix.com>',
    replyTo: 'soporte@libryfix.com'
  }
)
```

Al llamar a `sendMail()`, si no pasas `from`, se usará el de `defaults`.

---

## 2. Enviar un mensaje: `transporter.sendMail(mailOptions)`

```js
const info = await transporter.sendMail(opcionesMensaje)
```

### 2.1 Opciones del mensaje (`mailOptions`)

Campos que puedes pasar al objeto de `sendMail()` (y que no estén ya en `defaults`):

**Básicos**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **from** | string | Remitente. Puede ser `'email@ejemplo.com'` o `'"Nombre" <email@ejemplo.com>'`. |
| **to** | string \| string[] | Destinatarios en "Para". Varios: `'a@x.com, b@x.com'` o array `['a@x.com', 'b@x.com']`. |
| **cc** | string \| string[] | Con copia. |
| **bcc** | string \| string[] | Con copia oculta. |
| **subject** | string | Asunto del correo. |
| **text** | string | Cuerpo en texto plano. |
| **html** | string | Cuerpo en HTML. Si hay `text` e `html`, el cliente muestra el que soporte. |

**Respuestas y enrutado**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **replyTo** | string | Dirección a la que se responderá. |
| **inReplyTo** | string | Message-ID del mensaje al que se responde. |
| **references** | string \| string[] | Message-IDs relacionados (hilos). |
| **sender** | string | Dirección cuando el "sender" es distinto de "from". |

**Contenido avanzado**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **attachments** | array | Lista de adjuntos. Cada elemento: `{ filename, content }` o `{ filename, path }`, etc. Ver [Attachments](https://nodemailer.com/message/attachments). |
| **textEncoding** | string | Codificación forzada: `'quoted-printable'` o `'base64'`. |
| **raw** | string \| Buffer \| Stream | Mensaje MIME ya construido (se envía tal cual). |

**Envelope (avanzado)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **envelope** | object | Sobres SMTP personalizados (`from`, `to`, etc.) si necesitas algo distinto a lo que pones en `from`/`to`. |

Ejemplo mínimo:

```js
await transporter.sendMail({
  from: '"Libryfix" <noreply@libryfix.com>',
  to: usuario.email,
  subject: 'Código para recuperar contraseña',
  text: `Tu código es: ${otp}`,
  html: `<p>Tu código es: <strong>${otp}</strong></p>`
})
```

---

## 3. Valor devuelto: objeto `info`

`sendMail()` devuelve una promesa que se resuelve con un objeto con la respuesta del transporte:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| **messageId** | string | Message-Id final del mensaje (casi todos los transportes lo devuelven). |
| **response** | string | Última respuesta del servidor SMTP (texto). |
| **envelope** | object | Envelope usado (from, to, etc.). |
| **accepted** | string[] | Direcciones que el servidor aceptó. |
| **rejected** | string[] | Direcciones rechazadas. |
| **pending** | string[] | Direcciones en estado pendiente (solo en transporte SMTP directo). |

Uso típico:

```js
const info = await transporter.sendMail({ ... })
console.log('Enviado:', info.messageId)
console.log('Respuesta SMTP:', info.response)
if (info.rejected?.length) {
  console.warn('Rechazados:', info.rejected)
}
```

Con Ethereal (cuentas de prueba), además puedes usar:

```js
console.log('Vista previa:', nodemailer.getTestMessageUrl(info))
```

Ese enlace abre en el navegador una vista previa del correo enviado (solo en entorno de pruebas con Ethereal).

---

## 4. Uso con async/await en CommonJS

En un proyecto con `"type": "commonjs"` (sin `"type": "module"`), `await` solo puede usarse **dentro** de una función `async`, no en la raíz del archivo.

```js
const nodemailer = require('nodemailer')

async function enviarCorreo () {
  const transporter = nodemailer.createTransport({ ... })
  const info = await transporter.sendMail({ ... })
  return info
}

enviarCorreo().catch(console.error)
```

O exportar el transporter y usar `await` donde llames a `sendMail()` (por ejemplo en un controller).

---

## 5. Referencias

- [Nodemailer – Inicio](https://nodemailer.com/)
- [SMTP transport](https://nodemailer.com/smtp/)
- [Message configuration](https://nodemailer.com/message)
- [Testing (Ethereal)](https://nodemailer.com/smtp/testing)
- [Well-known services](https://nodemailer.com/smtp/well-known-services)
- [Attachments](https://nodemailer.com/message/attachments)
- [Error reference](https://nodemailer.com/errors)
