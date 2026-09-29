const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('✓ Base de datos conectada');

// ==================== ADMIN ====================

const adminEmail = 'admin@restaurante.local';
const adminPassword = 'admin123';

const passwordHash = bcrypt.hashSync(adminPassword, 10);

const existingAdmin = db
  .prepare('SELECT id FROM admins WHERE email = ?')
  .get(adminEmail);

if (!existingAdmin) {
  db.prepare(`
    INSERT INTO admins (email, password_hash)
    VALUES (?, ?)
  `).run(adminEmail, passwordHash);

  console.log(`✓ Administrador creado: ${adminEmail}`);
} else {
  console.log(`✓ Administrador ya existe: ${adminEmail}`);
}

// ==================== CARTA ====================

const menuCount = db
  .prepare('SELECT COUNT(*) AS count FROM menu_items')
  .get().count;

if (menuCount === 0) {
  const menuItems = [
    {
      category: 'Entrantes',
      name: 'Rabas de Cantabria',
      description: 'Rabas tiernas y crujientes.',
      price: 14
    },
    {
      category: 'Entrantes',
      name: 'Croquetas caseras',
      description: 'Croquetas cremosas de elaboración casera.',
      price: 12
    },
    {
      category: 'Entrantes',
      name: 'Ensalada de temporada',
      description: 'Producto fresco de temporada.',
      price: 11
    },
    {
      category: 'Pescados',
      name: 'Pescado del día',
      description: 'Pescado fresco según mercado.',
      price: null
    },
    {
      category: 'Pescados',
      name: 'Merluza a la plancha',
      description: 'Merluza fresca con guarnición.',
      price: 22
    },
    {
      category: 'Carnes',
      name: 'Entrecot de vaca',
      description: 'Entrecot a la parrilla con patatas.',
      price: 24
    },
    {
      category: 'Carnes',
      name: 'Solomillo',
      description: 'Solomillo de vaca a la parrilla.',
      price: 25
    },
    {
      category: 'Postres',
      name: 'Tarta de queso',
      description: 'Tarta de queso cremosa de la casa.',
      price: 7
    },
    {
      category: 'Postres',
      name: 'Arroz con leche',
      description: 'Arroz con leche tradicional.',
      price: 6
    }
  ];

  const insertMenu = db.prepare(`
    INSERT INTO menu_items
      (category, name, description, price, active)
    VALUES (?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertMenu.run(
        item.category,
        item.name,
        item.description,
        item.price
      );
    }
  });

  insertMany(menuItems);

  console.log(`✓ Carta creada: ${menuItems.length} platos`);
} else {
  console.log(`✓ La carta ya contiene ${menuCount} platos`);
}

console.log('');
console.log('================================');
console.log('       SEED COMPLETADO');
console.log('================================');
console.log('');
console.log(`Admin: ${adminEmail}`);
console.log(`Password: ${adminPassword}`);