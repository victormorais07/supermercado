const campoBusca = document.getElementById('buscaProduto');
const campoQtd = document.getElementById('quantidade');
const listaSugestoes = document.getElementById('sugestoes');
const tbody = document.getElementById('itensCarrinho');
const formaPagamento = document.getElementById('formaPagamento');
const valorRecebido = document.getElementById('valorRecebido');
const btnFinalizar = document.getElementById('btnFinalizar');

let produtos = [];
let carrinho = []; // { produto, quantidade }
let sugestoesAtuais = [];

async function carregarProdutos() {
  try {
    produtos = await api('/produtos');
  } catch (e) {
    aviso('Não consegui carregar os produtos: ' + e.message, 'erro');
  }
}

function lerNumero(texto) {
  return Number(String(texto).replace(',', '.'));
}

function filtrar(termo) {
  const t = termo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return produtos.filter(p =>
    p.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t) ||
    p.codigo_barras.startsWith(termo)
  ).slice(0, 8);
}

// ---------- busca ----------

function mostrarSugestoes() {
  const termo = campoBusca.value.trim().replace(/^\d+([.,]\d+)?\*/, '');
  if (termo.length < 2) {
    fecharSugestoes();
    return;
  }

  sugestoesAtuais = filtrar(termo);
  if (!sugestoesAtuais.length) {
    listaSugestoes.innerHTML = '<li><small>Nenhum produto encontrado</small></li>';
  } else {
    listaSugestoes.innerHTML = sugestoesAtuais.map((p, i) => `
      <li data-indice="${i}" class="${i === 0 ? 'selecionada' : ''}">
        <span>${escapeHtml(p.nome)} <small>${p.codigo_barras}</small></span>
        <strong>${moeda(p.preco)}</strong>
      </li>`).join('');
  }
  listaSugestoes.classList.add('aberta');
}

function fecharSugestoes() {
  listaSugestoes.classList.remove('aberta');
  sugestoesAtuais = [];
}

function limparBusca() {
  campoBusca.value = '';
  campoQtd.value = 1;
  fecharSugestoes();
  campoBusca.focus();
}

campoBusca.addEventListener('input', mostrarSugestoes);
campoBusca.addEventListener('blur', () => setTimeout(fecharSugestoes, 150));

campoBusca.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    limparBusca();
    return;
  }
  if (e.key !== 'Enter') return;
  e.preventDefault();

  let termo = campoBusca.value.trim();
  if (!termo) return;

  let qtd = lerNumero(campoQtd.value) || 1;

  // formato "3*codigo", igual nos caixas de mercado
  const multiplicador = termo.match(/^(\d+(?:[.,]\d+)?)\*(.+)$/);
  if (multiplicador) {
    qtd = lerNumero(multiplicador[1]);
    termo = multiplicador[2].trim();
  }

  // leitor de código de barras digita o código e manda Enter
  const porCodigo = produtos.find(p => p.codigo_barras && p.codigo_barras === termo);
  if (porCodigo) {
    adicionar(porCodigo, qtd);
    return;
  }

  const achados = filtrar(termo);
  if (achados.length) {
    adicionar(achados[0], qtd);
  } else {
    aviso('Produto não encontrado', 'erro');
  }
});

listaSugestoes.addEventListener('mousedown', (e) => {
  const li = e.target.closest('li[data-indice]');
  if (!li) return;
  e.preventDefault();
  adicionar(sugestoesAtuais[Number(li.dataset.indice)], lerNumero(campoQtd.value) || 1);
});

// ---------- carrinho ----------

function adicionar(produto, qtd) {
  if (!(qtd > 0)) {
    aviso('Quantidade inválida', 'erro');
    return;
  }
  if (produto.unidade !== 'KG' && !Number.isInteger(qtd)) {
    aviso(`${produto.nome} é vendido por unidade`, 'erro');
    return;
  }

  const item = carrinho.find(i => i.produto.id === produto.id);
  const novaQtd = Math.round(((item ? item.quantidade : 0) + qtd) * 1000) / 1000;

  if (novaQtd > produto.estoque) {
    aviso(`Só tem ${numero(produto.estoque)} de ${produto.nome} no estoque`, 'erro');
    return;
  }

  if (item) {
    item.quantidade = novaQtd;
  } else {
    carrinho.push({ produto, quantidade: novaQtd });
  }

  limparBusca();
  renderizarCarrinho();
}

