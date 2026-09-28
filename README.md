# Mar & Terraza — restaurante full-stack

Aplicación completa de restaurante con web pública, API, reservas, disponibilidad y panel privado.

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
Abre http://localhost:3000

Panel: http://localhost:3000/admin.html
Credenciales iniciales: las definidas en `.env` (por defecto admin@restaurante.local / admin123). **Cámbialas antes de publicar.**

## API
- GET `/api/menu`
- GET `/api/availability?date=YYYY-MM-DD`
- POST `/api/reservations`
- POST `/api/contact`
- POST `/api/admin/login`
- GET `/api/admin/reservations` (JWT)
- PATCH `/api/admin/reservations/:id` (JWT)
- GET `/api/admin/messages` (JWT)
- GET `/api/health`

## Base de datos
SQLite se crea automáticamente en `db/restaurante.sqlite`. Tablas: admins, menu_items, reservations y contact_messages.

## Producción
Para producción conviene sustituir SQLite por PostgreSQL si se usa un hosting con almacenamiento efímero, configurar `JWT_SECRET` fuerte, HTTPS, correo transaccional y copias de seguridad. El dominio y hosting son los únicos costes externos habituales; el código y las dependencias son gratuitos/open source.
