require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const db = require('./db');

// ============================================================
// CONFIGURACIÓN
// ============================================================

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(cors());
app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, '../public')
  )
);

// ============================================================
// AUTENTICACIÓN
// ============================================================

function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';

    const token = authorization.replace('Bearer ', '');

    req.user = jwt.verify(token, SECRET);

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }
}

// ============================================================
// VALIDACIONES
// ============================================================

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Horarios disponibles
const SLOT_TIMES = Array.from(
  { length: 17 },
  (_, index) => {
    const totalMinutes = 13 * 60 + index * 30;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0')
    );
  }
).filter(
  (time) => time !== '21:30'
);

// ============================================================
// API - CARTA
// ============================================================

app.get('/api/menu', (req, res) => {
  try {
    const menu = db
      .prepare(`
        SELECT *
        FROM menu_items
        WHERE active = 1
        ORDER BY
          CASE category
            WHEN 'Entrantes' THEN 1
            WHEN 'Pescados' THEN 2
            WHEN 'Carnes' THEN 3
            ELSE 4
          END,
          id
      `)
      .all();

    res.json(menu);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'No se pudo cargar la carta'
    });
  }
});

// ============================================================
// API - DISPONIBILIDAD
// ============================================================

app.get('/api/availability', (req, res) => {
  try {
    const { date } = req.query;

    if (!validDate(date)) {
      return res.status(400).json({
        error: 'Fecha no válida'
      });
    }

    const booked = db
      .prepare(`
        SELECT
          time,
          SUM(guests) AS guests
        FROM reservations
        WHERE date = ?
          AND status != 'cancelled'
        GROUP BY time
      `)
      .all(date);

    const capacity = 40;

    const slots = [];

    for (let hour = 13; hour <= 21; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 21 && minute === 30) {
          continue;
        }

        const time =
          String(hour).padStart(2, '0') +
          ':' +
          String(minute).padStart(2, '0');

        const booking = booked.find(
          (item) => item.time === time
        );

        const used = booking
          ? booking.guests
          : 0;

        if (used < capacity) {
          slots.push({
            time,
            remaining: capacity - used
          });
        }
      }
    }

    res.json(slots);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'No se pudo consultar la disponibilidad'
    });
  }
});

// ============================================================
// API - RESERVAS
// ============================================================

app.post('/api/reservations', (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      date,
      time,
      guests,
      notes = ''
    } = req.body;

    const numberOfGuests = Number(guests);

    // -------------------------
    // Validación
    // -------------------------

    if (
      !name ||
      !email ||
      !phone ||
      !validDate(date) ||
      !validTime(time) ||
      !SLOT_TIMES.includes(time) ||
      !Number.isInteger(numberOfGuests) ||
      numberOfGuests < 1 ||
      numberOfGuests > 20
    ) {
      return res.status(400).json({
        error: 'Revisa los datos de la reserva'
      });
    }

    // -------------------------
    // Fecha mínima
    // -------------------------

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    if (date < today) {
      return res.status(400).json({
        error: 'La fecha de la reserva no puede ser anterior a hoy'
      });
    }

    // -------------------------
    // Comprobar ocupación
    // -------------------------

    const result = db
      .prepare(`
        SELECT
          COALESCE(SUM(guests), 0) AS guests
        FROM reservations
        WHERE date = ?
          AND time = ?
          AND status != 'cancelled'
      `)
      .get(date, time);

    const usedGuests = result.guests;

    if (usedGuests + numberOfGuests > 40) {
      return res.status(409).json({
        error: 'Ese horario está completo'
      });
    }

    // -------------------------
    // Insertar reserva
    // -------------------------

    const reservation = db
      .prepare(`
        INSERT INTO reservations (
          name,
          email,
          phone,
          date,
          time,
          guests,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        name,
        email,
        phone,
        date,
        time,
        numberOfGuests,
        notes
      );

    res.status(201).json({
      id: reservation.lastInsertRowid,
      message:
        'Reserva recibida. Te contactaremos para confirmarla.'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'No se pudo crear la reserva'
    });
  }
});

// ============================================================
// API - CONTACTO
// ============================================================

app.post('/api/contact', (req, res) => {
  try {
    const {
      name,
      email,
      message
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Faltan datos'
      });
    }

    db.prepare(`
      INSERT INTO contact_messages (
        name,
        email,
        message
      )
      VALUES (?, ?, ?)
    `).run(
      name,
      email,
      message
    );

    res.status(201).json({
      message: 'Mensaje enviado'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'No se pudo enviar el mensaje'
    });
  }
});

// ============================================================
// API - LOGIN ADMIN
// ============================================================

app.post('/api/admin/login', (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const admin = db
      .prepare(`
        SELECT *
        FROM admins
        WHERE email = ?
      `)
      .get(email);

    if (
      !admin ||
      !bcrypt.compareSync(
        password,
        admin.password_hash
      )
    ) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email
      },
      SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.json({
      token
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Error al iniciar sesión'
    });
  }
});

// ============================================================
// API ADMIN - RESERVAS
// ============================================================

app.get(
  '/api/admin/reservations',
  auth,
  (req, res) => {
    try {
      const reservations = db
        .prepare(`
          SELECT *
          FROM reservations
          ORDER BY
            date ASC,
            time ASC,
            id DESC
        `)
        .all();

      res.json(reservations);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'No se pudieron cargar las reservas'
      });
    }
  }
);

// ============================================================
// API ADMIN - CAMBIAR ESTADO RESERVA
// ============================================================

app.patch(
  '/api/admin/reservations/:id',
  auth,
  (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'pending',
        'confirmed',
        'cancelled'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Estado inválido'
        });
      }

      db.prepare(`
        UPDATE reservations
        SET status = ?
        WHERE id = ?
      `).run(
        status,
        req.params.id
      );

      res.json({
        ok: true
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'No se pudo actualizar la reserva'
      });
    }
  }
);

// ============================================================
// API ADMIN - MENSAJES
// ============================================================

app.get(
  '/api/admin/messages',
  auth,
  (req, res) => {
    try {
      const messages = db
        .prepare(`
          SELECT *
          FROM contact_messages
          ORDER BY id DESC
        `)
        .all();

      res.json(messages);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'No se pudieron cargar los mensajes'
      });
    }
  }
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'restaurante-api'
  });
});

// ============================================================
// FRONTEND
// ============================================================

app.get(
  '/{*splat}',
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        '../public/index.html'
      )
    );
  }
);

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(
  PORT,
  () => {
    console.log(
      `http://localhost:${PORT}`
    );
  }
);