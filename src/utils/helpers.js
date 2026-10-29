function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

// 2026-10-29
function formatarDia(data) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// 2026-10-29 14:05:33 (horário local, fica mais fácil de ler no csv)
function agora() {
  const d = new Date();
  return `${formatarDia(d)} ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}:${doisDigitos(d.getSeconds())}`;
}

function hoje() {
  return formatarDia(new Date());
}

// tira acento e deixa minúsculo, pra busca "feijao" achar "Feijão"
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function arredondar(valor, casas = 2) {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

module.exports = { formatarDia, agora, hoje, normalizar, arredondar };
