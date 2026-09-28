require('dotenv').config();
const bcrypt=require('bcryptjs'); const db=require('./db');
const email=process.env.ADMIN_EMAIL||'admin@restaurante.local'; const password=process.env.ADMIN_PASSWORD||'admin123';
const hash=bcrypt.hashSync(password,12);
db.prepare('INSERT OR IGNORE INTO admins(email,password_hash) VALUES(?,?)').run(email,hash);
const count=db.prepare('SELECT COUNT(*) c FROM menu_items').get().c;
if(!count){
 const items=[
 ['Entrantes','Rabas','Rabas de calamar crujientes','13.50'],['Entrantes','Croquetas caseras','Selección cremosa de croquetas','11.50'],['Entrantes','Zamburiñas','Zamburiñas a la plancha','19.00'],
 ['Pescados','Merluza en salsa verde','Merluza fresca con salsa verde','19.00'],['Pescados','Pescado del día','Según lonja y temporada','sugerencia'],
 ['Carnes','Entrecot','Entrecot de vaca a la parrilla','21.00'],['Carnes','Solomillo de ternera','Solomillo con guarnición','25.00'],
 ['Postres','Tarta de queso','Tarta cremosa de la casa','6.50'],['Postres','Postre del día','Elaboración casera','6.00']
 ];
 const ins=db.prepare('INSERT INTO menu_items(category,name,description,price,image) VALUES(?,?,?,?,?)');
 for(const x of items){const price=x[3]==='sugerencia'?0:Number(x[3]);ins.run(x[0],x[1],x[2],price,'');}
}
console.log(`Admin: ${email} / ${password}`);
