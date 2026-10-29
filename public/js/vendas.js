const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const filtroStatus = document.getElementById('filtroStatus');
const tabela = document.getElementById('tabelaVendas');
const modal = document.getElementById('modalVenda');
const btnCancelarVenda = document.getElementById('btnCancelarVenda');

let vendaAberta = null;

// sv-SE já devolve a data no formato yyyy-mm-dd, que é o que o input date usa
function diaLocal(data) {
  return data.toLocaleDateString('sv-SE');
}

function filtrosPadrao() {
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6);
  dataInicio.value = diaLocal(seteDiasAtras);
  dataFim.value = diaLocal(hoje);
}

async function carregarVendas() {
  const params = new URLSearchParams();
  if (dataInicio.value) params.set('de', dataInicio.value);
  if (dataFim.value) params.set('ate', dataFim.value);
  if (filtroStatus.value) params.set('status', filtroStatus.value);

  try {
    const vendas = await api('/vendas?' + params);
    renderizar(vendas);
  } catch (e) {
    aviso(e.message, 'erro');
  }
}

function renderizar(vendas) {
  const concluidas = vendas.filter(v => v.status === 'concluida');
  const total = concluidas.reduce((s, v) => s + v.total, 0);
  document.getElementById('resumoPeriodo').textContent =
    `${vendas.length} venda(s) no período, ${concluidas.length} concluída(s) — total ${moeda(total)}`;

  if (!vendas.length) {
    tabela.innerHTML = '<tr><td colspan="7" class="vazio">Nenhuma venda nesse período</td></tr>';
    return;
  }

  tabela.innerHTML = vendas.map(v => `
    <tr>
      <td>${v.id}</td>
      <td>${dataBR(v.data)}</td>
      <td>${v.qtd_itens}</td>
      <td>${NOMES_PAGAMENTO[v.forma_pagamento] || v.forma_pagamento}</td>
      <td class="direita"><strong>${moeda(v.total)}</strong></td>
      <td><span class="tag ${v.status}">${v.status === 'cancelada' ? 'Cancelada' : 'Concluída'}</span></td>
      <td class="direita"><button class="btn pequeno secundario" data-id="${v.id}">Detalhes</button></td>
    </tr>`).join('');
}

tabela.addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-id]');
  if (botao) abrirVenda(botao.dataset.id);
});

async function abrirVenda(id) {
  try {
    vendaAberta = await api('/vendas/' + id);
  } catch (e) {
    aviso(e.message, 'erro');
    return;
  }

  const v = vendaAberta;
  document.getElementById('tituloVenda').textContent = `Venda #${v.id}`;
  document.getElementById('infoVenda').textContent =
    `${dataBR(v.data)} · ${NOMES_PAGAMENTO[v.forma_pagamento]}` + (v.status === 'cancelada' ? ' · CANCELADA' : '');

  document.getElementById('itensVenda').innerHTML = v.itens.map(i => `
    <tr>
      <td>${escapeHtml(i.nome_produto)}</td>
      <td class="direita">${numero(i.quantidade)}</td>
      <td class="direita">${moeda(i.preco_unitario)}</td>
      <td class="direita">${moeda(i.subtotal)}</td>
    </tr>`).join('');

  let totais = `<strong>Total: ${moeda(v.total)}</strong>`;
  if (v.forma_pagamento === 'dinheiro') {
    totais += `<br><small>Recebido ${moeda(v.valor_recebido)} · Troco ${moeda(v.troco)}</small>`;
  }
  document.getElementById('totaisVenda').innerHTML = totais;

  btnCancelarVenda.style.display = v.status === 'cancelada' ? 'none' : '';
  modal.showModal();
}

btnCancelarVenda.addEventListener('click', async () => {
  if (!vendaAberta) return;
  if (!confirm(`Cancelar a venda #${vendaAberta.id}? Os produtos voltam pro estoque.`)) return;

  try {
    await api(`/vendas/${vendaAberta.id}/cancelar`, { method: 'PATCH' });
    modal.close();
    aviso('Venda cancelada');
    carregarVendas();
  } catch (e) {
    aviso(e.message, 'erro');
  }
});

document.getElementById('btnFiltrar').addEventListener('click', carregarVendas);
filtroStatus.addEventListener('change', carregarVendas);

filtrosPadrao();
carregarVendas();
