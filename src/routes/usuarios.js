const express = require('express');
const usuarios = require('../repositories/usuarioRepository');
const { encerrarSessoesDoUsuario } = require('../auth/sessoes');
const { validarUsuario } = require('../utils/validacao');

// todas essas rotas só o admin acessa (ver server.js)
const router = express.Router();

router.get('/', (req, res) => {
  const lista = usuarios.listar()
    .map(usuarios.semSenha)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  res.json(lista);
});

router.post('/', (req, res) => {
  const dados = {
    nome: String(req.body.nome || '').trim(),
    usuario: String(req.body.usuario || '').trim().toLowerCase(),
    senha: String(req.body.senha || ''),
    perfil: req.body.perfil === 'admin' ? 'admin' : 'operador'
  };

  const erros = validarUsuario(dados);
  if (usuarios.buscarPorUsuario(dados.usuario)) erros.push('Esse usuário já existe');
  if (erros.length) return res.status(400).json({ erros });

  res.status(201).json(usuarios.semSenha(usuarios.criar(dados)));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  // se o admin pudesse se apagar podia ficar sem nenhum admin no sistema
  if (id === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode remover a sua própria conta' });
  }
  if (!usuarios.remover(id)) return res.status(404).json({ erro: 'Usuário não encontrado' });

  encerrarSessoesDoUsuario(id);
  res.status(204).end();
});

module.exports = router;
