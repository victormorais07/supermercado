const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

document.getElementById('dataHoje').textContent =
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

async function carregarResumo() {
  const r = await api('/relatorios/resumo');

  document.getElementById('vendasHoje').textContent = r.vendasHoje.quantidade;
  document.getElementById('faturamentoHoje').textContent = moeda(r.vendasHoje.total);
  document.getElementById('faturamentoMes').textContent = moeda(r.faturamentoMes);
  document.getElementById('ticketMedio').textContent = moeda(r.ticketMedio);
  document.getElementById('totalProdutos').textContent = r.totalProdutos;
  document.getElementById('qtdEstoqueBaixo').textContent = r.estoqueBaixo.length;

  const tbodyEstoque = document.getElementById('tabelaEstoqueBaixo');
  tbodyEstoque.innerHTML = r.estoqueBaixo.length
    ? r.estoqueBaixo.map(p => `
        <tr>
          <td><a href="produtos.html?busca=${encodeURIComponent(p.nome)}">${escapeHtml(p.nome)}</a></td>
          <td class="direita negativo">${numero(p.estoque)} ${p.unidade.toLowerCase()}</td>
          <td class="direita">${numero(p.estoque_minimo)}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" class="vazio">Nenhum produto com estoque baixo</td></tr>';

  const tbodyVendidos = document.getElementById('tabelaMaisVendidos');
  tbodyVendidos.innerHTML = r.maisVendidos.length
    ? r.maisVendidos.map((p, i) => `
        <tr>
          <td>${i + 1}. ${escapeHtml(p.nome)}</td>
          <td class="direita">${numero(p.quantidade)}</td>
          <td class="direita">${moeda(p.total)}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" class="vazio">Nenhuma venda ainda</td></tr>';
}

async function carregarGrafico() {
  const dias = await api('/relatorios/vendas-por-dia?dias=7');
  const maior = Math.max(...dias.map(d => d.total), 1);
  const ultimo = dias[dias.length - 1].dia;

  document.getElementById('grafico').innerHTML = dias.map(d => {
    // new Date('2026-10-29') vira UTC e pode cair no dia anterior, por isso o T12:00
    const data = new Date(d.dia + 'T12:00:00');
    const altura = Math.round((d.total / maior) * 100);
    return `
      <div class="barra ${d.dia === ultimo ? 'hoje' : ''}" title="${d.quantidade} venda(s)">
        <b>${d.total ? moeda(d.total) : ''}</b>
        <div style="height:${altura}%"></div>
        <small>${DIAS_SEMANA[data.getDay()]} ${data.getDate()}</small>
      </div>`;
  }).join('');
}

Promise.all([carregarResumo(), carregarGrafico()])
  .catch(e => aviso(e.message, 'erro'));
