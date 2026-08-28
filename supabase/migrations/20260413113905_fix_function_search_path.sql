
-- Fix mutable search_path on update_search_vector
CREATE OR REPLACE FUNCTION public.update_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.address, '')), 'C');
  RETURN NEW;
END;
$function$;

-- Fix mutable search_path on update_business_rating
CREATE OR REPLACE FUNCTION public.update_business_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  UPDATE businesses SET
    avg_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE business_id = COALESCE(NEW.business_id, OLD.business_id))
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;
