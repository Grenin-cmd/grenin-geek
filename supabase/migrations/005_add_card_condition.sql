alter table public.products
  add column if not exists card_condition text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_card_condition_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_card_condition_check
      check (card_condition is null or card_condition in ('NM', 'SP', 'MP', 'HP', 'DMG'));
  end if;
end;
$$;