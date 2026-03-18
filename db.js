// Importamos sqlite3 en modo verbose para que los errores
// muestren más información, útil cuando algo falla
const sqlite3 = require('sqlite3').verbose();

// Abrimos (o creamos si no existe) el archivo de base de datos
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// serialize() hace que los CREATE TABLE se ejecuten uno por uno en orden
// SQLite es asíncrono por defecto y sin esto podrían ejecutarse en desorden
db.serialize(() => {

  // Activamos las foreign keys porque SQLite las trae desactivadas por defecto
  // Sin esta línea las relaciones entre tablas no se respetan
  db.run('PRAGMA foreign_keys = ON');

  // TABLA: profesores
  // CHECK(activo IN (0,1)) — solo acepta 0 (inactivo) o 1 (activo)
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

  // TABLA: materias
  // CHECK(creditos > 0 AND creditos <= 10) — los créditos deben estar en rango válido
  db.run(`
    CREATE TABLE IF NOT EXISTS materias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL UNIQUE,
      creditos INTEGER NOT NULL CHECK(creditos > 0 AND creditos <= 10),
      descripcion TEXT
    )
  `);

  // TABLA: estudiantes
  // documento es UNIQUE porque es la cédula y no se puede repetir
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

  // TABLA: cursos
  // Tiene dos FOREIGN KEY: hacia materias y hacia profesores
  // No se puede crear un curso con una materia o profesor que no exista
  // CHECK(año >= 2000) evita años inválidos
  // CHECK(semestre IN (1,2)) solo primer o segundo semestre
  // CHECK(cupo > 0) el cupo siempre debe ser positivo
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

  // TABLA: horarios
  // Cada horario pertenece a un curso (FOREIGN KEY)
  // CHECK en dia: solo acepta los días de semana válidos
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

  // TABLA: inscripciones
  // Une estudiantes con cursos — es la tabla central del sistema
  // Tiene FK hacia estudiantes y hacia cursos
  // CHECK en estado: solo acepta los 3 estados posibles
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

  // TABLA: notas
  // Depende de inscripciones — una nota siempre pertenece a una inscripción
  // CHECK en tipo: solo acepta los tipos de evaluación definidos
  // CHECK en valor: la nota debe estar entre 0 y 5 (escala colombiana)
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