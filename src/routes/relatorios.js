const express = require('express');
const produtos = require('../repositories/produtoRepository');
const vendas = require('../repositories/vendaRepository');
const { hoje, formatarDia, arredondar } = require('../utils/helpers');

const router = express.Router();

function somaTotal(lista) {
  return arredondar(lista.reduce((s, v) => s + v.total, 0));
}

router.get('/resumo', (req, res) => {
  const ativos = produtos.listar().filter(p => p.ativo);
  const concluidas = vendas.listar().filter(v => v.status === 'concluida');

  const dia = hoje();
  const mes = dia.slice(0, 7);
  const vendasHoje = concluidas.filter(v => v.data.startsWith(dia));
  const vendasMes = concluidas.filter(v => v.data.startsWith(mes));

  // ranking dos mais vendidos (só conta venda concluída)
  const idsValidos = new Set(concluidas.map(v => v.id));
  const ranking = {};
  for (const item of vendas.listarItens()) {
    if (!idsValidos.has(item.venda_id)) continue;
    if (!ranking[item.produto_id]) {
      ranking[item.produto_id] = { produto_id: item.produto_id, nome: item.nome_produto, quantidade: 0, total: 0 };
    }
    ranking[item.produto_id].quantidade = arredondar(ranking[item.produto_id].quantidade + item.quantidade, 3);
    ranking[item.produto_id].total = arredondar(ranking[item.produto_id].total + item.subtotal);
  }

  const faturamentoMes = somaTotal(vendasMes);

  res.json({
    totalProdutos: ativos.length,
    valorEmEstoque: arredondar(ativos.reduce((s, p) => s + p.preco * p.estoque, 0)),
    vendasHoje: { quantidade: vendasHoje.length, total: somaTotal(vendasHoje) },
    faturamentoMes,
    ticketMedio: vendasMes.length ? arredondar(faturamentoMes / vendasMes.length) : 0,
    estoqueBaixo: ativos
      .filter(p => p.estoque <= p.estoque_minimo)
      .sort((a, b) => a.estoque - b.estoque)
      .map(p => ({ id: p.id, nome: p.nome, estoque: p.estoque, estoque_minimo: p.estoque_minimo, unidade: p.unidade })),
    maisVendidos: Object.values(ranking).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)
  });
});

// total vendido por dia, pro gráfico do painel
router.get('/vendas-por-dia', (req, res) => {
  const dias = Math.min(Math.max(Number(req.query.dias) || 7, 1), 60);
  const concluidas = vendas.listar().filter(v => v.status === 'concluida');

  const resultado = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dia = formatarDia(d);
    const doDia = concluidas.filter(v => v.data.startsWith(dia));
    resultado.push({ dia, quantidade: doDia.length, total: somaTotal(doDia) });
  }
  res.json(resultado);
});

module.exports = router;
