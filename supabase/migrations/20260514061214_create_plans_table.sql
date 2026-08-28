
CREATE TABLE IF NOT EXISTS plans (
  id serial PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  days integer NOT NULL UNIQUE,
  label text NOT NULL,
  price integer NOT NULL -- stored in agorot (1 ILS = 100 agorot)
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_public" ON plans FOR SELECT USING (true);

INSERT INTO plans (sort_order, days, label, price) VALUES
  (0, 30,  'חודש',      9900),
  (1, 60,  'חודשיים',   19800),
  (2, 90,  '3 חודשים',  29700)
ON CONFLICT (days) DO NOTHING;
