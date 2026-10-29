const { lerCsv, salvarCsv, proximoId } = require('../database/csv');
const { hoje, arredondar } = require('../utils/helpers');

const ARQUIVO = 'produtos.csv';
const COLUNAS = [
  'id', 'codigo_barras', 'nome', 'categoria_id', 'preco',
  'estoque', 'estoque_minimo', 'unidade', 'imagem', 'ativo', 'criado_em'
];

// no csv tudo vem como texto, aqui converte pros tipos certos
function deCsv(linha) {
  return {
    id: Number(linha.id),
    codigo_barras: linha.codigo_barras,
    nome: linha.nome,
    categoria_id: Number(linha.categoria_id),
    preco: Number(linha.preco),
    estoque: Number(linha.estoque),
    estoque_minimo: Number(linha.estoque_minimo),
    unidade: linha.unidade || 'UN',
    imagem: linha.imagem,
    ativo: linha.ativo === '1',
    criado_em: linha.criado_em
  };
}

function paraCsv(p) {
  return { ...p, preco: Number(p.preco).toFixed(2), ativo: p.ativo ? '1' : '0' };
}

function listar() {
  return lerCsv(ARQUIVO).map(deCsv);
}

function salvar(lista) {
  salvarCsv(ARQUIVO, COLUNAS, lista.map(paraCsv));
}

function buscarPorId(id) {
  return listar().find(p => p.id === Number(id));
}

function buscarPorCodigo(codigo) {
  if (!codigo) return undefined;
  return listar().find(p => p.ativo && p.codigo_barras === codigo);
}

function criar(dados) {
  const lista = listar();
  const produto = { ...dados, id: proximoId(lista), ativo: true, criado_em: hoje() };
  lista.push(produto);
  salvar(lista);
  return produto;
}

function atualizar(id, dados) {
  const lista = listar();
  const i = lista.findIndex(p => p.id === Number(id));
  if (i === -1) return null;
  lista[i] = { ...lista[i], ...dados, id: lista[i].id };
  salvar(lista);
  return lista[i];
}

// recebe [{ id, quantidade }], quantidade negativa tira do estoque
function ajustarEstoque(ajustes) {
  const lista = listar();
  for (const { id, quantidade } of ajustes) {
    const produto = lista.find(p => p.id === Number(id));
    if (!produto) continue;
    produto.estoque = arredondar(produto.estoque + quantidade, 3);
  }
  salvar(lista);
}

module.exports = { listar, buscarPorId, buscarPorCodigo, criar, atualizar, ajustarEstoque };
