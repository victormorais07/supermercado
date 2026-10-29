// wrapper do fetch pra não repetir header/json em todo lugar
async function api(url, opcoes = {}) {
  const config = {
    method: opcoes.method || 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  if (opcoes.body) config.body = JSON.stringify(opcoes.body);

  const resposta = await fetch('/api' + url, config);
  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = dados && (dados.erro || (dados.erros && dados.erros.join('\n')));
    throw new Error(mensagem || 'Erro ao falar com o servidor');
  }
  return dados;
}
