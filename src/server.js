const express = require('express');
const path = require('path');
const usuarios = require('./repositories/usuarioRepository');
const { carregarUsuario, exigirLogin, exigirAdmin, protegerPaginas } = require('./middlewares/auth');

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(carregarUsuario);

// sem login só abre a tela de login e de cadastro
app.use(protegerPaginas);

// front e imagens ficam em pastas separadas, cada uma servida no seu caminho
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/imagens', express.static(path.join(__dirname, '..', 'imagens')));

app.use('/api/auth', require('./routes/auth'));

// daqui pra baixo a api só funciona logado
app.use('/api', exigirLogin);
app.use('/api/usuarios', exigirAdmin, require('./routes/usuarios'));
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

usuarios.garantirAdmin();

app.listen(PORTA, () => {
  console.log(`Supermercado rodando em http://localhost:${PORTA}`);
});
