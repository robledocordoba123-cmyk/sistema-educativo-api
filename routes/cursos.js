const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todos los cursos con filtros opcionales
// Ejemplo: GET /cursos?semestre=1 o GET /cursos?nombre=Calculo
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM cursos';
  const params = [];

  // Si llegan query params, construimos el WHERE dinámicamente
  if (keys.length > 0) {
    query += ' WHERE ' + keys.map(k => `${k} LIKE ?`).join(' AND ');
    keys.forEach(k => params.push(`%${filtros[k]}%`));
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

// GET /:id — Obtener un curso por ID
// Responde 404 si el curso no existe
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM cursos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear un nuevo curso
// Validaciones: campos obligatorios, cupo positivo, semestre 1 o 2
// FK: verifica que la materia y el profesor existan antes de insertar
router.post('/', (req, res) => {
  const { nombre, materiaId, profesorId, año, semestre, cupo } = req.body;

  // Validación 1: todos los campos son obligatorios
  if (!nombre || !materiaId || !profesorId || !año || !semestre || !cupo) {
    return res.status(400).json({ success: false, message: 'nombre, materiaId, profesorId, año, semestre y cupo son obligatorios' });
  }

  // Validación 2: cupo debe ser número positivo
  if (isNaN(cupo) || cupo <= 0) {
    return res.status(400).json({ success: false, message: 'cupo debe ser un número mayor a 0' });
  }

  // Validación 3: semestre solo puede ser 1 o 2
  if (![1, 2].includes(Number(semestre))) {
    return res.status(400).json({ success: false, message: 'semestre debe ser 1 o 2' });
  }

  // Verificación FK 1: la materia debe existir
  db.get('SELECT id FROM materias WHERE id = ?', [materiaId], (err, materia) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!materia) return res.status(400).json({ success: false, message: 'La materia indicada no existe' });

    // Verificación FK 2: el profesor debe existir
    db.get('SELECT id FROM profesores WHERE id = ?', [profesorId], (err, profesor) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!profesor) return res.status(400).json({ success: false, message: 'El profesor indicado no existe' });

      // Todo válido — insertamos el curso
      db.run(
        'INSERT INTO cursos (nombre, materiaId, profesorId, año, semestre, cupo) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre.trim(), materiaId, profesorId, Number(año), Number(semestre), Number(cupo)],
        function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: 'Curso creado', id: this.lastID });
        }
      );
    });
  });
});

// PUT /:id — Actualizar un curso existente
// Verifica que el curso exista, que los campos sean válidos
// y que la materia y el profesor referenciados existan (FK)
router.put('/:id', (req, res) => {
  // Primero verificamos que el curso existe
  db.get('SELECT id FROM cursos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });

    const { nombre, materiaId, profesorId, año, semestre, cupo } = req.body;

    // Validación: todos los campos son obligatorios
    if (!nombre || !materiaId || !profesorId || !año || !semestre || !cupo) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Verificación FK 1: la materia debe existir
    db.get('SELECT id FROM materias WHERE id = ?', [materiaId], (err, materia) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!materia) return res.status(400).json({ success: false, message: 'La materia indicada no existe' });

      // Verificación FK 2: el profesor debe existir
      db.get('SELECT id FROM profesores WHERE id = ?', [profesorId], (err, profesor) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!profesor) return res.status(400).json({ success: false, message: 'El profesor indicado no existe' });

        // Todo válido — actualizamos el curso
        db.run(
          'UPDATE cursos SET nombre=?, materiaId=?, profesorId=?, año=?, semestre=?, cupo=? WHERE id=?',
          [nombre.trim(), materiaId, profesorId, Number(año), Number(semestre), Number(cupo), req.params.id],
          (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Curso actualizado' });
          }
        );
      });
    });
  });
});

// DELETE /:id — Eliminar un curso
// Responde 404 si el curso no existe
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM cursos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });

    db.run('DELETE FROM cursos WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Curso eliminado' });
    });
  });
});

module.exports = router;