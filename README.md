# Supermercado

Sistema de supermercado que fiz pra praticar Node.js. Dá pra cadastrar produtos, controlar o estoque, passar as compras no caixa e acompanhar as vendas.

Por enquanto o banco de dados são arquivos **CSV** na pasta `data/`. Mais pra frente quero trocar por um banco de verdade (SQLite ou Postgres), por isso deixei toda a parte de ler/gravar separada em `src/repositories` — quando trocar, só mexo ali.

## O que tem

- **Login e cadastro**: só entra no sistema quem tem conta. Na tela de login dá pra se cadastrar (a conta é criada como operador)
- **Contas** (só o admin vê): lista os usuários, cria conta nova (operador ou administrador) e remove conta
- **Produtos**: cadastro, edição e exclusão, com código de barras, categoria, preço, unidade (un, kg, litro, caixa) e imagem
- **Consulta**: busca por nome ou código de barras (sem precisar de acento), filtro por categoria, ordenação e filtro de estoque baixo
- **Categorias**: criar, renomear e excluir (não deixa excluir se tiver produto nela)
- **Estoque**: entrada e saída manual (reposição, perda, quebra...) com histórico de movimentações de cada produto
- **Caixa**: adiciona produto pelo código de barras ou pelo nome, aceita `3*codigo` pra lançar quantidade, calcula o troco e baixa o estoque
- **Vendas**: histórico com filtro por data e status, detalhes de cada venda e cancelamento (devolve os produtos pro estoque)
- **Painel**: vendas e faturamento do dia, faturamento do mês, ticket médio, gráfico dos últimos 7 dias, mais vendidos e produtos acabando

## Como rodar

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
npm install
npm start
```

Depois é só abrir http://localhost:3000

Pra desenvolver uso `npm run dev`, que reinicia o servidor sozinho quando salvo algum arquivo.

> No Windows, se o PowerShell reclamar que "a execução de scripts foi desabilitada", use `npm.cmd start`
> ou rode uma vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

### Usuário padrão

| usuário | senha |
|---------|-------|
| admin   | admin |

Se o `data/usuarios.csv` não tiver nenhum admin, o servidor cria esse usuário sozinho quando inicia.

As senhas não ficam salvas em texto, vai só o hash (scrypt, que já vem no Node). O login fica guardado num cookie e as sessões ficam na memória do servidor, então se reiniciar o servidor precisa entrar de novo.

## Estrutura

```
supermercado/
├── data/               # "banco de dados" (csv separado por ;)
│   ├── categorias.csv
│   ├── produtos.csv
│   ├── vendas.csv
│   ├── itens_venda.csv
│   ├── movimentacoes.csv
│   └── usuarios.csv
├── imagens/            # imagens do sistema (o csv só guarda o caminho)
│   ├── logo.svg
│   ├── sem-imagem.svg
│   └── produtos/
├── public/             # front-end (html, css e js puro)
│   ├── css/
│   └── js/
└── src/                # back-end
    ├── server.js
    ├── auth/           # sessões de login
    ├── database/       # leitura e escrita dos csv
    ├── middlewares/    # verifica login e permissão de admin
    ├── repositories/   # acesso aos dados de cada entidade
    ├── routes/         # rotas da api
    └── utils/
```

### Imagens dos produtos

As imagens ficam em `imagens/produtos/` e no `produtos.csv` fica só o caminho (ex: `produtos/arroz.svg`). Pra adicionar uma imagem nova é só jogar o arquivo nessa pasta (svg, png, jpg ou webp) que ela já aparece pra escolher no cadastro do produto.

## API

Tirando as rotas de `/api/auth`, todas precisam estar logado.

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/api/auth/login` | entra no sistema |
| POST | `/api/auth/cadastro` | cria conta (operador) e já entra |
| POST | `/api/auth/logout` | sai |
| GET | `/api/auth/eu` | usuário logado |
| GET/POST | `/api/usuarios` | lista / cria conta (só admin) |
| DELETE | `/api/usuarios/:id` | remove conta (só admin) |
| GET | `/api/produtos` | lista produtos (`?busca=`, `?categoria=`, `?estoqueBaixo=1`, `?ordem=nome\|preco\|estoque`) |
| GET | `/api/produtos/:id` | busca um produto |
| GET | `/api/produtos/codigo/:codigo` | busca pelo código de barras |
| POST | `/api/produtos` | cadastra |
| PUT | `/api/produtos/:id` | atualiza |
| DELETE | `/api/produtos/:id` | exclui (só desativa, pra não quebrar o histórico) |
| POST | `/api/produtos/:id/estoque` | entrada/saída de estoque |
| GET | `/api/produtos/:id/movimentacoes` | histórico do estoque |
| GET/POST | `/api/categorias` | lista / cria categoria |
| PUT/DELETE | `/api/categorias/:id` | renomeia / exclui |
| GET | `/api/vendas` | lista vendas (`?de=`, `?ate=`, `?status=`) |
| GET | `/api/vendas/:id` | detalhes da venda com os itens |
| POST | `/api/vendas` | registra uma venda |
| PATCH | `/api/vendas/:id/cancelar` | cancela a venda |
| GET | `/api/relatorios/resumo` | números do painel |
| GET | `/api/relatorios/vendas-por-dia` | total vendido por dia (`?dias=7`) |

## Ideias pra próximas versões

- [ ] trocar o CSV por banco de dados
- [ ] trocar a senha pelo próprio sistema
- [ ] salvar qual operador fez cada venda
- [ ] upload de imagem direto pela tela de produto
- [ ] cadastro de fornecedores
- [ ] cupom da venda pra imprimir
- [ ] exportar relatório de vendas
