const lista = document.getElementById('listaProdutos');
const campoBusca = document.getElementById('busca');
const filtroCategoria = document.getElementById('filtroCategoria');
const ordem = document.getElementById('ordem');
const soEstoqueBaixo = document.getElementById('soEstoqueBaixo');

const modalProduto = document.getElementById('modalProduto');
const formProduto = document.getElementById('formProduto');
const modalEstoque = document.getElementById('modalEstoque');
const formEstoque = document.getElementById('formEstoque');
const preview = document.getElementById('previewImagem');

let produtosCarregados = [];
let produtoDoEstoque = null;

async function iniciar() {
  // se veio do painel (?busca=) ou das categorias (?categoria=)
  const params = new URLSearchParams(location.search);
  if (params.get('busca')) campoBusca.value = params.get('busca');

  try {
    const [categorias, imagens] = await Promise.all([api('/categorias'), api('/imagens')]);

    const opcoes = categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
    filtroCategoria.insertAdjacentHTML('beforeend', opcoes);
    formProduto.elements.categoria_id.innerHTML = opcoes;
    if (params.get('categoria')) filtroCategoria.value = params.get('categoria');

    document.getElementById('selectImagem').insertAdjacentHTML('beforeend',
      imagens.map(img => `<option value="${img}">${img.replace('produtos/', '')}</option>`).join(''));
  } catch (e) {
    aviso(e.message, 'erro');
  }

  carregarProdutos();
}

async function carregarProdutos() {
  const params = new URLSearchParams();
  if (campoBusca.value.trim()) params.set('busca', campoBusca.value.trim());
  if (filtroCategoria.value) params.set('categoria', filtroCategoria.value);
  if (soEstoqueBaixo.checked) params.set('estoqueBaixo', '1');
  params.set('ordem', ordem.value);

  try {
    produtosCarregados = await api('/produtos?' + params);
    renderizar();
  } catch (e) {
    aviso(e.message, 'erro');
  }
}

function renderizar() {
  const total = produtosCarregados.length;
  document.getElementById('contador').textContent =
    total === 1 ? '1 produto encontrado' : `${total} produtos encontrados`;

  if (!total) {
    lista.innerHTML = '<p class="vazio">Nenhum produto encontrado.</p>';
    return;
  }

  lista.innerHTML = produtosCarregados.map(p => {
    const baixo = p.estoque <= p.estoque_minimo;
    return `
      <div class="card-produto">
        <img src="${caminhoImagem(p.imagem)}" alt="${escapeHtml(p.nome)}" loading="lazy">
        <div class="dados">
          <span class="categoria">${escapeHtml(p.categoria)}</span>
          <h3>${escapeHtml(p.nome)}</h3>
          <small class="codigo">${p.codigo_barras || 'sem código de barras'}</small>
          <div class="linha-preco">
            <strong>${moeda(p.preco)}${p.unidade === 'KG' ? '<small>/kg</small>' : ''}</strong>
            <span class="estoque ${baixo ? 'baixo' : ''}" title="${baixo ? 'Estoque abaixo do mínimo' : ''}">
              ${numero(p.estoque)} ${p.unidade.toLowerCase()}
            </span>
          </div>
        </div>
        <div class="botoes">
          <button class="btn pequeno secundario" data-acao="editar" data-id="${p.id}">Editar</button>
          <button class="btn pequeno secundario" data-acao="estoque" data-id="${p.id}">Estoque</button>
          <button class="btn pequeno perigo" data-acao="excluir" data-id="${p.id}">Excluir</button>
        </div>
      </div>`;
  }).join('');
}

// ---------- filtros ----------

let timerBusca;
campoBusca.addEventListener('input', () => {
  clearTimeout(timerBusca);
  timerBusca = setTimeout(carregarProdutos, 300);
});
filtroCategoria.addEventListener('change', carregarProdutos);
ordem.addEventListener('change', carregarProdutos);
soEstoqueBaixo.addEventListener('change', carregarProdutos);

// ---------- botões dos cards ----------

lista.addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-acao]');
  if (!botao) return;

  const produto = produtosCarregados.find(p => p.id === Number(botao.dataset.id));
  if (!produto) return;

  if (botao.dataset.acao === 'editar') abrirFormulario(produto);
  if (botao.dataset.acao === 'estoque') abrirEstoque(produto);
  if (botao.dataset.acao === 'excluir') excluir(produto);
});

