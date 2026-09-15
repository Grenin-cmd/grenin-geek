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