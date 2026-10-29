const express = require('express');
const categorias = require('../repositories/categoriaRepository');
const produtos = require('../repositories/produtoRepository');
const { normalizar } = require('../utils/helpers');

const router = express.Router();

function nomeRepetido(nome, ignorarId) {
  return categorias.listar().some(c => c.id !== ignorarId && normalizar(c.nome) === normalizar(nome));
}

router.get('/', (req, res) => {
  const ativos = produtos.listar().filter(p => p.ativo);
  const lista = categorias.listar().map(c => ({
    ...c,
    total_produtos: ativos.filter(p => p.categoria_id === c.id).length
  }));
  lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  res.json(lista);
});

router.post('/', (req, res) => {
  const nome = String(req.body.nome || '').trim();
  if (nome.length < 2) return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
  if (nomeRepetido(nome)) return res.status(400).json({ erro: 'Essa categoria já existe' });

  res.status(201).json(categorias.criar(nome));
});

router.put('/:id', (req, res) => {
  const nome = String(req.body.nome || '').trim();
  if (nome.length < 2) return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
  if (nomeRepetido(nome, Number(req.params.id))) return res.status(400).json({ erro: 'Essa categoria já existe' });

  const categoria = categorias.atualizar(req.params.id, nome);
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.json(categoria);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const emUso = produtos.listar().some(p => p.ativo && p.categoria_id === id);
  if (emUso) {
    return res.status(400).json({ erro: 'Tem produtos nessa categoria, mude eles de categoria antes de excluir' });
  }
  if (!categorias.remover(id)) return res.status(404).json({ erro: 'Categoria não encontrada' });
  res.status(204).end();
});

module.exports = router;
