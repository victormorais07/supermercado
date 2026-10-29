const express = require('express');
const produtos = require('../repositories/produtoRepository');
const categorias = require('../repositories/categoriaRepository');
const movimentacoes = require('../repositories/movimentacaoRepository');
const { validarProduto } = require('../utils/validacao');
const { normalizar } = require('../utils/helpers');

const router = express.Router();

function numero(valor, padrao) {
  if (valor === undefined || valor === null || valor === '') return padrao;
  return Number(String(valor).replace(',', '.'));
}

// pega só os campos que interessam do body
function lerDados(body) {
  return {
    codigo_barras: String(body.codigo_barras || '').trim(),
    nome: String(body.nome || '').trim(),
    categoria_id: Number(body.categoria_id),
    preco: numero(body.preco, NaN),
    estoque: numero(body.estoque, 0),
    estoque_minimo: numero(body.estoque_minimo, 0),
    unidade: String(body.unidade || 'UN').toUpperCase(),
    imagem: String(body.imagem || '').trim()
  };
}

function idsCategorias() {
  return categorias.listar().map(c => c.id);
}

// GET /api/produtos?busca=arroz&categoria=1&estoqueBaixo=1&ordem=preco
router.get('/', (req, res) => {
  const { busca, categoria, estoqueBaixo, ordem } = req.query;
  let lista = produtos.listar().filter(p => p.ativo);

  if (busca) {
    const termo = normalizar(busca);
    lista = lista.filter(p =>
      normalizar(p.nome).includes(termo) || p.codigo_barras.includes(busca.trim())
    );
  }
  if (categoria) {
    lista = lista.filter(p => p.categoria_id === Number(categoria));
  }
  if (estoqueBaixo === '1') {
    lista = lista.filter(p => p.estoque <= p.estoque_minimo);
  }

  const ordenacoes = {
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
    preco: (a, b) => a.preco - b.preco,
    estoque: (a, b) => a.estoque - b.estoque
  };
  lista.sort(ordenacoes[ordem] || ordenacoes.nome);

  // já manda o nome da categoria junto pro front não ter que cruzar
  const nomes = Object.fromEntries(categorias.listar().map(c => [c.id, c.nome]));
  res.json(lista.map(p => ({ ...p, categoria: nomes[p.categoria_id] || '-' })));
});

router.get('/codigo/:codigo', (req, res) => {
  const produto = produtos.buscarPorCodigo(req.params.codigo);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
});

router.get('/:id', (req, res) => {
  const produto = produtos.buscarPorId(req.params.id);
  if (!produto || !produto.ativo) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
});

router.post('/', (req, res) => {
  const dados = lerDados(req.body);
  const erros = validarProduto(dados, idsCategorias());

  if (dados.codigo_barras && produtos.buscarPorCodigo(dados.codigo_barras)) {
    erros.push('Já existe um produto com esse código de barras');
  }
  if (erros.length) return res.status(400).json({ erros });

  const novo = produtos.criar(dados);
  if (novo.estoque > 0) {
    movimentacoes.registrar([
      { produto_id: novo.id, tipo: 'entrada', quantidade: novo.estoque, observacao: 'Estoque inicial' }
    ]);
  }
  res.status(201).json(novo);
});

router.put('/:id', (req, res) => {
  const atual = produtos.buscarPorId(req.params.id);
  if (!atual || !atual.ativo) return res.status(404).json({ erro: 'Produto não encontrado' });

  const dados = lerDados(req.body);
  // estoque não muda por aqui, só pela movimentação
  dados.estoque = atual.estoque;

  const erros = validarProduto(dados, idsCategorias());
  const mesmoCodigo = produtos.buscarPorCodigo(dados.codigo_barras);
  if (mesmoCodigo && mesmoCodigo.id !== atual.id) {
    erros.push('Já existe outro produto com esse código de barras');
  }
  if (erros.length) return res.status(400).json({ erros });

  res.json(produtos.atualizar(atual.id, dados));
});

// não apaga de verdade pra não quebrar o histórico das vendas antigas
router.delete('/:id', (req, res) => {
  const produto = produtos.buscarPorId(req.params.id);
  if (!produto || !produto.ativo) return res.status(404).json({ erro: 'Produto não encontrado' });

  produtos.atualizar(produto.id, { ativo: false });
  res.status(204).end();
});

router.get('/:id/movimentacoes', (req, res) => {
  res.json(movimentacoes.listarPorProduto(req.params.id).slice(0, 30));
});

// entrada (reposição) ou saída (perda, quebra, vencido)
router.post('/:id/estoque', (req, res) => {
  const produto = produtos.buscarPorId(req.params.id);
  if (!produto || !produto.ativo) return res.status(404).json({ erro: 'Produto não encontrado' });

  const { tipo } = req.body;
  const quantidade = numero(req.body.quantidade, NaN);
  const observacao = String(req.body.observacao || '').trim().slice(0, 100);

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo de movimentação inválido' });
  }
  if (!(quantidade > 0)) {
    return res.status(400).json({ erro: 'Informe uma quantidade maior que zero' });
  }
  if (produto.unidade !== 'KG' && !Number.isInteger(quantidade)) {
    return res.status(400).json({ erro: 'Esse produto só aceita quantidade inteira' });
  }

  const ajuste = tipo === 'entrada' ? quantidade : -quantidade;
  if (produto.estoque + ajuste < 0) {
    return res.status(400).json({ erro: `Não dá pra tirar ${quantidade}, só tem ${produto.estoque} no estoque` });
  }

  produtos.ajustarEstoque([{ id: produto.id, quantidade: ajuste }]);
  movimentacoes.registrar([{ produto_id: produto.id, tipo, quantidade, observacao }]);

  res.json(produtos.buscarPorId(produto.id));
});

module.exports = router;
