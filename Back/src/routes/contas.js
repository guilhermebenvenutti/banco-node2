const express = require('express');
const pool = require('../db');
const router = express.Router();

// Criar conta para um usuário
router.post('/', async (req, res) => {
  const { usuario_id } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO contas (usuario_id) VALUES ($1) RETURNING *',
      [usuario_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver saldo da conta buscando pelo ID do USUÁRIO
router.get('/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await pool.query('SELECT id, saldo FROM contas WHERE usuario_id = $1', [usuario_id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Conta não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});


// Buscar o cartão da conta
router.get('/cartao/:conta_id', async (req, res) => {
    const { conta_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM cartoes WHERE conta_id = $1', [conta_id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Cartão não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});


module.exports = router;