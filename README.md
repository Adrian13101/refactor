# Sistema Backend de Turnos y Reservas

Backend de un sistema de turnos y reservas hecho con Node.js, Express (ESM) y persistencia en archivos JSON. Gestiona dos recursos: `services` (servicios disponibles) y `bookings` (reservas de los clientes).

La API está organizada en capas, cada una con una única responsabilidad. Los datos fluyen así:

```
Request -> Router -> Controller -> Service -> Repository -> DAO -> JSON
```

| Capa         | Carpeta             | Responsabilidad                                                                                   |
|--------------|---------------------|---------------------------------------------------------------------------------------------------|
| Routers      | `src/routes`        | Definen los endpoints y los conectan con su controller. Sin lógica.                               |
| Controllers  | `src/controllers`   | Capa HTTP: leen `req.params`, `req.query` y `req.body`, llaman al service y responden con `res`. |
| Services     | `src/services`      | Lógica de negocio y validaciones. Lanzan errores (400, 404, 409). No conocen `req` ni `res`.      |
| Repositories | `src/repositories`  | Interfaz de persistencia que usa el negocio. No saben cómo se guardan realmente los datos.        |
| DAO          | `src/dao`           | Acceso directo a la persistencia (hoy, archivos JSON). Es lo único que habrá que cambiar al migrar a MongoDB. |

Los errores se lanzan desde los services con las clases de `src/utils/errors.js` y un único middleware en `app.js` los convierte en la respuesta HTTP, por lo que el formato de las respuestas no cambia.

## Requisitos

- Node.js 18 o superior

## Instalación

```bash
git clone <URL-DEL-REPOSITORIO>
cd organizacion
npm install
cp .env.example .env     # en Windows: copy .env.example .env
```

Después revisá los valores del archivo `.env`.

## Ejecución

```bash
npm start
```

El servidor queda escuchando en `http://localhost:8080` (según el `PORT` del `.env`). También está disponible `npm run dev`, que reinicia al guardar cambios.

## Variables de entorno

| Variable   | Descripción             | Ejemplo       |
|------------|-------------------------|---------------|
| `PORT`     | Puerto del servidor     | `8080`        |
| `NODE_ENV` | Entorno de ejecución    | `development` |

Si falta alguna, la aplicación termina al iniciar con un mensaje que indica cuál.

## Estructura

```
src/
  config/env.config.js            # carga y valida variables de entorno
  routes/
    services.router.js
    bookings.router.js
  controllers/
    services.controller.js        # getServices, getServiceById, createService, updateService, deleteService
    bookings.controller.js        # createBooking, getBookingById, addServiceToBooking
  services/
    services.service.js           # reglas y validaciones de servicios
    bookings.service.js           # reglas y validaciones de reservas
  repositories/
    services.repository.js
    bookings.repository.js
  dao/
    services.dao.js               # lectura/escritura de services.json
    bookings.dao.js               # lectura/escritura de bookings.json
  utils/
    errors.js                     # AppError, ValidationError, NotFoundError, ConflictError
    validators.js                 # validaciones reutilizables (id, fecha, hora)
  data/
    services.json                 # persistencia de servicios
    bookings.json                 # persistencia de reservas
  container.js                    # arma las capas: DAO -> Repository -> Service
  app.js                          # configuración de Express y manejo de errores
  server.js                       # arranque del servidor
```

Los datos se guardan en `src/data/*.json`, por lo que no se pierden al reiniciar el servidor.

## Endpoints

| Método | Ruta                               | Descripción                                        | Códigos              |
|--------|------------------------------------|----------------------------------------------------|----------------------|
| GET    | /api/services                      | Lista servicios. Filtros: `category`, `available`  | 200, 400             |
| GET    | /api/services/:sid                 | Obtiene un servicio por id                         | 200, 400, 404        |
| POST   | /api/services                      | Crea un servicio                                   | 201, 400             |
| PUT    | /api/services/:sid                 | Actualiza un servicio (parcial)                    | 200, 400, 404        |
| DELETE | /api/services/:sid                 | Elimina un servicio                                | 200, 400, 404        |
| POST   | /api/bookings                      | Crea una reserva (sin servicios)                   | 201, 400             |
| GET    | /api/bookings/:bid                 | Obtiene una reserva por id                         | 200, 400, 404        |
| POST   | /api/bookings/:bid/services/:sid   | Agrega un servicio a la reserva                    | 200, 400, 404, 409   |

## Modelos

Servicio:

```json
{
  "id": 1,
  "name": "Corte de pelo",
  "description": "Corte clásico con lavado incluido",
  "duration": 30,
  "price": 5000,
  "category": "peluquería",
  "available": true
}
```

Reserva:

```json
{
  "id": 1,
  "customerName": "Ana Gómez",
  "customerEmail": "ana@example.com",
  "date": "2026-11-02",
  "time": "10:00",
  "services": [1]
}
```

- El `id` se genera automáticamente en ambos recursos: no se envía en el POST ni se puede modificar.
- `duration` está en minutos. `date` tiene formato `YYYY-MM-DD` y `time` formato `HH:MM` (24 hs).
- Una reserva se crea sin servicios (`services: []`) y se le agregan con `POST /api/bookings/:bid/services/:sid`.
- Al agregar un servicio, `BookingsService` verifica con `ServicesService` que exista (404 si no), que esté disponible (400) y que no esté ya en la reserva (409).
- El filtro `category` no distingue mayúsculas ni tildes (`?category=estetica` encuentra "estética").

## Ejemplos

```bash
# Servicios con filtros
curl "http://localhost:8080/api/services?category=bienestar&available=true"

# Crear una reserva
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Luis Pérez","customerEmail":"luis@example.com","date":"2026-11-03","time":"11:30"}'

# Agregar el servicio 2 a la reserva 1
curl -X POST http://localhost:8080/api/bookings/1/services/2

# Ver la reserva
curl http://localhost:8080/api/bookings/1
```