document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario(null));

// ---------- cadastro / edição ----------

function abrirFormulario(produto) {
  formProduto.reset();
  erroNoForm(formProduto, '');

  const campos = formProduto.elements;
  document.getElementById('tituloModal').textContent = produto ? 'Editar produto' : 'Novo produto';
  document.getElementById('labelEstoque').firstChild.textContent = produto ? 'Estoque atual ' : 'Estoque inicial ';
  campos.estoque.disabled = !!produto;

  if (produto) {
    campos.produtoId.value = produto.id;
    for (const campo of ['nome', 'codigo_barras', 'categoria_id', 'preco', 'unidade', 'estoque', 'estoque_minimo', 'imagem']) {
      campos[campo].value = produto[campo];
    }
  } else {
    campos.produtoId.value = '';
  }

  atualizarPreview();
  modalProduto.showModal();
  campos.nome.focus();
}

function atualizarPreview() {
  preview.src = caminhoImagem(formProduto.elements.imagem.value);
}

formProduto.elements.imagem.addEventListener('change', atualizarPreview);

formProduto.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formProduto));
  const id = dados.produtoId;
  delete dados.produtoId;

  try {
    if (id) {
      await api('/produtos/' + id, { method: 'PUT', body: dados });
      aviso('Produto atualizado');
    } else {
      await api('/produtos', { method: 'POST', body: dados });
      aviso('Produto cadastrado');
    }
    modalProduto.close();
    carregarProdutos();
  } catch (err) {
    erroNoForm(formProduto, err.message);
  }
});

async function excluir(produto) {
  if (!confirm(`Excluir "${produto.nome}"?`)) return;
  try {
    await api('/produtos/' + produto.id, { method: 'DELETE' });
    aviso('Produto excluído');
    carregarProdutos();
  } catch (e) {
    aviso(e.message, 'erro');
  }
}

// ---------- estoque ----------

const NOMES_TIPO = {
  entrada: 'Entrada',
  saida: 'Saída',
  venda: 'Venda',
  cancelamento: 'Cancelamento'
};

async function abrirEstoque(produto) {
  produtoDoEstoque = produto;
  formEstoque.reset();
  erroNoForm(formEstoque, '');
  document.getElementById('estoqueProduto').textContent =
    `${produto.nome} — atual: ${numero(produto.estoque)} ${produto.unidade.toLowerCase()}`;

  modalEstoque.showModal();
  formEstoque.elements.quantidade.focus();
  carregarHistorico();
}

async function carregarHistorico() {
  const tbody = document.getElementById('historicoMovimentacoes');
  try {
    const movs = await api(`/produtos/${produtoDoEstoque.id}/movimentacoes`);
    tbody.innerHTML = movs.length
      ? movs.slice(0, 10).map(m => {
          const sai = m.tipo === 'saida' || m.tipo === 'venda';
          return `
            <tr>
              <td>${dataBR(m.data)}</td>
              <td>${NOMES_TIPO[m.tipo] || m.tipo}</td>
              <td class="direita ${sai ? 'negativo' : 'positivo'}">${sai ? '-' : '+'}${numero(m.quantidade)}</td>
              <td>${escapeHtml(m.observacao)}</td>
            </tr>`;
        }).join('')
      : '<tr><td class="vazio">Nenhuma movimentação ainda</td></tr>';
  } catch (e) {
    tbody.innerHTML = '';
  }
}

formEstoque.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formEstoque));

  try {
    const atualizado = await api(`/produtos/${produtoDoEstoque.id}/estoque`, { method: 'POST', body: dados });
    produtoDoEstoque = { ...produtoDoEstoque, estoque: atualizado.estoque };
    document.getElementById('estoqueProduto').textContent =
      `${atualizado.nome} — atual: ${numero(atualizado.estoque)} ${atualizado.unidade.toLowerCase()}`;
    formEstoque.reset();
    erroNoForm(formEstoque, '');
    aviso('Estoque atualizado');
    carregarHistorico();
    carregarProdutos();
  } catch (err) {
    erroNoForm(formEstoque, err.message);
  }
});

iniciar();
