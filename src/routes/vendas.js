const express = require('express');
const vendas = require('../repositories/vendaRepository');
const produtos = require('../repositories/produtoRepository');
const movimentacoes = require('../repositories/movimentacaoRepository');
const { agora, arredondar } = require('../utils/helpers');

const router = express.Router();

const FORMAS_PAGAMENTO = ['dinheiro', 'debito', 'credito', 'pix'];

// GET /api/vendas?de=2026-10-01&ate=2026-10-31&status=concluida
router.get('/', (req, res) => {
  const { de, ate, status } = req.query;
  let lista = vendas.listar();

  if (de) lista = lista.filter(v => v.data.slice(0, 10) >= de);
  if (ate) lista = lista.filter(v => v.data.slice(0, 10) <= ate);
  if (status) lista = lista.filter(v => v.status === status);

  const qtdItens = {};
  for (const item of vendas.listarItens()) {
    qtdItens[item.venda_id] = (qtdItens[item.venda_id] || 0) + 1;
  }

  lista.sort((a, b) => b.id - a.id);
  res.json(lista.map(v => ({ ...v, qtd_itens: qtdItens[v.id] || 0 })));
});

router.get('/:id', (req, res) => {
  const venda = vendas.buscarPorId(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
  res.json(venda);
});

router.post('/', (req, res) => {
  const { itens, forma_pagamento } = req.body;

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'A venda precisa ter pelo menos um item' });
  }
  if (!FORMAS_PAGAMENTO.includes(forma_pagamento)) {
    return res.status(400).json({ erro: 'Forma de pagamento inválida' });
  }

  // junta itens repetidos (passou o mesmo produto duas vezes no caixa)
  const quantidades = new Map();
  for (const item of itens) {
    const id = Number(item.produto_id);
    const qtd = Number(item.quantidade);
    if (!(qtd > 0)) return res.status(400).json({ erro: 'Quantidade inválida' });
    quantidades.set(id, (quantidades.get(id) || 0) + qtd);
  }

  const todos = produtos.listar();
  const itensVenda = [];

  for (const [id, qtdBruta] of quantidades) {
    const qtd = arredondar(qtdBruta, 3);
    const produto = todos.find(p => p.id === id && p.ativo);
    if (!produto) {
      return res.status(400).json({ erro: `Produto ${id} não encontrado` });
    }
    if (produto.unidade !== 'KG' && !Number.isInteger(qtd)) {
      return res.status(400).json({ erro: `${produto.nome} é vendido por unidade` });
    }
    if (qtd > produto.estoque) {
      return res.status(400).json({ erro: `Estoque insuficiente de ${produto.nome} (tem ${produto.estoque})` });
    }
    itensVenda.push({
      produto_id: produto.id,
      nome_produto: produto.nome,
      quantidade: qtd,
      preco_unitario: produto.preco,
      subtotal: arredondar(produto.preco * qtd)
    });
  }

  const total = arredondar(itensVenda.reduce((soma, i) => soma + i.subtotal, 0));
  let valorRecebido = total;
  let troco = 0;

  if (forma_pagamento === 'dinheiro') {
    valorRecebido = Number(req.body.valor_recebido);
    if (!(valorRecebido >= total)) {
      return res.status(400).json({ erro: 'Valor recebido é menor que o total da compra' });
    }
    troco = arredondar(valorRecebido - total);
  }

  const venda = vendas.criar({
    data: agora(),
    total,
    forma_pagamento,
    valor_recebido: valorRecebido,
    troco,
    status: 'concluida'
  }, itensVenda);

  produtos.ajustarEstoque(itensVenda.map(i => ({ id: i.produto_id, quantidade: -i.quantidade })));
  movimentacoes.registrar(itensVenda.map(i => ({
    produto_id: i.produto_id,
    tipo: 'venda',
    quantidade: i.quantidade,
    observacao: `Venda #${venda.id}`
  })));

  res.status(201).json(venda);
});

// cancela e devolve os produtos pro estoque
router.patch('/:id/cancelar', (req, res) => {
  const venda = vendas.buscarPorId(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
  if (venda.status === 'cancelada') return res.status(400).json({ erro: 'Essa venda já foi cancelada' });

  vendas.atualizarStatus(venda.id, 'cancelada');
  produtos.ajustarEstoque(venda.itens.map(i => ({ id: i.produto_id, quantidade: i.quantidade })));
  movimentacoes.registrar(venda.itens.map(i => ({
    produto_id: i.produto_id,
    tipo: 'cancelamento',
    quantidade: i.quantidade,
    observacao: `Cancelamento da venda #${venda.id}`
  })));

  res.json({ ...venda, status: 'cancelada' });
});

module.exports = router;
