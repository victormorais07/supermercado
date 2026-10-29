const crypto = require('crypto');

const DURACAO = 8 * 60 * 60 * 1000; // 8 horas, mais ou menos um turno de caixa

// as sessões ficam só na memória, se reiniciar o servidor todo mundo precisa logar de novo
const sessoes = new Map();

function criarSessao(usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessoes.set(token, { usuarioId, expiraEm: Date.now() + DURACAO });
  return token;
}

function buscarSessao(token) {
  const sessao = sessoes.get(token);
  if (!sessao) return null;
  if (sessao.expiraEm < Date.now()) {
    sessoes.delete(token);
    return null;
  }
  return sessao;
}

function encerrarSessao(token) {
  sessoes.delete(token);
}

// usado quando o admin remove uma conta
function encerrarSessoesDoUsuario(usuarioId) {
  for (const [token, sessao] of sessoes) {
    if (sessao.usuarioId === usuarioId) sessoes.delete(token);
  }
}

module.exports = { DURACAO, criarSessao, buscarSessao, encerrarSessao, encerrarSessoesDoUsuario };
