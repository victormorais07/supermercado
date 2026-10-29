const { lerCsv, salvarCsv, proximoId } = require('../database/csv');
const { agora } = require('../utils/helpers');

const ARQUIVO = 'movimentacoes.csv';
const COLUNAS = ['id', 'produto_id', 'tipo', 'quantidade', 'data', 'observacao'];

// tipos: entrada, saida, venda, cancelamento

function listar() {
  return lerCsv(ARQUIVO).map(m => ({
    ...m,
    id: Number(m.id),
    produto_id: Number(m.produto_id),
    quantidade: Number(m.quantidade)
  }));
}

function listarPorProduto(produtoId) {
  return listar()
    .filter(m => m.produto_id === Number(produtoId))
    .sort((a, b) => b.id - a.id);
}

function registrar(movimentos) {
  const lista = listar();
  let id = proximoId(lista);
  const data = agora();
  for (const m of movimentos) {
    lista.push({ id: id++, data, observacao: '', ...m });
  }
  salvarCsv(ARQUIVO, COLUNAS, lista);
}

module.exports = { listarPorProduto, registrar };
