const form = document.getElementById('formCategoria');
const tabela = document.getElementById('tabelaCategorias');

let categorias = [];

async function carregar() {
  try {
    categorias = await api('/categorias');
  } catch (e) {
    aviso(e.message, 'erro');
    return;
  }

  if (!categorias.length) {
    tabela.innerHTML = '<tr><td colspan="3" class="vazio">Nenhuma categoria cadastrada</td></tr>';
    return;
  }

  tabela.innerHTML = categorias.map(c => `
    <tr>
      <td>${escapeHtml(c.nome)}</td>
      <td class="direita">
        <a href="produtos.html?categoria=${c.id}">${c.total_produtos}</a>
      </td>
      <td class="direita">
        <button class="btn pequeno secundario" data-acao="renomear" data-id="${c.id}">Renomear</button>
        <button class="btn pequeno perigo" data-acao="excluir" data-id="${c.id}">Excluir</button>
      </td>
    </tr>`).join('');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = form.elements.nome.value.trim();
  if (!nome) return;

  try {
    await api('/categorias', { method: 'POST', body: { nome } });
    form.reset();
    aviso('Categoria criada');
    carregar();
  } catch (err) {
    aviso(err.message, 'erro');
  }
});

tabela.addEventListener('click', async (e) => {
  const botao = e.target.closest('button[data-acao]');
  if (!botao) return;
  const categoria = categorias.find(c => c.id === Number(botao.dataset.id));

  try {
    if (botao.dataset.acao === 'renomear') {
      const nome = prompt('Novo nome da categoria:', categoria.nome);
      if (!nome || nome.trim() === categoria.nome) return;
      await api('/categorias/' + categoria.id, { method: 'PUT', body: { nome: nome.trim() } });
      aviso('Categoria renomeada');
    }

    if (botao.dataset.acao === 'excluir') {
      if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return;
      await api('/categorias/' + categoria.id, { method: 'DELETE' });
      aviso('Categoria excluída');
    }
    carregar();
  } catch (err) {
    aviso(err.message, 'erro');
  }
});

carregar();
