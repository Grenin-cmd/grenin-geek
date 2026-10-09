ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coupons (
  code text PRIMARY KEY,
  percent_off numeric(5, 4) NOT NULL CHECK (percent_off > 0 AND percent_off <= 1),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (expires_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  coupon_code text NOT NULL REFERENCES public.coupons(code),
  user_id bigint NOT NULL REFERENCES public.users(id),
  order_id bigint NOT NULL UNIQUE REFERENCES public.orders(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (coupon_code, user_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.coupons (code, percent_off, starts_at, expires_at)
VALUES ('SUSTO10', 0.10, now(), now() + interval '7 days')
ON CONFLICT (code) DO NOTHING;

DROP FUNCTION IF EXISTS public.create_store_order(bigint, text, jsonb);

CREATE FUNCTION public.create_store_order(
  p_user_id bigint,
  p_delivery text,
  p_items jsonb,
  p_coupon_code text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id bigint;
  item jsonb;
  product_row public.products%rowtype;
  coupon_row public.coupons%rowtype;
  quantity integer;
  order_total numeric(10, 2) := 0;
  discount_amount numeric(10, 2) := 0;
  normalized_coupon_code text := nullif(upper(trim(p_coupon_code)), '');
BEGIN
  IF p_delivery NOT IN ('pickup', 'shipping') THEN
    RAISE EXCEPTION 'Forma de recebimento inválida';
  END IF;

  IF normalized_coupon_code IS NOT NULL THEN
    SELECT * INTO coupon_row
    FROM public.coupons
    WHERE code = normalized_coupon_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom inválido.';
    END IF;
    IF coupon_row.starts_at > now() OR coupon_row.expires_at <= now() THEN
      RAISE EXCEPTION 'Este cupom expirou ou ainda não está disponível.';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.coupon_redemptions
      WHERE coupon_code = normalized_coupon_code AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Este cupom já foi utilizado nesta conta.';
    END IF;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    quantity := (item->>'quantity')::integer;
    SELECT * INTO product_row FROM public.products WHERE id = item->>'id' AND active = true FOR UPDATE;
    IF NOT FOUND OR quantity < 1 OR (NOT product_row.is_preorder AND quantity > product_row.stock) THEN
      RAISE EXCEPTION 'Produto sem estoque ou quantidade inválida';
    END IF;
    order_total := order_total + product_row.price * quantity;
  END LOOP;

  IF normalized_coupon_code IS NOT NULL THEN
    discount_amount := round(order_total * coupon_row.percent_off, 2);
  END IF;

  INSERT INTO public.orders (user_id, delivery, total, coupon_code, discount_amount)
  VALUES (p_user_id, p_delivery, order_total - discount_amount, normalized_coupon_code, discount_amount)
  RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    quantity := (item->>'quantity')::integer;
    SELECT * INTO product_row FROM public.products WHERE id = item->>'id' FOR UPDATE;
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price)
      VALUES (new_order_id, product_row.id, product_row.name, quantity, product_row.price);
    IF NOT product_row.is_preorder THEN
      UPDATE public.products SET stock = stock - quantity WHERE id = product_row.id;
    END IF;
  END LOOP;

  IF normalized_coupon_code IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (coupon_code, user_id, order_id)
    VALUES (normalized_coupon_code, p_user_id, new_order_id);
  END IF;

  RETURN new_order_id;
END;
$$;
