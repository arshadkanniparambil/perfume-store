-- get_catalog(): the storefront's read API.
--
-- Returns every visible product with its brand, categories, variants
-- (including available stock) and images as one JSON array, so the app
-- needs a single request. SECURITY INVOKER means the caller's RLS policies
-- apply: shoppers only ever see active rows.

create or replace function public.get_catalog()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(item order by sort_order, slug), '[]'::jsonb)
  from (
    select
      p.sort_order,
      p.slug,
      jsonb_build_object(
        'slug', p.slug,
        'nameEn', p.name_en,
        'nameAr', p.name_ar,
        'descriptionEn', p.description_en,
        'descriptionAr', p.description_ar,
        'concentration', p.concentration,
        'notes', jsonb_build_object(
          'topEn', p.notes_top_en, 'heartEn', p.notes_heart_en,
          'baseEn', p.notes_base_en, 'topAr', p.notes_top_ar,
          'heartAr', p.notes_heart_ar, 'baseAr', p.notes_base_ar
        ),
        'accentColor', p.accent_color,
        'brand', jsonb_build_object(
          'slug', b.slug, 'nameEn', b.name_en, 'nameAr', b.name_ar
        ),
        'categories', coalesce((
          select jsonb_agg(c.slug order by c.sort_order, c.slug)
          from public.product_categories pc
          join public.categories c on c.id = pc.category_id
          where pc.product_id = p.id
        ), '[]'::jsonb),
        'variants', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'sku', v.sku,
              'sizeMl', v.size_ml,
              'priceHalalas', v.price_halalas,
              'stock', greatest(coalesce(i.quantity_available, 0), 0)
            )
            order by v.size_ml
          )
          from public.product_variants v
          left join public.inventory i on i.variant_id = v.id
          where v.product_id = p.id
        ), '[]'::jsonb),
        'images', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'url', img.url, 'altEn', img.alt_en, 'altAr', img.alt_ar
            )
            order by img.is_primary desc, img.sort_order
          )
          from public.product_images img
          where img.product_id = p.id
        ), '[]'::jsonb)
      ) as item
    from public.products p
    join public.brands b on b.id = p.brand_id
  ) catalog;
$$;

revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon, authenticated, service_role;
