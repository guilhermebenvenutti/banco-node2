const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();

// Cadastro de usuário, criação de conta e geração do Cartão de Débito
router.post('/register', async (req, res) => {
  const { nome, cpf, senha } = req.body;
  const client = await pool.connect(); 

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    await client.query('BEGIN'); 

    // 1. Cria o usuário
    const resultUser = await client.query(
      'INSERT INTO usuarios (nome, cpf, senha) VALUES ($1, $2, $3) RETURNING id, nome, cpf',
      [nome, cpf, hashedSenha]
    );
    const novoUsuario = resultUser.rows[0];

    // 2. Cria a conta bancária zerada e pega o ID da conta gerada
    const resultConta = await client.query(
      'INSERT INTO contas (usuario_id, saldo) VALUES ($1, $2) RETURNING id',
      [novoUsuario.id, 0.00]
    );
    const novaConta = resultConta.rows[0];

    // 3. Fabrica o Cartão de Débito (Gerador de dados aleatórios)
    // Gera 16 números
    let numeroCartao = '';
    for(let i=0; i<16; i++) numeroCartao += Math.floor(Math.random() * 10).toString();
    // Gera CVV de 3 números
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    // Validade para daqui a 5 anos
    const dataAtual = new Date();
    const validade = String(dataAtual.getMonth() + 1).padStart(2, '0') + '/' + String(dataAtual.getFullYear() + 5).slice(-2);

    await client.query(
      'INSERT INTO cartoes (conta_id, numero, nome_impresso, validade, cvv) VALUES ($1, $2, $3, $4, $5)',
      [novaConta.id, numeroCartao, nome.toUpperCase(), validade, cvv]
    );

    await client.query('COMMIT'); 
    res.status(201).json({ mensagem: 'Usuário, conta e cartão criados com sucesso', usuario: novoUsuario });

  } catch (err) {
    await client.query('ROLLBACK'); 
    console.error("### ERRO REAL DO BANCO ###", err);
    if (err.code === '23505') return res.status(400).json({ erro: 'CPF já cadastrado' });
    res.status(500).json({ erro: err.message });
  } finally {
    client.release();
  }
});


// Login
router.post('/login', async (req, res) => {
  const { cpf, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE cpf = $1', [cpf]);

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'CPF ou senha inválidos' });
    }

    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'CPF ou senha inválidos' });
    }

    res.json({
      mensagem: 'Login realizado com sucesso',
      usuario: { id: usuario.id, nome: usuario.nome, cpf: usuario.cpf }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;