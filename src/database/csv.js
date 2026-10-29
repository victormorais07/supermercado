const fs = require('fs');
const path = require('path');

const PASTA_DADOS = path.join(__dirname, '..', '..', 'data');
const SEPARADOR = ';'; // ; pra abrir direto no Excel em pt-BR sem bagunçar

function lerCsv(arquivo) {
  const caminho = path.join(PASTA_DADOS, arquivo);
  if (!fs.existsSync(caminho)) return [];

  const conteudo = fs.readFileSync(caminho, 'utf8').replace(/^﻿/, '');
  const linhas = conteudo.split(/\r?\n/).filter(l => l.trim() !== '');
  if (linhas.length === 0) return [];

  const cabecalho = quebrarLinha(linhas[0]);
  return linhas.slice(1).map(linha => {
    const valores = quebrarLinha(linha);
    const registro = {};
    cabecalho.forEach((coluna, i) => {
      registro[coluna] = valores[i] ?? '';
    });
    return registro;
  });
}

// separa os campos respeitando aspas, ex: "Biscoito; recheado";3.50
function quebrarLinha(linha) {
  const campos = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (c === SEPARADOR && !dentroDeAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos;
}

function escapar(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (texto.includes(SEPARADOR) || texto.includes('"') || texto.includes('\n')) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

function salvarCsv(arquivo, colunas, registros) {
  const linhas = [colunas.join(SEPARADOR)];
  for (const r of registros) {
    linhas.push(colunas.map(c => escapar(r[c])).join(SEPARADOR));
  }

  const caminho = path.join(PASTA_DADOS, arquivo);
  const temporario = caminho + '.tmp';
  // grava num arquivo temporário e depois renomeia,
  // assim se o programa cair no meio não perde o csv inteiro
  fs.writeFileSync(temporario, linhas.join('\n') + '\n', 'utf8');
  fs.renameSync(temporario, caminho);
}

function proximoId(registros) {
  return registros.reduce((maior, r) => Math.max(maior, Number(r.id) || 0), 0) + 1;
}

module.exports = { lerCsv, salvarCsv, proximoId };
