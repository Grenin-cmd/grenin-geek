-- Adicionar coluna is_preorder à tabela de produtos
alter table public.products add column is_preorder boolean not null default false;
