-- Update business category constraint to new set of categories
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_category_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_category_check
  CHECK (category IN (
    'coffee',
    'food',
    'sweets',
    'meat',
    'vegan',
    'celiac',
    'flowers',
    'jewelry',
    'vintage'
  ));

-- Migrate old categories to new ones
UPDATE public.businesses SET category = 'food'  WHERE category IN ('pasta', 'pizza');
