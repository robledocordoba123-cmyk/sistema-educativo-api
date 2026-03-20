const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todas las inscripciones con filtros opcionales
// Ejemplo: GET /inscripciones?estado=activa o GET /inscripciones?cursoId=1
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM inscripciones';
  const params = [];

  // Si llegan query params construimos el WHERE dinámicamente
  if (keys.length > 0) {
    query += ' WHERE ' + keys.map(k => `${k} LIKE ?`).join(' AND ');
    keys.forEach(k => params.push(`%${filtros[k]}%`));
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

// GET /:id — Obtener una inscripción por ID
// Responde 404 si la inscripción no existe
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM inscripciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripcion no encontrada' });
    res.json({ success: true, data: row });
  });
});

// POST / — Inscribir un estudiante en un curso
// Es una de las rutas más complejas porque verifica dos FK:
// que el estudiante exista Y que el curso exista, antes de crear la inscripción
router.post('/', (req, res) => {
  const { estudianteId, cursoId, fechaInscripcion, estado } = req.body;

  // Validación: campos obligatorios
  if (!estudianteId || !cursoId || !fechaInscripcion) {
    return res.status(400).json({ success: false, message: 'estudianteId, cursoId y fechaInscripcion son obligatorios' });
  }

  // Verificación FK 1: el estudiante debe existir
  db.get('SELECT id FROM estudiantes WHERE id = ?', [estudianteId], (err, estudiante) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!estudiante) return res.status(400).json({ success: false, message: 'El estudiante indicado no existe' });

    // Verificación FK 2: el curso debe existir
    db.get('SELECT id FROM cursos WHERE id = ?', [cursoId], (err, curso) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!curso) return res.status(400).json({ success: false, message: 'El curso indicado no existe' });

      // Ambos existen — creamos la inscripción
      // Si no mandan estado, por defecto queda en 'activa'
      db.run(
        'INSERT INTO inscripciones (estudianteId, cursoId, fechaInscripcion, estado) VALUES (?, ?, ?, ?)',
        [estudianteId, cursoId, fechaInscripcion, estado || 'activa'],
        function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: 'Inscripcion creada', id: this.lastID });
        }
      );
    });
  });
});

// PUT /:id — Actualizar una inscripción existente
// Verifica que la inscripción exista, que los campos sean válidos
// y que el estudiante y el curso referenciados existan (FK)
router.put('/:id', (req, res) => {
  // Primero verificamos que la inscripción existe
  db.get('SELECT id FROM inscripciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripcion no encontrada' });

    const { estudianteId, cursoId, fechaInscripcion, estado } = req.body;

    // Validación: campos obligatorios
    if (!estudianteId || !cursoId || !fechaInscripcion) {
      return res.status(400).json({ success: false, message: 'estudianteId, cursoId y fechaInscripcion son obligatorios' });
    }

    // Verificación FK 1: el estudiante debe existir
    db.get('SELECT id FROM estudiantes WHERE id = ?', [estudianteId], (err, estudiante) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!estudiante) return res.status(400).json({ success: false, message: 'El estudiante indicado no existe' });

      // Verificación FK 2: el curso debe existir
      db.get('SELECT id FROM cursos WHERE id = ?', [cursoId], (err, curso) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!curso) return res.status(400).json({ success: false, message: 'El curso indicado no existe' });

        // Todo válido — actualizamos la inscripción
        db.run(
          'UPDATE inscripciones SET estudianteId=?, cursoId=?, fechaInscripcion=?, estado=? WHERE id=?',
          [estudianteId, cursoId, fechaInscripcion, estado || 'activa', req.params.id],
          (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Inscripcion actualizada' });
          }
        );
      });
    });
  });
});

// DELETE /:id — Eliminar una inscripción
// Responde 404 si la inscripción no existe
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM inscripciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripcion no encontrada' });

    db.run('DELETE FROM inscripciones WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Inscripcion eliminada' });
    });
  });
});

module.exports = router;