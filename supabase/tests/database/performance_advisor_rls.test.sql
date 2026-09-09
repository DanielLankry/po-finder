BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(14);

INSERT INTO auth.users (id, email)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'dan264-owner@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'dan264-other@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'dan264-signup@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'dan264-forbidden@example.test');

INSERT INTO public.users (id, email, role, name)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'dan264-owner@example.test', 'business_owner', 'Owner'),
  ('10000000-0000-0000-0000-000000000002', 'dan264-other@example.test', 'business_owner', 'Other');

INSERT INTO public.businesses (
  id,
  owner_id,
  name,
  category,
  is_verified,
  is_active,
  is_legacy_public,
  expires_at
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Legacy public',
    'coffee',
    true,
    true,
    true,
    NULL
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Current public',
    'coffee',
    true,
    true,
    false,
    now() + interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Owner expired',
    'coffee',
    true,
    true,
    false,
    now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Owner inactive',
    'coffee',
    true,
    false,
    true,
    NULL
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'Other private',
    'coffee',
    false,
    false,
    false,
    NULL
  );

INSERT INTO public.payment_attempts (
  id,
  user_id,
  plan_days,
  amount_agorot,
  status,
  kind,
  product_code
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    1,
    300,
    'pending',
    'listing',
    'listing_1d'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    1,
    300,
    'pending',
    'listing',
    'listing_1d'
  );

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

SELECT results_eq(
  $$SELECT id FROM public.users ORDER BY id$$,
  ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
  'authenticated users read only their own profile'
);

SELECT results_eq(
  $$UPDATE public.users
      SET name = 'Owner updated'
    WHERE id = '10000000-0000-0000-0000-000000000001'
    RETURNING name$$,
  ARRAY['Owner updated'::text],
  'authenticated users update their own profile'
);

SELECT results_eq(
  $$UPDATE public.users
      SET name = 'Not allowed'
    WHERE id = '10000000-0000-0000-0000-000000000002'
    RETURNING name$$,
  ARRAY[]::text[],
  'authenticated users cannot update another profile'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

SELECT lives_ok(
  $$INSERT INTO public.users (id, email, role, name)
    VALUES (
      '10000000-0000-0000-0000-000000000003',
      'dan264-signup@example.test',
      'customer',
      'Signup'
    )$$,
  'an authenticated signup can insert its matching profile'
);

SELECT throws_like(
  $$INSERT INTO public.users (id, email, role, name)
    VALUES (
      '10000000-0000-0000-0000-000000000004',
      'dan264-forbidden@example.test',
      'customer',
      'Forbidden'
    )$$,
  '%row-level security policy%',
  'an authenticated signup cannot insert another profile'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

SELECT lives_ok(
  $$INSERT INTO public.favorites (user_id, business_id)
    VALUES (
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001'
    )$$,
  'an authenticated user can create its own favorite'
);

SELECT throws_like(
  $$INSERT INTO public.favorites (user_id, business_id)
    VALUES (
      '10000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000001'
    )$$,
  '%row-level security policy%',
  'an authenticated user cannot create another user favorite'
);

SELECT results_eq(
  $$SELECT user_id FROM public.favorites ORDER BY user_id$$,
  ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
  'authenticated users read only their own favorites'
);

SELECT results_eq(
  $$SELECT id FROM public.payment_attempts ORDER BY id$$,
  ARRAY['30000000-0000-0000-0000-000000000001'::uuid],
  'authenticated users read only their own payment attempts'
);

SELECT results_eq(
  $$SELECT id FROM public.businesses ORDER BY id$$,
  ARRAY[
    '20000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid
  ],
  'owners see public businesses plus their expired and inactive rows'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

SELECT results_eq(
  $$SELECT id FROM public.businesses ORDER BY id$$,
  ARRAY[
    '20000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid
  ],
  'authenticated non-owners see public businesses plus only their own private row'
);

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);

SELECT results_eq(
  $$SELECT id FROM public.businesses ORDER BY id$$,
  ARRAY[
    '20000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid
  ],
  'anonymous callers see only currently public businesses'
);

SELECT results_eq(
  $$SELECT id FROM public.users ORDER BY id$$,
  ARRAY[]::uuid[],
  'anonymous callers cannot read user profiles'
);

SELECT results_eq(
  $$SELECT user_id FROM public.favorites ORDER BY user_id$$,
  ARRAY[]::uuid[],
  'anonymous callers cannot read favorites'
);

RESET ROLE;
SELECT * FROM finish();

ROLLBACK;
