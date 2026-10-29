const crypto = require('crypto');

// scrypt já vem no node, não precisa instalar bcrypt
// formato salvo no csv: salt:hash
function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function conferirSenha(senha, salvo) {
  const [salt, hash] = String(salvo || '').split(':');
  if (!salt || !hash) return false;

  const calculado = crypto.scryptSync(String(senha), salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === calculado.length && crypto.timingSafeEqual(original, calculado);
}

module.exports = { gerarHash, conferirSenha };
