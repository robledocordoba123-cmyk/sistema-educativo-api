// Cargamos el archivo .env para que process.env tenga PORT y API_PASSWORD
// Debe ir en la primera línea antes de usar cualquier variable de entorno
require('dotenv').config();

const express = require('express');
const app = express();

// Permite leer el body de las peticiones en formato JSON
// Sin esto req.body llega como undefined en POST y PUT
app.use(express.json());

// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// Se ejecuta antes de llegar a cualquier endpoint
// Si el header "password" no llega o es incorrecto, rechaza la petición
app.use((req, res, next) => {
  const apiKey = req.headers['password'];

  // Si no mandaron el header respondemos 401 (no autenticado)
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Password requerida' });
  }

  // Si la contraseña no coincide con la del .env respondemos 403 (prohibido)
  if (apiKey !== process.env.API_PASSWORD) {
    return res.status(403).json({ success: false, message: 'Password incorrecta' });
  }

  // Todo bien — dejamos pasar la petición al endpoint
  next();
});

// Registramos cada archivo de rutas con su prefijo de URL
// Ejemplo: cualquier petición a /profesores va al router de profesores.js
app.use('/profesores',    require('./routes/profesores'));
app.use('/materias',      require('./routes/materias'));
app.use('/estudiantes',   require('./routes/estudiantes'));
app.use('/cursos',        require('./routes/cursos'));
app.use('/horarios',      require('./routes/horarios'));
app.use('/inscripciones', require('./routes/inscripciones'));
app.use('/notas',         require('./routes/notas'));

// Render asigna su propio puerto en producción a través de process.env.PORT
// Si no existe usamos 3000 para desarrollo local
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${server.address().port}`);
});