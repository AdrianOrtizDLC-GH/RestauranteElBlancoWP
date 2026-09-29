# Mar & Terraza — Restaurante full-stack

Aplicación completa de restaurante con web pública, API, reservas, disponibilidad, contacto y panel privado.

## Requisitos

- Node.js 20+
- npm

## Arranque local

```bash
cp .env.example .env
npm install
npm run seed
npm start
```

En Windows puedes copiar `.env.example` manualmente como `.env` si no usas `cp`.

Abre:

- Web: http://localhost:3000
- Panel: http://localhost:3000/admin.html
- Health check: http://localhost:3000/api/health

Credenciales iniciales:

```text
Email: admin@restaurante.local
Contraseña: admin123
```

Cámbialas en `.env` antes de publicar el proyecto.

## API

### Pública

- `GET /api/menu`
- `GET /api/availability?date=YYYY-MM-DD`
- `POST /api/reservations`
- `POST /api/contact`
- `GET /api/health`

### Administración

- `POST /api/admin/login`
- `GET /api/admin/reservations` — JWT
- `PATCH /api/admin/reservations/:id` — JWT
- `GET /api/admin/messages` — JWT

## Base de datos

SQLite se crea automáticamente en:

```text
db/restaurante.sqlite
```

Tablas:

- `admins`
- `menu_items`
- `reservations`
- `contact_messages`

No necesitas crear la base de datos manualmente. `npm run seed` crea las tablas y carga el administrador y la carta inicial.

## Últimas correcciones

- Compatibilidad con Express 5: el catch-all utiliza `/{*splat}` en lugar de `*`.
- Validación de fechas y horarios de reserva en backend.
- El backend solo acepta los horarios publicados por el sistema de disponibilidad.
- Corregido el `$()` que faltaba en `admin.html`.
- Corregido el cálculo de fecha mínima del formulario para usar la fecha local del navegador.
- Añadido menú móvil funcional.

## Producción

Antes de publicar:

1. Cambia `JWT_SECRET` por una clave larga y aleatoria.
2. Cambia `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. Usa HTTPS.
4. Configura copias de seguridad de SQLite o migra a PostgreSQL si el hosting utiliza almacenamiento efímero.
5. Configura correo transaccional si quieres enviar confirmaciones automáticas.
