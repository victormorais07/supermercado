const { buscarSessao } = require('../auth/sessoes');
const usuarios = require('../repositories/usuarioRepository');

const PAGINAS_LIVRES = ['/login.html', '/cadastro.html'];
const PAGINAS_ADMIN = ['/contas.html'];

function lerCookies(req) {
  const cookies = {};
  for (const parte of (req.headers.cookie || '').split(';')) {
    const [nome, ...resto] = parte.trim().split('=');
    if (nome) cookies[nome] = decodeURIComponent(resto.join('='));
  }
  return cookies;
}

// só identifica quem está logado (coloca em req.usuario), não bloqueia nada
function carregarUsuario(req, res, next) {
  const token = lerCookies(req).sessao;
  const sessao = token && buscarSessao(token);
  if (sessao) {
    const usuario = usuarios.buscarPorId(sessao.usuarioId);
    if (usuario) {
      req.usuario = usuario;
      req.token = token;
    }
  }
  next();
}

function exigirLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ erro: 'Faça login para continuar' });
  next();
}

function exigirAdmin(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Só o administrador pode fazer isso' });
  }
  next();
}

// protege as páginas .html, css/js/imagens continuam abertos
function protegerPaginas(req, res, next) {
  // no windows o static acha o arquivo mesmo com letra maiúscula, então compara tudo minúsculo
  const caminho = (req.path === '/' ? '/index.html' : req.path).toLowerCase();
  if (!caminho.endsWith('.html')) return next();

  if (PAGINAS_LIVRES.includes(caminho)) {
    // quem já está logado não precisa ver o login de novo
    if (req.usuario) return res.redirect('/');
    return next();
  }

  if (!req.usuario) return res.redirect('/login.html');
  if (PAGINAS_ADMIN.includes(caminho) && req.usuario.perfil !== 'admin') return res.redirect('/');
  next();
}

module.exports = { carregarUsuario, exigirLogin, exigirAdmin, protegerPaginas };
