const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS profesores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      telefono TEXT,
      especialidad TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS materias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL UNIQUE,
      creditos INTEGER NOT NULL CHECK(creditos > 0 AND creditos <= 10),
      descripcion TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      documento TEXT NOT NULL UNIQUE,
      telefono TEXT,
      activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      materiaId INTEGER NOT NULL,
      profesorId INTEGER NOT NULL,
      año INTEGER NOT NULL CHECK(año >= 2000),
      semestre INTEGER NOT NULL CHECK(semestre IN (1, 2)),
      cupo INTEGER NOT NULL CHECK(cupo > 0),
      FOREIGN KEY (materiaId) REFERENCES materias(id),
      FOREIGN KEY (profesorId) REFERENCES profesores(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cursoId INTEGER NOT NULL,
      dia TEXT NOT NULL CHECK(dia IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado')),
      horaInicio TEXT NOT NULL,
      horaFin TEXT NOT NULL,
      salon TEXT NOT NULL,
      FOREIGN KEY (cursoId) REFERENCES cursos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudianteId INTEGER NOT NULL,
      cursoId INTEGER NOT NULL,
      fechaInscripcion TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa','cancelada','finalizada')),
      FOREIGN KEY (estudianteId) REFERENCES estudiantes(id),
      FOREIGN KEY (cursoId) REFERENCES cursos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inscripcionId INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('parcial1','parcial2','final','taller','proyecto')),
      valor REAL NOT NULL CHECK(valor >= 0 AND valor <= 5),
      fecha TEXT NOT NULL,
      observacion TEXT,
      FOREIGN KEY (inscripcionId) REFERENCES inscripciones(id)
    )
  `);

  console.log('Tablas creadas correctamente');
});

module.exports = db;