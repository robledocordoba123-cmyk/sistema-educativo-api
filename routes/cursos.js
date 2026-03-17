const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM cursos';
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
  db.get('SELECT * FROM cursos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { nombre, materiaId, profesorId, año, semestre, cupo } = req.body;
  if (!nombre || !materiaId || !profesorId || !año || !semestre || !cupo) {
    return res.status(400).json({ success: false, message: 'nombre, materiaId, profesorId, año, semestre y cupo son obligatorios' });
  }
  if (isNaN(cupo) || cupo <= 0) {
    return res.status(400).json({ success: false, message: 'cupo debe ser un número mayor a 0' });
  }
  if (![1, 2].includes(Number(semestre))) {
    return res.status(400).json({ success: false, message: 'semestre debe ser 1 o 2' });
  }
  db.get('SELECT id FROM materias WHERE id = ?', [materiaId], (err, materia) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!materia) return res.status(400).json({ success: false, message: 'La materia indicada no existe' });
    db.get('SELECT id FROM profesores WHERE id = ?', [profesorId], (err, profesor) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!profesor) return res.status(400).json({ success: false, message: 'El profesor indicado no existe' });
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

router.put('/:id', (req, res) => {
  db.get('SELECT id FROM cursos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    const { nombre, materiaId, profesorId, año, semestre, cupo } = req.body;
    if (!nombre || !materiaId || !profesorId || !año || !semestre || !cupo) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }
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