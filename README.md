# Grenin Geek Store

## Executar localmente

1. Instale as dependências:

	```bash
	npm install
	```

2. Inicie a loja e a API:

	```bash
	npm start
	```

3. Acesse `http://localhost:3000`.

O banco usado em produção é o PostgreSQL do Supabase. Na primeira execução, o servidor cria as tabelas de clientes, produtos, pedidos, itens dos pedidos e sessões. O catálogo inicial também é inserido automaticamente.

## Persistência em produção

Para a conta funcionar em qualquer dispositivo, publique este servidor Node e configure `SUPABASE_DB_URL` com a conexão PostgreSQL do Supabase. O frontend e a API devem ser acessados pelo mesmo domínio, ou a API deve configurar CORS.

Antes de publicar, defina `PORT` conforme o serviço:

```bash
PORT=3000 npm start
```

O cadastro e login usam senha protegida com `scrypt`; o navegador guarda somente um token de sessão. Produtos e estoque são lidos do endpoint `/api/products`, enquanto pedidos usam `/api/orders`.

### Publicar no Render

O arquivo `render.yaml` já configura o serviço Node, o comando de inicialização e um disco persistente em `/var/data`. No Render:

1. Crie um **Blueprint** conectado a este repositório.
2. Confirme o arquivo `render.yaml`.
3. Defina `FRONTEND_ORIGIN` apenas se o frontend ficar em outro domínio, como `https://grenin-cmd.github.io`.
4. Use a URL fornecida pelo Render para acessar a loja, por exemplo `https://grenin-geek-store.onrender.com`.

No Supabase, os dados ficam fora do Render e não dependem do disco local do serviço.

Se o frontend continuar no GitHub Pages, altere `window.GRENIN_API_URL` em `index.html` para a URL do backend Render, sem a barra final. Nesse caso, configure `FRONTEND_ORIGIN` com a origem exata do GitHub Pages.

## Painel administrativo

O cadastro existente de Victor Alexandre Pereira Carvalho, CPF `14517447650`, recebe automaticamente a função de administrador quando o servidor inicia. Basta entrar normalmente pela área da conta usando a senha já cadastrada; o painel **Produtos e estoque** aparecerá dentro da conta.

No painel é possível alterar preço e estoque, adicionar produtos e desativar produtos do catálogo. Essas alterações são gravadas diretamente no Supabase e não exigem commit ou alteração de código.

### Configuração do Supabase

No painel do Supabase, abra **Connect**, escolha **Node.js** e copie a conexão PostgreSQL. No Render, crie a variável secreta `SUPABASE_DB_URL` com esse valor. Não coloque essa URL no frontend, no GitHub ou no README.

O banco Supabase começa vazio. Para manter o cadastro administrativo do Victor, crie primeiro a conta dele pela loja publicada com o mesmo CPF; o servidor reconhece esse CPF e atribui automaticamente a função de administrador.