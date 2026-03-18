const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todos los horarios con filtros opcionales
// Ejemplo: GET /horarios?dia=Lunes
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM horarios';
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

// GET /:id — Obtener un horario por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM horarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear un horario para un curso
// Validaciones: campos obligatorios, día válido, y verificar que el curso existe
router.post('/', (req, res) => {
  const { cursoId, dia, horaInicio, horaFin, salon } = req.body;

  if (!cursoId || !dia || !horaInicio || !horaFin || !salon) {
    return res.status(400).json({ success: false, message: 'cursoId, dia, horaInicio, horaFin y salon son obligatorios' });
  }

  // El día solo puede ser uno de estos valores
  const diasValidos = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  if (!diasValidos.includes(dia)) {
    return res.status(400).json({ success: false, message: 'dia debe ser: Lunes, Martes, Miercoles, Jueves, Viernes o Sabado' });
  }

  // Verificamos que el curso existe antes de asignarle un horario
  db.get('SELECT id FROM cursos WHERE id = ?', [cursoId], (err, curso) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!curso) return res.status(400).json({ success: false, message: 'El curso indicado no existe' });

    db.run(
      'INSERT INTO horarios (cursoId, dia, horaInicio, horaFin, salon) VALUES (?, ?, ?, ?, ?)',
      [cursoId, dia, horaInicio, horaFin, salon.trim()],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Horario creado', id: this.lastID });
      }
    );
  });
});

// PUT /:id — Actualizar un horario existente
router.put('/:id', (req, res) => {
  db.get('SELECT id FROM horarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Horario no encontrado' });

    const { cursoId, dia, horaInicio, horaFin, salon } = req.body;

    if (!cursoId || !dia || !horaInicio || !horaFin || !salon) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    db.run(
      'UPDATE horarios SET cursoId=?, dia=?, horaInicio=?, horaFin=?, salon=? WHERE id=?',
      [cursoId, dia, horaInicio, horaFin, salon.trim(), req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Horario actualizado' });
      }
    );
  });
});

// DELETE /:id — Eliminar un horario
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM horarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Horario no encontrado' });

    db.run('DELETE FROM horarios WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Horario eliminado' });
    });
  });
});

module.exports = router;