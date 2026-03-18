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

db.serialize(() => {

  // Activamos las foreign keys porque SQLite las trae desactivadas por defecto
  db.run('PRAGMA foreign_keys = ON');

  // ── CREACIÓN DE TABLAS ──────────────────────────────────────
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

  // ── SEED AUTOMÁTICO ─────────────────────────────────────────
  // Revisamos si ya hay profesores — si la tabla está vacía
  // significa que el servidor acaba de arrancar limpio, entonces
  // insertamos todos los datos de prueba automáticamente
  db.get('SELECT COUNT(*) as total FROM profesores', (err, row) => {
    if (err || row.total > 0) return; // Si ya hay datos no hacemos nada

    console.log('Base de datos vacía — cargando datos de prueba...');

    // Insertamos profesores
    const profesores = [
      ['Ana García', 'ana.garcia@edu.com', '3001234567', 'Matemáticas'],
      ['Carlos Martínez', 'carlos.martinez@edu.com', '3019876543', 'Programación'],
      ['Laura Rodríguez', 'laura.rodriguez@edu.com', '3025554433', 'Bases de Datos'],
    ];
    profesores.forEach(p => {
      db.run('INSERT INTO profesores (nombre, email, telefono, especialidad) VALUES (?, ?, ?, ?)', p);
    });

    // Insertamos materias
    const materias = [
      ['Cálculo Diferencial', 'MAT101', 4, 'Fundamentos del cálculo'],
      ['Programación Web', 'PRG201', 3, 'Desarrollo frontend y backend'],
      ['Base de Datos', 'BDD301', 4, 'Diseño y gestión de bases de datos'],
    ];
    materias.forEach(m => {
      db.run('INSERT INTO materias (nombre, codigo, creditos, descripcion) VALUES (?, ?, ?, ?)', m);
    });

    // Insertamos estudiantes
    const estudiantes = [
      ['Juan Pérez', 'juan.perez@estudiante.com', '1001234567', '3101112233'],
      ['María López', 'maria.lopez@estudiante.com', '1009876543', '3114445566'],
      ['Pedro Sánchez', 'pedro.sanchez@estudiante.com', '1005554433', '3127778899'],
    ];
    estudiantes.forEach(e => {
      db.run('INSERT INTO estudiantes (nombre, email, documento, telefono) VALUES (?, ?, ?, ?)', e);
    });

    // Insertamos cursos — dependen de materias (id 1,2,3) y profesores (id 1,2,3)
    // Los IDs empiezan en 1 porque AUTOINCREMENT arranca desde 1
    setTimeout(() => {
      const cursos = [
        ['Cálculo I - Grupo A', 1, 1, 2025, 1, 30],
        ['Programación Web - Grupo B', 2, 2, 2025, 1, 25],
        ['Base de Datos - Grupo A', 3, 3, 2025, 2, 20],
      ];
      cursos.forEach(c => {
        db.run('INSERT INTO cursos (nombre, materiaId, profesorId, año, semestre, cupo) VALUES (?, ?, ?, ?, ?, ?)', c);
      });

      // Insertamos horarios — dependen de cursos (id 1,2,3)
      setTimeout(() => {
        const horarios = [
          [1, 'Lunes', '08:00', '10:00', 'Aula 101'],
          [1, 'Miercoles', '08:00', '10:00', 'Aula 101'],
          [2, 'Martes', '10:00', '12:00', 'Lab Sistemas'],
          [3, 'Jueves', '14:00', '16:00', 'Aula 203'],
        ];
        horarios.forEach(h => {
          db.run('INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES (?, ?, ?, ?, ?)', h);
        });

        // Insertamos inscripciones — dependen de estudiantes y cursos
        setTimeout(() => {
          const inscripciones = [
            [1, 1, '2025-02-01', 'activa'],
            [2, 1, '2025-02-01', 'activa'],
            [3, 2, '2025-02-03', 'activa'],
            [1, 3, '2025-02-05', 'finalizada'],
          ];
          inscripciones.forEach(i => {
            db.run('INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES (?, ?, ?, ?)', i);
          });

          // Insertamos notas — dependen de inscripciones (id 1,2,3,4)
          setTimeout(() => {
            const notas = [
              [1, 'parcial1', 4.2, '2025-03-15', 'Buen desempeño'],
              [1, 'parcial2', 3.8, '2025-04-20', null],
              [2, 'parcial1', 4.5, '2025-03-15', 'Excelente'],
              [3, 'final', 3.5, '2025-05-10', null],
              [4, 'final', 4.8, '2025-05-12', 'Aprobado con distinción'],
            ];
            notas.forEach(n => {
              db.run('INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES (?, ?, ?, ?, ?)', n);
            });
            console.log('Datos de prueba cargados correctamente');
          }, 200);
        }, 200);
      }, 200);
    }, 200);
  });
});

module.exports = db;