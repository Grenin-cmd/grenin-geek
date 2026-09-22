-- Garante que a coluna is_preorder existe (idempotente, caso a
-- migration 002 ainda não tenha sido executada neste banco).
alter table public.products add column if not exists is_preorder boolean not null default false;

-- Corrige a função de checkout: produtos em pré-venda não podem ser
-- bloqueados pela checagem de estoque (que antes rejeitava qualquer
-- pedido com quantidade > stock, mesmo quando stock = 0 propositalmente
-- porque o produto ainda não chegou). Também deixa de descontar do
-- estoque itens em pré-venda, já que esse estoque não existe ainda.
create or replace function public.create_store_order(p_user_id bigint, p_delivery text, p_items jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id bigint;
  item jsonb;
  product_row public.products%rowtype;
  quantity integer;
  order_total numeric(10, 2) := 0;
begin
  if p_delivery not in ('pickup', 'shipping') then
    raise exception 'Forma de recebimento inválida';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    quantity := (item->>'quantity')::integer;
    select * into product_row from public.products where id = item->>'id' and active = true for update;
    if not found or quantity < 1 then
      raise exception 'Produto sem estoque ou quantidade inválida';
    end if;
    if not product_row.is_preorder and quantity > product_row.stock then
      raise exception 'Produto sem estoque ou quantidade inválida';
    end if;
    order_total := order_total + product_row.price * quantity;
  end loop;

  insert into public.orders (user_id, delivery, total) values (p_user_id, p_delivery, order_total) returning id into new_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    quantity := (item->>'quantity')::integer;
    select * into product_row from public.products where id = item->>'id' for update;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
      values (new_order_id, product_row.id, product_row.name, quantity, product_row.price);
    if not product_row.is_preorder then
      update public.products set stock = stock - quantity where id = product_row.id;
    end if;
  end loop;
  return new_order_id;
end;
$$;
