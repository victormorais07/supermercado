const { lerCsv, salvarCsv, proximoId } = require('../database/csv');

const ARQUIVO = 'categorias.csv';
const COLUNAS = ['id', 'nome'];

function listar() {
  return lerCsv(ARQUIVO).map(c => ({ id: Number(c.id), nome: c.nome }));
}

function buscarPorId(id) {
  return listar().find(c => c.id === Number(id));
}

function criar(nome) {
  const lista = listar();
  const categoria = { id: proximoId(lista), nome };
  lista.push(categoria);
  salvarCsv(ARQUIVO, COLUNAS, lista);
  return categoria;
}

function atualizar(id, nome) {
  const lista = listar();
  const categoria = lista.find(c => c.id === Number(id));
  if (!categoria) return null;
  categoria.nome = nome;
  salvarCsv(ARQUIVO, COLUNAS, lista);
  return categoria;
}

function remover(id) {
  const lista = listar();
  const restantes = lista.filter(c => c.id !== Number(id));
  if (restantes.length === lista.length) return false;
  salvarCsv(ARQUIVO, COLUNAS, restantes);
  return true;
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
