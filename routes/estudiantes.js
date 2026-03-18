const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todos los estudiantes con filtros opcionales
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM estudiantes';
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

// GET /:id — Obtener un estudiante por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM estudiantes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear un estudiante
// Validaciones: campos obligatorios, formato de email, unicidad de email y documento
router.post('/', (req, res) => {
  const { nombre, email, documento, telefono, activo } = req.body;

  if (!nombre || !email || !documento) {
    return res.status(400).json({ success: false, message: 'nombre, email y documento son obligatorios' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'email no es válido' });
  }

  // Verificamos email Y documento juntos — cualquiera repetido se rechaza
  db.get('SELECT id FROM estudiantes WHERE email = ? OR documento = ?', [email, documento], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (row) return res.status(400).json({ success: false, message: 'Ya existe un estudiante con ese email o documento' });

    db.run(
      'INSERT INTO estudiantes (nombre, email, documento, telefono, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), documento.trim(), telefono || null, activo !== undefined ? activo : 1],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Estudiante creado', id: this.lastID });
      }
    );
  });
});

// PUT /:id — Actualizar un estudiante existente
router.put('/:id', (req, res) => {
  db.get('SELECT id FROM estudiantes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });

    const { nombre, email, documento, telefono, activo } = req.body;

    if (!nombre || !email || !documento) {
      return res.status(400).json({ success: false, message: 'nombre, email y documento son obligatorios' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'email no es válido' });
    }

    db.run(
      'UPDATE estudiantes SET nombre=?, email=?, documento=?, telefono=?, activo=? WHERE id=?',
      [nombre.trim(), email.trim(), documento.trim(), telefono || null, activo !== undefined ? activo : 1, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Estudiante actualizado' });
      }
    );
  });
});

// DELETE /:id — Eliminar un estudiante
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM estudiantes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });

    db.run('DELETE FROM estudiantes WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Estudiante eliminado' });
    });
  });
});

module.exports = router;