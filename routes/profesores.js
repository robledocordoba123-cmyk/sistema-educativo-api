const express = require('express');
const router = express.Router();
const db = require('../db');

// GET / — Obtener todos los profesores
// Si mandan query params como ?especialidad=Matematicas filtramos por ese campo
router.get('/', (req, res) => {
  const filtros = req.query;
  const keys = Object.keys(filtros);
  let query = 'SELECT * FROM profesores';
  const params = [];

  // Construimos el WHERE dinámicamente con los filtros que lleguen
  // LIKE con %valor% permite búsqueda parcial, no tiene que coincidir exacto
  if (keys.length > 0) {
    query += ' WHERE ' + keys.map(k => `${k} LIKE ?`).join(' AND ');
    keys.forEach(k => params.push(`%${filtros[k]}%`));
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

// GET /:id — Obtener un profesor por ID
// Si no existe respondemos 404 con mensaje claro
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM profesores WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  });
});

// POST / — Crear un nuevo profesor
// Validaciones: campos obligatorios, formato de email, unicidad de email
router.post('/', (req, res) => {
  const { nombre, email, telefono, especialidad, activo } = req.body;

  // Validación 1: campos obligatorios
  if (!nombre || !email || !especialidad) {
    return res.status(400).json({ success: false, message: 'nombre, email y especialidad son obligatorios' });
  }

  // Validación 2: formato básico de email
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'email no es válido' });
  }

  // Validación 3: consultamos la BD para verificar que el email no esté repetido
  db.get('SELECT id FROM profesores WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (row) return res.status(400).json({ success: false, message: 'Ya existe un profesor con ese email' });

    // Todo válido — insertamos
    // .trim() elimina espacios innecesarios al inicio y al final
    db.run(
      'INSERT INTO profesores (nombre, email, telefono, especialidad, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), telefono || null, especialidad.trim(), activo !== undefined ? activo : 1],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        // 201 = recurso creado, this.lastID tiene el ID del nuevo registro
        res.status(201).json({ success: true, message: 'Profesor creado', id: this.lastID });
      }
    );
  });
});

// PUT /:id — Actualizar un profesor existente
router.put('/:id', (req, res) => {
  // Verificamos que existe antes de intentar actualizar
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

// DELETE /:id — Eliminar un profesor
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