function renderizarCarrinho() {
  if (!carrinho.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="vazio">Carrinho vazio. Passe um produto pra começar.</td></tr>';
  } else {
    tbody.innerHTML = carrinho.map((item, i) => {
      const p = item.produto;
      const passo = p.unidade === 'KG' ? '0.005' : '1';
      return `
        <tr>
          <td><img class="thumb" src="${caminhoImagem(p.imagem)}" alt=""></td>
          <td>${escapeHtml(p.nome)}</td>
          <td><input class="qtd-item" type="number" min="0" step="${passo}" value="${item.quantidade}" data-indice="${i}"></td>
          <td class="direita">${moeda(p.preco)}</td>
          <td class="direita"><strong>${moeda(p.preco * item.quantidade)}</strong></td>
          <td><button class="remover" data-indice="${i}" title="Remover">&times;</button></td>
        </tr>`;
    }).join('');
  }
  atualizarTotais();
}

tbody.addEventListener('change', (e) => {
  if (!e.target.matches('.qtd-item')) return;
  const item = carrinho[Number(e.target.dataset.indice)];
  const qtd = lerNumero(e.target.value);

  if (!(qtd > 0)) {
    carrinho.splice(Number(e.target.dataset.indice), 1);
  } else if (item.produto.unidade !== 'KG' && !Number.isInteger(qtd)) {
    aviso(`${item.produto.nome} é vendido por unidade`, 'erro');
  } else if (qtd > item.produto.estoque) {
    aviso(`Só tem ${numero(item.produto.estoque)} no estoque`, 'erro');
  } else {
    item.quantidade = qtd;
  }
  renderizarCarrinho();
});

tbody.addEventListener('click', (e) => {
  if (!e.target.matches('.remover')) return;
  carrinho.splice(Number(e.target.dataset.indice), 1);
  renderizarCarrinho();
  campoBusca.focus();
});

function calcularTotal() {
  const total = carrinho.reduce((soma, i) => soma + Math.round(i.produto.preco * i.quantidade * 100) / 100, 0);
  return Math.round(total * 100) / 100;
}

function atualizarTotais() {
  const total = calcularTotal();
  document.getElementById('totalVenda').textContent = moeda(total);
  document.getElementById('qtdItens').textContent =
    carrinho.length === 0 ? 'Nenhum item' : carrinho.length === 1 ? '1 item' : `${carrinho.length} itens`;

  const emDinheiro = formaPagamento.value === 'dinheiro';
  document.getElementById('areaDinheiro').style.display = emDinheiro ? '' : 'none';

  const recebido = lerNumero(valorRecebido.value) || 0;
  const troco = recebido - total;
  document.getElementById('troco').textContent = troco > 0 ? moeda(troco) : 'R$ 0,00';
}

formaPagamento.addEventListener('change', atualizarTotais);
valorRecebido.addEventListener('input', atualizarTotais);

// ---------- finalizar ----------

async function finalizar() {
  if (!carrinho.length) {
    aviso('O carrinho está vazio', 'erro');
    return;
  }

  const total = calcularTotal();
  const corpo = {
    forma_pagamento: formaPagamento.value,
    itens: carrinho.map(i => ({ produto_id: i.produto.id, quantidade: i.quantidade }))
  };

  if (corpo.forma_pagamento === 'dinheiro') {
    // se não digitou nada considera que pagou o valor exato
    corpo.valor_recebido = valorRecebido.value ? lerNumero(valorRecebido.value) : total;
    if (corpo.valor_recebido < total) {
      aviso('Valor recebido menor que o total', 'erro');
      valorRecebido.focus();
      return;
    }
  }

  btnFinalizar.disabled = true;
  try {
    const venda = await api('/vendas', { method: 'POST', body: corpo });
    let msg = `Venda #${venda.id} finalizada - ${moeda(venda.total)}`;
    if (venda.troco > 0) msg += ` | Troco: ${moeda(venda.troco)}`;
    aviso(msg);

    carrinho = [];
    valorRecebido.value = '';
    formaPagamento.value = 'dinheiro';
    renderizarCarrinho();
    await carregarProdutos(); // atualiza o estoque
    campoBusca.focus();
  } catch (e) {
    aviso(e.message, 'erro');
  } finally {
    btnFinalizar.disabled = false;
  }
}

btnFinalizar.addEventListener('click', finalizar);

document.getElementById('btnLimpar').addEventListener('click', () => {
  if (carrinho.length && !confirm('Limpar todos os itens do carrinho?')) return;
  carrinho = [];
  renderizarCarrinho();
  limparBusca();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'F2') {
    e.preventDefault();
    campoBusca.focus();
  }
  if (e.key === 'F9') {
    e.preventDefault();
    finalizar();
  }
});

carregarProdutos();
renderizarCarrinho();
