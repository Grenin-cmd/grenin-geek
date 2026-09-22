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

Para a conta funcionar em qualquer dispositivo, use o PostgreSQL e as Edge Functions do Supabase. O GitHub Pages hospeda o frontend e a Edge Function hospeda a API.

Antes de publicar, defina `PORT` conforme o serviço:

```bash
PORT=3000 npm start
```

O cadastro e login usam senha protegida com `scrypt`; o navegador guarda somente um token de sessão. Produtos e estoque são lidos do endpoint `/api/products`, enquanto pedidos usam `/api/orders`.

### Publicar no Supabase

No painel do Supabase:

1. Abra **SQL Editor**, crie uma query e execute `supabase/migrations/001_store.sql`.
2. Abra **Edge Functions**, crie uma função chamada `api` e use o conteúdo de `supabase/functions/api/index.ts`.
3. Publique a função.
4. Nas configurações da função, desative **JWT verification** / **Verify JWT**, pois o login da loja usa CPF e senha próprios.
5. Troque `SEU_PROJECT_REF` no `index.html` pelo identificador do seu projeto.
6. Faça commit e aguarde o GitHub Pages atualizar.

O arquivo `supabase/config.toml` também registra `verify_jwt = false` para deploy feito pela CLI.

Configure o segredo `STORE_SERVICE_ROLE_KEY` na Edge Function com a chave de serviço do projeto. Nunca coloque essa chave no frontend ou no GitHub.

## Painel administrativo

O cadastro existente de Victor Alexandre Pereira Carvalho, CPF `14517447650`, recebe automaticamente a função de administrador quando o servidor inicia. Basta entrar normalmente pela área da conta usando a senha já cadastrada; o painel **Produtos e estoque** aparecerá dentro da conta.

No painel é possível alterar preço e estoque, adicionar produtos e desativar produtos do catálogo. Essas alterações são gravadas diretamente no Supabase e não exigem commit ou alteração de código.

### Configuração do Supabase

O banco Supabase começa vazio. Execute a migration SQL antes de publicar a função.

Para manter o cadastro administrativo do Victor, crie a conta dele pela loja publicada com o CPF `14517447650`; a Edge Function atribui automaticamente a função de administrador.