const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todas las materias, con filtros opcionales
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM materias';
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

// GET /:id — Obtener una materia por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM materias WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear una materia
// Validaciones: campos obligatorios, rango de créditos, unicidad de nombre y código
router.post('/', (req, res) => {
  const { nombre, codigo, creditos, descripcion } = req.body;

  if (!nombre || !codigo || !creditos) {
    return res.status(400).json({ success: false, message: 'nombre, codigo y creditos son obligatorios' });
  }

  // Los créditos deben ser un número entre 1 y 10
  if (isNaN(creditos) || creditos <= 0 || creditos > 10) {
    return res.status(400).json({ success: false, message: 'creditos debe ser un número entre 1 y 10' });
  }

  // Verificamos unicidad de nombre Y código en una sola consulta
  db.get('SELECT id FROM materias WHERE codigo = ? OR nombre = ?', [codigo, nombre], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (row) return res.status(400).json({ success: false, message: 'Ya existe una materia con ese nombre o código' });

    // .toUpperCase() normaliza el código (ej: mat101 → MAT101)
    db.run(
      'INSERT INTO materias (nombre, codigo, creditos, descripcion) VALUES (?, ?, ?, ?)',
      [nombre.trim(), codigo.trim().toUpperCase(), Number(creditos), descripcion || null],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Materia creada', id: this.lastID });
      }
    );
  });
});

// PUT /:id — Actualizar una materia existente
router.put('/:id', (req, res) => {
  db.get('SELECT id FROM materias WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Materia no encontrada' });

    const { nombre, codigo, creditos, descripcion } = req.body;

    if (!nombre || !codigo || !creditos) {
      return res.status(400).json({ success: false, message: 'nombre, codigo y creditos son obligatorios' });
    }

    if (isNaN(creditos) || creditos <= 0 || creditos > 10) {
      return res.status(400).json({ success: false, message: 'creditos debe ser un número entre 1 y 10' });
    }

    db.run(
      'UPDATE materias SET nombre=?, codigo=?, creditos=?, descripcion=? WHERE id=?',
      [nombre.trim(), codigo.trim().toUpperCase(), Number(creditos), descripcion || null, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Materia actualizada' });
      }
    );
  });
});

// DELETE /:id — Eliminar una materia
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM materias WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Materia no encontrada' });

    db.run('DELETE FROM materias WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Materia eliminada' });
    });
  });
});

module.exports = router;