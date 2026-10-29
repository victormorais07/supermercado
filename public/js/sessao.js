// mostra quem está logado no topo e libera a aba Contas pro admin
// fica numa promise pra outras telas (ex: contas.js) poderem usar o usuário também
const usuarioLogado = api('/auth/eu');

usuarioLogado.then((usuario) => {
  if (usuario.perfil === 'admin') {
    document.querySelectorAll('.so-admin').forEach(el => { el.hidden = false; });
  }

  document.querySelector('.topo').insertAdjacentHTML('beforeend', `
    <div class="usuario-logado">
      <span>${escapeHtml(usuario.nome)}</span>
      <button class="btn pequeno secundario" id="btnSair">Sair</button>
    </div>`);

  document.getElementById('btnSair').addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      location.href = '/login.html';
    }
  });
});
