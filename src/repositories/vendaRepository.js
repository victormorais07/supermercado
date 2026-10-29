const { lerCsv, salvarCsv, proximoId } = require('../database/csv');

const VENDAS = 'vendas.csv';
const ITENS = 'itens_venda.csv';
const COLUNAS_VENDA = ['id', 'data', 'total', 'forma_pagamento', 'valor_recebido', 'troco', 'status'];
const COLUNAS_ITEM = ['venda_id', 'produto_id', 'nome_produto', 'quantidade', 'preco_unitario', 'subtotal'];

function deCsvVenda(v) {
  return {
    id: Number(v.id),
    data: v.data,
    total: Number(v.total),
    forma_pagamento: v.forma_pagamento,
    valor_recebido: Number(v.valor_recebido),
    troco: Number(v.troco),
    status: v.status
  };
}

function deCsvItem(i) {
  return {
    venda_id: Number(i.venda_id),
    produto_id: Number(i.produto_id),
    nome_produto: i.nome_produto,
    quantidade: Number(i.quantidade),
    preco_unitario: Number(i.preco_unitario),
    subtotal: Number(i.subtotal)
  };
}

function vendaParaCsv(v) {
  return {
    ...v,
    total: v.total.toFixed(2),
    valor_recebido: v.valor_recebido.toFixed(2),
    troco: v.troco.toFixed(2)
  };
}

function itemParaCsv(i) {
  return { ...i, preco_unitario: i.preco_unitario.toFixed(2), subtotal: i.subtotal.toFixed(2) };
}

function listar() {
  return lerCsv(VENDAS).map(deCsvVenda);
}

function listarItens() {
  return lerCsv(ITENS).map(deCsvItem);
}

function buscarPorId(id) {
  const venda = listar().find(v => v.id === Number(id));
  if (!venda) return null;
  venda.itens = listarItens().filter(i => i.venda_id === venda.id);
  return venda;
}

function criar(dadosVenda, itens) {
  const vendas = listar();
  const venda = { ...dadosVenda, id: proximoId(vendas) };
  vendas.push(venda);

  const itensDaVenda = itens.map(i => ({ ...i, venda_id: venda.id }));
  const todosItens = listarItens().concat(itensDaVenda);

  // grava os itens antes, se der problema não fica venda sem item
  salvarCsv(ITENS, COLUNAS_ITEM, todosItens.map(itemParaCsv));
  salvarCsv(VENDAS, COLUNAS_VENDA, vendas.map(vendaParaCsv));

  return { ...venda, itens: itensDaVenda };
}

function atualizarStatus(id, status) {
  const vendas = listar();
  const venda = vendas.find(v => v.id === Number(id));
  if (!venda) return null;
  venda.status = status;
  salvarCsv(VENDAS, COLUNAS_VENDA, vendas.map(vendaParaCsv));
  return venda;
}

module.exports = { listar, listarItens, buscarPorId, criar, atualizarStatus };
