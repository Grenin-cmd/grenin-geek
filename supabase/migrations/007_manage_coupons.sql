alter table public.coupons
  add column if not exists description text not null default '',
  add column if not exists single_use boolean not null default false,
  add column if not exists active boolean not null default true;

alter table public.coupons alter column expires_at drop not null;
alter table public.coupons drop constraint if exists coupons_expires_at_check;
alter table public.coupons
  add constraint coupons_expires_at_check
  check (expires_at is null or expires_at > starts_at);

update public.coupons
set percent_off = 0.10,
    description = '10% de desconto, uso único por conta, sem data de validade.',
    single_use = true,
    starts_at = now(),
    expires_at = null,
    active = true
where code = 'SUSTO10';

insert into public.coupons (code, percent_off, description, single_use, starts_at, expires_at, active)
values ('SUSTO10', 0.10, '10% de desconto, uso único por conta, sem data de validade.', true, now(), null, true)
on conflict (code) do nothing;

insert into public.coupons (code, percent_off, description, single_use, starts_at, expires_at, active)
values
  ('GRENIN10', 0.10, '10% de desconto.', false, now(), null, true),
  ('BEMVINDO5', 0.05, '5% de desconto de boas-vindas.', false, now(), null, true),
  ('MESTREDASEMANA', 0.15, '15% de desconto.', false, now(), null, true),
  ('TREINADOR10', 0.10, '10% de desconto.', false, now(), null, true)
on conflict (code) do nothing;

create or replace function public.create_store_order(
  p_user_id bigint,
  p_delivery text,
  p_items jsonb,
  p_coupon_code text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id bigint;
  item jsonb;
  product_row public.products%rowtype;
  coupon_row public.coupons%rowtype;
  quantity integer;
  order_total numeric(10, 2) := 0;
  discount_amount numeric(10, 2) := 0;
  normalized_coupon_code text := nullif(upper(trim(p_coupon_code)), '');
begin
  if p_delivery not in ('pickup', 'shipping') then
    raise exception 'Forma de recebimento inválida';
  end if;

  if normalized_coupon_code is not null then
    select * into coupon_row
    from public.coupons
    where code = normalized_coupon_code
    for update;

    if not found or not coupon_row.active then
      raise exception 'Cupom inválido ou desativado.';
    end if;
    if coupon_row.starts_at > now() or (coupon_row.expires_at is not null and coupon_row.expires_at <= now()) then
      raise exception 'Este cupom expirou ou ainda não está disponível.';
    end if;
    if coupon_row.single_use and exists (
      select 1 from public.coupon_redemptions
      where coupon_code = normalized_coupon_code and user_id = p_user_id
    ) then
      raise exception 'Este cupom já foi utilizado nesta conta.';
    end if;
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    quantity := (item->>'quantity')::integer;
    select * into product_row
    from public.products
    where id = item->>'id' and active = true
    for update;
    if not found or quantity < 1 or quantity > product_row.stock then
      raise exception 'Produto sem estoque ou quantidade inválida';
    end if;
    order_total := order_total + product_row.price * quantity;
  end loop;

  if normalized_coupon_code is not null then
    discount_amount := round(order_total * coupon_row.percent_off, 2);
  end if;

  insert into public.orders (user_id, delivery, total, coupon_code, discount_amount)
  values (p_user_id, p_delivery, order_total - discount_amount, normalized_coupon_code, discount_amount)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    quantity := (item->>'quantity')::integer;
    select * into product_row from public.products where id = item->>'id' for update;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
      values (new_order_id, product_row.id, product_row.name, quantity, product_row.price);
    update public.products set stock = stock - quantity where id = product_row.id;
  end loop;

  if normalized_coupon_code is not null and coupon_row.single_use then
    insert into public.coupon_redemptions (coupon_code, user_id, order_id)
    values (normalized_coupon_code, p_user_id, new_order_id);
  end if;

  return new_order_id;
end;
$$;