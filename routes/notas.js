const express = require('express');
const router = express.Router();
const db = require('../db');

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

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM notas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { inscripcionId, tipo, valor, fecha, observacion } = req.body;
  if (!inscripcionId || !tipo || valor === undefined || !fecha) {
    return res.status(400).json({ success: false, message: 'inscripcionId, tipo, valor y fecha son obligatorios' });
  }
  if (isNaN(valor) || valor < 0 || valor > 5) {
    return res.status(400).json({ success: false, message: 'valor debe ser un número entre 0 y 5' });
  }
  const tiposValidos = ['parcial1','parcial2','final','taller','proyecto'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ success: false, message: 'tipo debe ser: parcial1, parcial2, final, taller o proyecto' });
  }
  db.get('SELECT id FROM inscripciones WHERE id = ?', [inscripcionId], (err, inscripcion) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!inscripcion) return res.status(400).json({ success: false, message: 'La inscripcion indicada no existe' });
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