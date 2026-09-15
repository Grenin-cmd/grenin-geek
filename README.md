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

O arquivo `grenin.sqlite` é criado automaticamente na primeira execução. Ele contém as tabelas de clientes, produtos, pedidos, itens dos pedidos e sessões. O catálogo inicial também é inserido automaticamente no banco.

## Persistência em produção

Para a conta funcionar em qualquer dispositivo, publique este servidor Node em um serviço com armazenamento persistente e mantenha o arquivo SQLite em um volume persistente. O frontend e a API devem ser acessados pelo mesmo domínio, ou a API deve configurar CORS.

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

O disco persistente do Render é necessário para o SQLite e pode depender de um plano pago. Sem ele, clientes, pedidos e estoque podem ser apagados quando o serviço for recriado.

Se o frontend continuar no GitHub Pages, altere `window.GRENIN_API_URL` em `index.html` para a URL do backend Render, sem a barra final. Nesse caso, configure `FRONTEND_ORIGIN` com a origem exata do GitHub Pages.

## Painel administrativo

O cadastro existente de Victor Alexandre Pereira Carvalho, CPF `14517447650`, recebe automaticamente a função de administrador quando o servidor inicia. Basta entrar normalmente pela área da conta usando a senha já cadastrada; o painel **Produtos e estoque** aparecerá dentro da conta.

No painel é possível alterar preço e estoque, adicionar produtos e desativar produtos do catálogo. Essas alterações são gravadas diretamente no SQLite e não exigem commit ou alteração de código.