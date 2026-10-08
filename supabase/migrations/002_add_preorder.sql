alter table public.products
  add column if not exists is_preorder boolean not null default false;