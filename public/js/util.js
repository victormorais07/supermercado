const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function moeda(valor) {
  return formatoMoeda.format(valor || 0);
}

function numero(valor) {
  return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

// "2026-10-29 14:05:33" -> "29/10/2026 14:05"
function dataBR(texto) {
  if (!texto) return '';
  const [dia, hora = ''] = texto.split(' ');
  const [a, m, d] = dia.split('-');
  return `${d}/${m}/${a} ${hora.slice(0, 5)}`.trim();
}

function caminhoImagem(imagem) {
  return imagem ? '/imagens/' + imagem : '/imagens/sem-imagem.svg';
}

function escapeHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NOMES_PAGAMENTO = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
  pix: 'Pix'
};

let timerAviso;
function aviso(mensagem, tipo = 'ok') {
  let el = document.getElementById('aviso');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aviso';
    document.body.appendChild(el);
  }
  el.textContent = mensagem;
  el.className = 'aviso mostrar ' + tipo;
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => el.classList.remove('mostrar'), 3500);
}

// mostra erro dentro do modal (o toast fica atrás do backdrop)
function erroNoForm(form, mensagem) {
  const el = form.querySelector('.erro-form');
  el.textContent = mensagem || '';
  el.classList.toggle('visivel', !!mensagem);
}

// qualquer botão com data-fechar fecha o dialog onde ele está
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-fechar]')) {
    e.target.closest('dialog').close();
  }
});
