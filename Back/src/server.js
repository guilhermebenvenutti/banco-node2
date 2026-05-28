const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS do frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/contas', require('./routes/contas'));
app.use('/api/transacoes', require('./routes/transacoes'));

// Rota inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});