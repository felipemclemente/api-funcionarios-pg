const express = require('express');
require('dotenv').config();

const funcionarioRoutes = require('./routes/funcionarioRoutes');

const app = express();
app.use(express.json());

app.use(funcionarioRoutes);

app.get('/', (req, res) => {
  res.send('API de Funcionários rodando 🚀');
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});