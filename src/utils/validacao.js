const UNIDADES = ['UN', 'KG', 'L', 'CX'];

function validarProduto(dados, idsCategorias) {
  const erros = [];

  if (!dados.nome || dados.nome.length < 2) {
    erros.push('Informe o nome do produto');
  }
  if (dados.nome && dados.nome.length > 80) {
    erros.push('Nome muito grande (máximo 80 caracteres)');
  }
  if (Number.isNaN(dados.preco) || dados.preco < 0) {
    erros.push('Preço inválido');
  }
  if (Number.isNaN(dados.estoque) || dados.estoque < 0) {
    erros.push('Estoque inválido');
  }
  if (Number.isNaN(dados.estoque_minimo) || dados.estoque_minimo < 0) {
    erros.push('Estoque mínimo inválido');
  }
  if (!idsCategorias.includes(dados.categoria_id)) {
    erros.push('Selecione uma categoria válida');
  }
  if (!UNIDADES.includes(dados.unidade)) {
    erros.push('Unidade inválida');
  }
  if (dados.codigo_barras && !/^\d{8,14}$/.test(dados.codigo_barras)) {
    erros.push('Código de barras deve ter de 8 a 14 números');
  }
  // só aceita imagem que esteja dentro de imagens/produtos
  if (dados.imagem && !/^produtos\/[\w-]+\.(svg|png|jpe?g|webp)$/i.test(dados.imagem)) {
    erros.push('Imagem inválida');
  }

  return erros;
}

function validarUsuario(dados) {
  const erros = [];

  if (dados.nome.length < 2 || dados.nome.length > 60) {
    erros.push('Informe o nome (de 2 a 60 caracteres)');
  }
  if (!/^[a-z0-9._]{3,20}$/.test(dados.usuario)) {
    erros.push('Usuário deve ter de 3 a 20 caracteres, só letras sem acento, números, ponto ou _');
  }
  if (dados.senha.length < 4) {
    erros.push('A senha precisa ter pelo menos 4 caracteres');
  }

  return erros;
}

module.exports = { validarProduto, validarUsuario, UNIDADES };
