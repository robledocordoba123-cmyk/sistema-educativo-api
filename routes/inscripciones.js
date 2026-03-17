const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM inscripciones';
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

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM inscripciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripcion no encontrada' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { estudianteId, cursoId, fechaInscripcion, estado } = req.body;
  if (!estudianteId || !cursoId || !fechaInscripcion) {
    return res.status(400).json({ success: false, message: 'estudianteId, cursoId y fechaInscripcion son obligatorios' });
  }
  db.get('SELECT id FROM estudiantes WHERE id = ?', [estudianteId], (err, estudiante) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!estudiante) return res.status(400).json({ success: false, message: 'El estudiante indicado no existe' });
    db.get('SELECT id FROM cursos WHERE id = ?', [cursoId], (err, curso) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!curso) return res.status(400).json({ success: false, message: 'El curso indicado no existe' });
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

router.put('/:id', (req, res) => {
  db.get('SELECT id FROM inscripciones WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripcion no encontrada' });
    const { estudianteId, cursoId, fechaInscripcion, estado } = req.body;
    if (!estudianteId || !cursoId || !fechaInscripcion) {
      return res.status(400).json({ success: false, message: 'estudianteId, cursoId y fechaInscripcion son obligatorios' });
    }
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