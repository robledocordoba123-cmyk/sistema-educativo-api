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

  db.run(`CREATE TABLE IF NOT EXISTS profesores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT,
    especialidad TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    codigo TEXT NOT NULL UNIQUE,
    creditos INTEGER NOT NULL CHECK(creditos > 0 AND creditos <= 10),
    descripcion TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    documento TEXT NOT NULL UNIQUE,
    telefono TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    materiaId INTEGER NOT NULL,
    profesorId INTEGER NOT NULL,
    año INTEGER NOT NULL CHECK(año >= 2000),
    semestre INTEGER NOT NULL CHECK(semestre IN (1, 2)),
    cupo INTEGER NOT NULL CHECK(cupo > 0),
    FOREIGN KEY (materiaId) REFERENCES materias(id),
    FOREIGN KEY (profesorId) REFERENCES profesores(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cursoId INTEGER NOT NULL,
    dia TEXT NOT NULL CHECK(dia IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado')),
    horaInicio TEXT NOT NULL,
    horaFin TEXT NOT NULL,
    salon TEXT NOT NULL,
    FOREIGN KEY (cursoId) REFERENCES cursos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudianteId INTEGER NOT NULL,
    cursoId INTEGER NOT NULL,
    fechaInscripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa','cancelada','finalizada')),
    FOREIGN KEY (estudianteId) REFERENCES estudiantes(id),
    FOREIGN KEY (cursoId) REFERENCES cursos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inscripcionId INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('parcial1','parcial2','final','taller','proyecto')),
    valor REAL NOT NULL CHECK(valor >= 0 AND valor <= 5),
    fecha TEXT NOT NULL,
    observacion TEXT,
    FOREIGN KEY (inscripcionId) REFERENCES inscripciones(id)
  )`, () => {
    // El seed arranca SOLO cuando la última tabla termina de crearse
    // Así garantizamos que todas las tablas ya existen
    cargarSeed();
  });

  console.log('Tablas creadas correctamente');
});

function cargarSeed() {
  db.get('SELECT COUNT(*) as total FROM profesores', (err, row) => {
    if (err || row.total > 0) return;

    console.log('Cargando datos de prueba...');

    db.serialize(() => {
      // Insertamos todo dentro de serialize() para que vaya en orden
      db.run(`INSERT INTO profesores (nombre, email, telefono, especialidad) VALUES
        ('Ana García', 'ana.garcia@edu.com', '3001234567', 'Matemáticas')`);
      db.run(`INSERT INTO profesores (nombre, email, telefono, especialidad) VALUES
        ('Carlos Martínez', 'carlos.martinez@edu.com', '3019876543', 'Programación')`);
      db.run(`INSERT INTO profesores (nombre, email, telefono, especialidad) VALUES
        ('Laura Rodríguez', 'laura.rodriguez@edu.com', '3025554433', 'Bases de Datos')`);

      db.run(`INSERT INTO materias (nombre, codigo, creditos, descripcion) VALUES
        ('Cálculo Diferencial', 'MAT101', 4, 'Fundamentos del cálculo')`);
      db.run(`INSERT INTO materias (nombre, codigo, creditos, descripcion) VALUES
        ('Programación Web', 'PRG201', 3, 'Desarrollo frontend y backend')`);
      db.run(`INSERT INTO materias (nombre, codigo, creditos, descripcion) VALUES
        ('Base de Datos', 'BDD301', 4, 'Diseño y gestión de bases de datos')`);

      db.run(`INSERT INTO estudiantes (nombre, email, documento, telefono) VALUES
        ('Juan Pérez', 'juan.perez@estudiante.com', '1001234567', '3101112233')`);
      db.run(`INSERT INTO estudiantes (nombre, email, documento, telefono) VALUES
        ('María López', 'maria.lopez@estudiante.com', '1009876543', '3114445566')`);
      db.run(`INSERT INTO estudiantes (nombre, email, documento, telefono) VALUES
        ('Pedro Sánchez', 'pedro.sanchez@estudiante.com', '1005554433', '3127778899')`);

      db.run(`INSERT INTO cursos (nombre, materiaId, profesorId, año, semestre, cupo) VALUES
        ('Cálculo I - Grupo A', 1, 1, 2025, 1, 30)`);
      db.run(`INSERT INTO cursos (nombre, materiaId, profesorId, año, semestre, cupo) VALUES
        ('Programación Web - Grupo B', 2, 2, 2025, 1, 25)`);
      db.run(`INSERT INTO cursos (nombre, materiaId, profesorId, año, semestre, cupo) VALUES
        ('Base de Datos - Grupo A', 3, 3, 2025, 2, 20)`);

      db.run(`INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES
        (1, 'Lunes', '08:00', '10:00', 'Aula 101')`);
      db.run(`INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES
        (1, 'Miercoles', '08:00', '10:00', 'Aula 101')`);
      db.run(`INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES
        (2, 'Martes', '10:00', '12:00', 'Lab Sistemas')`);
      db.run(`INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES
        (3, 'Jueves', '14:00', '16:00', 'Aula 203')`);

      db.run(`INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES
        (1, 1, '2025-02-01', 'activa')`);
      db.run(`INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES
        (2, 1, '2025-02-01', 'activa')`);
      db.run(`INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES
        (3, 2, '2025-02-03', 'activa')`);
      db.run(`INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES
        (1, 3, '2025-02-05', 'finalizada')`);

      db.run(`INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES
        (1, 'parcial1', 4.2, '2025-03-15', 'Buen desempeño')`);
      db.run(`INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES
        (1, 'parcial2', 3.8, '2025-04-20', null)`);
      db.run(`INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES
        (2, 'parcial1', 4.5, '2025-03-15', 'Excelente')`);
      db.run(`INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES
        (3, 'final', 3.5, '2025-05-10', null)`);
      db.run(`INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES
        (4, 'final', 4.8, '2025-05-12', 'Aprobado con distinción')`, () => {
          console.log('Datos de prueba cargados correctamente ✓');
      });
    });
  });
}

module.exports = db;