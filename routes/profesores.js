const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM profesores';
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
  db.get('SELECT * FROM profesores WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { nombre, email, telefono, especialidad, activo } = req.body;
  if (!nombre || !email || !especialidad) {
    return res.status(400).json({ success: false, message: 'nombre, email y especialidad son obligatorios' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'email no es válido' });
  }
  db.get('SELECT id FROM profesores WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (row) return res.status(400).json({ success: false, message: 'Ya existe un profesor con ese email' });
    db.run(
      'INSERT INTO profesores (nombre, email, telefono, especialidad, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), telefono || null, especialidad.trim(), activo !== undefined ? activo : 1],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Profesor creado', id: this.lastID });
      }
    );
  });
});

router.put('/:id', (req, res) => {
  db.get('SELECT id FROM profesores WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    const { nombre, email, telefono, especialidad, activo } = req.body;
    if (!nombre || !email || !especialidad) {
      return res.status(400).json({ success: false, message: 'nombre, email y especialidad son obligatorios' });
    }
    db.run(
      'UPDATE profesores SET nombre=?, email=?, telefono=?, especialidad=?, activo=? WHERE id=?',
      [nombre.trim(), email.trim(), telefono || null, especialidad.trim(), activo !== undefined ? activo : 1, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Profesor actualizado' });
      }
    );
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM profesores WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    db.run('DELETE FROM profesores WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Profesor eliminado' });
    });
  });
});

module.exports = router;