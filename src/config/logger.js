const pino = require('pino');

const minimumLevel = process.env.PINO_LOG_LEVEL || 'info';

// Creamos donde se van a escribir los logs, tanto en consola como en archivos separados para app y http.
const appTransport = pino.transport({
    targets: [
        {
            target: "pino-pretty",
            options: { destination: './logs/app.log', mkdir: true, colorize: false }
        },
        {
            target: "pino-pretty",
            options: { destination: process.stdout.fd, colorize: true }
        }
    ]
})

const httpTransport = pino.transport({
    targets: [
        {
            target: "pino-file",
            options: { destination: './logs/http.log', mkdir: true, colorize: false }
        },
        {
            target: "pino-pretty",
            options: { destination: process.stdout.fd, colorize: true }
        }
    ]
})

//Creamos una instancia de pino con el nivel mínimo de logeo y el transport configurado para escribir en ambos destinos (archivo y consola)
const logger = pino(
    {
    level: minimumLevel
    },
    appTransport
);

// Creamos una instancia de pino para el logger HTTP, con el mismo nivel mínimo y transport configurado para escribir en ambos destinos (archivo y consola)
const httpLogger = pino(
    {
    level: minimumLevel
    },
    httpTransport
);


module.exports = { logger, httpLogger };
