const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todas las notas con filtros opcionales
// Ejemplo: GET /notas?tipo=final o GET /notas?inscripcionId=3
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM notas';
  const params = [];

  if (keys.length > 0) {
    query += ' WHERE ' + keys.map(k => `${k} LIKE ?`).join(' AND ');
    keys.forEach(k => params.push(`%${filtros[k]}%`));
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

// GET /:id — Obtener una nota por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM notas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear una nota para una inscripción
// Tiene las validaciones más completas del proyecto:
// 1. Campos obligatorios
// 2. valor entre 0 y 5 — usamos valor === undefined porque 0 es válido
// 3. tipo debe ser uno de los 5 permitidos
// 4. Verificación FK: la inscripción debe existir
router.post('/', (req, res) => {
  const { inscripcionId, tipo, valor, fecha, observacion } = req.body;

  // Nota: no podemos usar !valor porque 0 es una nota válida
  if (!inscripcionId || !tipo || valor === undefined || !fecha) {
    return res.status(400).json({ success: false, message: 'inscripcionId, tipo, valor y fecha son obligatorios' });
  }

  // isNaN() detecta si no es un número (por ejemplo si mandaron texto)
  if (isNaN(valor) || valor < 0 || valor > 5) {
    return res.status(400).json({ success: false, message: 'valor debe ser un número entre 0 y 5' });
  }

  const tiposValidos = ['parcial1', 'parcial2', 'final', 'taller', 'proyecto'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ success: false, message: 'tipo debe ser: parcial1, parcial2, final, taller o proyecto' });
  }

  // Verificamos que la inscripción existe antes de crear la nota
  db.get('SELECT id FROM inscripciones WHERE id = ?', [inscripcionId], (err, inscripcion) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!inscripcion) return res.status(400).json({ success: false, message: 'La inscripcion indicada no existe' });

    // observacion es opcional, si no viene se guarda como NULL
    db.run(
      'INSERT INTO notas (inscripcionId, tipo, valor, fecha, observacion) VALUES (?, ?, ?, ?, ?)',
      [inscripcionId, tipo, Number(valor), fecha, observacion || null],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Nota creada', id: this.lastID });
      }
    );
  });
});

// PUT /:id — Actualizar una nota existente
router.put('/:id', (req, res) => {
  db.get('SELECT id FROM notas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });

    const { inscripcionId, tipo, valor, fecha, observacion } = req.body;

    if (!inscripcionId || !tipo || valor === undefined || !fecha) {
      return res.status(400).json({ success: false, message: 'inscripcionId, tipo, valor y fecha son obligatorios' });
    }

    if (isNaN(valor) || valor < 0 || valor > 5) {
      return res.status(400).json({ success: false, message: 'valor debe ser un número entre 0 y 5' });
    }

    db.run(
      'UPDATE notas SET inscripcionId=?, tipo=?, valor=?, fecha=?, observacion=? WHERE id=?',
      [inscripcionId, tipo, Number(valor), fecha, observacion || null, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Nota actualizada' });
      }
    );
  });
});

// DELETE /:id — Eliminar una nota
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM notas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });

    db.run('DELETE FROM notas WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Nota eliminada' });
    });
  });
});

module.exports = router;