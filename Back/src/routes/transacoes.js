const express = require('express');
const pool = require('../db');
const router = express.Router();

// Realizar PIX (Transferência via CPF)
router.post('/transferir', async (req, res) => {
    // Agora recebemos o cpf_destino do Frontend
    const { conta_origem, cpf_destino, valor, descricao } = req.body;
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN');

       // 1. MÁGICA: Achar o ID e o NOME da conta de destino usando o CPF
        const resultDestino = await client.query(`
            SELECT c.id, u.nome 
            FROM contas c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE u.cpf = $1 FOR UPDATE
        `, [cpf_destino]);

        if (resultDestino.rows.length === 0) {
            throw new Error('Não encontramos nenhuma conta vinculada a este CPF.');
        }
        
        const conta_destino = resultDestino.rows[0].id; // Achamos o ID!

        // 2. Trava de segurança extra
        if (conta_origem === conta_destino) {
            throw new Error('Você não pode fazer um PIX para si mesmo.');
        }

        // 3. Verifica saldo da origem
        const resultOrigem = await client.query('SELECT saldo FROM contas WHERE id = $1 FOR UPDATE', [conta_origem]);
        if (resultOrigem.rows.length === 0) throw new Error('Sua conta não foi encontrada.');
        if (parseFloat(resultOrigem.rows[0].saldo) < valor) throw new Error('Saldo insuficiente para este PIX.');

        // 4. Tira o dinheiro da origem
        await client.query('UPDATE contas SET saldo = saldo - $1 WHERE id = $2', [valor, conta_origem]);

        // 5. Coloca o dinheiro no destino
        await client.query('UPDATE contas SET saldo = saldo + $1 WHERE id = $2', [valor, conta_destino]);

        // 6. Salva o extrato com o tipo PIX
        await client.query(
            'INSERT INTO transacoes (conta_origem, conta_destino, valor, descricao, tipo) VALUES ($1, $2, $3, $4, $5)',
            [conta_origem, conta_destino, valor, descricao || 'PIX enviado', 'TRANSFERENCIA']
        );

        await client.query('COMMIT');
// Retorna os dados para montar o PDF no Front-end
        res.json({ 
            mensagem: 'PIX realizado com sucesso!',
            comprovante: {
                id: Math.floor(Math.random() * 1000000000), // Gera um ID único fictício
                data: new Date().toLocaleString('pt-BR'),
                valor: valor,
                destino: resultDestino.rows[0].nome,
                cpf: cpf_destino
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ erro: err.message });
    } finally {
        client.release();
    }
});


// Ver histórico de transações de uma conta
router.get('/historico/:conta_id', async (req, res) => {
  const { conta_id } = req.params;
  try {
    // Busca transações onde a conta enviou OU recebeu dinheiro, ordenado da mais nova para a mais velha
    const result = await pool.query(`
      SELECT * FROM transacoes 
      WHERE conta_origem = $1 OR conta_destino = $1 
      ORDER BY data DESC LIMIT 10
    `, [conta_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;