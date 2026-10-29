const form = document.getElementById('formConta');
const tabela = document.getElementById('tabelaContas');

let contas = [];

async function carregar() {
  try {
    const [lista, eu] = await Promise.all([api('/usuarios'), usuarioLogado]);
    contas = lista;

    tabela.innerHTML = contas.map(c => `
      <tr>
        <td>${escapeHtml(c.nome)}${c.id === eu.id ? ' <small class="info">(você)</small>' : ''}</td>
        <td>${escapeHtml(c.usuario)}</td>
        <td><span class="tag ${c.perfil === 'admin' ? 'admin' : ''}">${c.perfil === 'admin' ? 'Administrador' : 'Operador'}</span></td>
        <td>${dataBR(c.criado_em)}</td>
        <td class="direita">
          ${c.id === eu.id ? '' : `<button class="btn pequeno perigo" data-id="${c.id}">Remover</button>`}
        </td>
      </tr>`).join('');
  } catch (e) {
    aviso(e.message, 'erro');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  try {
    await api('/usuarios', { method: 'POST', body: dados });
    form.reset();
    erroNoForm(form, '');
    aviso('Conta criada');
    carregar();
  } catch (err) {
    erroNoForm(form, err.message);
  }
});

tabela.addEventListener('click', async (e) => {
  const botao = e.target.closest('button[data-id]');
  if (!botao) return;
  const conta = contas.find(c => c.id === Number(botao.dataset.id));
  if (!confirm(`Remover a conta de ${conta.nome} (${conta.usuario})?`)) return;

  try {
    await api('/usuarios/' + conta.id, { method: 'DELETE' });
    aviso('Conta removida');
    carregar();
  } catch (err) {
    aviso(err.message, 'erro');
  }
});

carregar();
