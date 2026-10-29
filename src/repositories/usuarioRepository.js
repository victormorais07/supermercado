const { lerCsv, salvarCsv, proximoId } = require('../database/csv');
const { gerarHash } = require('../utils/senha');
const { hoje } = require('../utils/helpers');

const ARQUIVO = 'usuarios.csv';
const COLUNAS = ['id', 'nome', 'usuario', 'senha_hash', 'perfil', 'criado_em'];

// perfis: admin (vê a aba Contas) e operador

function listar() {
  return lerCsv(ARQUIVO).map(u => ({ ...u, id: Number(u.id) }));
}

function buscarPorId(id) {
  return listar().find(u => u.id === Number(id));
}

function buscarPorUsuario(usuario) {
  const login = String(usuario || '').toLowerCase();
  return listar().find(u => u.usuario.toLowerCase() === login);
}

function criar({ nome, usuario, senha, perfil }) {
  const lista = listar();
  const novo = {
    id: proximoId(lista),
    nome,
    usuario: usuario.toLowerCase(),
    senha_hash: gerarHash(senha),
    perfil,
    criado_em: hoje()
  };
  lista.push(novo);
  salvarCsv(ARQUIVO, COLUNAS, lista);
  return novo;
}

function remover(id) {
  const lista = listar();
  const restantes = lista.filter(u => u.id !== Number(id));
  if (restantes.length === lista.length) return false;
  salvarCsv(ARQUIVO, COLUNAS, restantes);
  return true;
}

// na primeira vez que roda não tem ninguém, então cria o admin padrão
function garantirAdmin() {
  if (listar().some(u => u.perfil === 'admin')) return;
  criar({ nome: 'Administrador', usuario: 'admin', senha: 'admin', perfil: 'admin' });
  console.log('Usuário admin criado (login: admin / senha: admin)');
}

// nunca mandar o hash da senha pro front
function semSenha(usuario) {
  const { senha_hash, ...resto } = usuario;
  return resto;
}

module.exports = { listar, buscarPorId, buscarPorUsuario, criar, remover, garantirAdmin, semSenha };
