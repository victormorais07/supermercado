const express = require('express');
const usuarios = require('../repositories/usuarioRepository');
const { criarSessao, encerrarSessao, DURACAO } = require('../auth/sessoes');
const { conferirSenha } = require('../utils/senha');
const { validarUsuario } = require('../utils/validacao');
const { exigirLogin } = require('../middlewares/auth');

const router = express.Router();

function iniciarSessao(res, usuario) {
  const token = criarSessao(usuario.id);
  res.cookie('sessao', token, {
    httpOnly: true, // o js da página não consegue ler o cookie
    sameSite: 'lax',
    maxAge: DURACAO,
    path: '/'
  });
}

router.post('/login', (req, res) => {
  const login = String(req.body.usuario || '').trim();
  const senha = String(req.body.senha || '');

  const usuario = usuarios.buscarPorUsuario(login);
  if (!usuario || !conferirSenha(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  }

  iniciarSessao(res, usuario);
  res.json(usuarios.semSenha(usuario));
});

// cadastro aberto na tela de login, sempre cria como operador
router.post('/cadastro', (req, res) => {
  const dados = {
    nome: String(req.body.nome || '').trim(),
    usuario: String(req.body.usuario || '').trim().toLowerCase(),
    senha: String(req.body.senha || ''),
    perfil: 'operador'
  };

  const erros = validarUsuario(dados);
  if (usuarios.buscarPorUsuario(dados.usuario)) erros.push('Esse usuário já existe, escolha outro');
  if (erros.length) return res.status(400).json({ erros });

  const novo = usuarios.criar(dados);
  iniciarSessao(res, novo);
  res.status(201).json(usuarios.semSenha(novo));
});

router.post('/logout', (req, res) => {
  if (req.token) encerrarSessao(req.token);
  res.clearCookie('sessao', { path: '/' });
  res.status(204).end();
});

router.get('/eu', exigirLogin, (req, res) => {
  res.json(usuarios.semSenha(req.usuario));
});

module.exports = router;
