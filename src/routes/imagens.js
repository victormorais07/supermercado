const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const PASTA = path.join(__dirname, '..', '..', 'imagens', 'produtos');

// lista as imagens disponíveis pro select do cadastro de produto
router.get('/', (req, res) => {
  if (!fs.existsSync(PASTA)) return res.json([]);

  const arquivos = fs.readdirSync(PASTA)
    .filter(nome => /\.(svg|png|jpe?g|webp)$/i.test(nome))
    .sort()
    .map(nome => 'produtos/' + nome);

  res.json(arquivos);
});

module.exports = router;
