const express = require('express');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());

// front e imagens ficam em pastas separadas, cada uma servida no seu caminho
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/imagens', express.static(path.join(__dirname, '..', 'imagens')));

app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/vendas', require('./routes/vendas'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/imagens', require('./routes/imagens'));

app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor' });
});

app.listen(PORTA, () => {
  console.log(`Supermercado rodando em http://localhost:${PORTA}`);
});
