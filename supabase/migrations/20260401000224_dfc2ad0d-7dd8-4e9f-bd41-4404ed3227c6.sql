
-- Add new columns to vehicles table
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS plate text DEFAULT '',
  ADD COLUMN IF NOT EXISTS renavam text DEFAULT '',
  ADD COLUMN IF NOT EXISTS chassis text DEFAULT '',
  ADD COLUMN IF NOT EXISTS internal_color text DEFAULT '',
  ADD COLUMN IF NOT EXISTS doors integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS accessories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_expenses_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fipe_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suggested_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_on_website boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS yard_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS year_model integer,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'em_estoque';

-- Create vehicle_expenses table
CREATE TABLE public.vehicle_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vehicle expenses"
  ON public.vehicle_expenses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view vehicle expenses"
  ON public.vehicle_expenses FOR SELECT TO public
  USING (true);

-- Migrate existing is_active to show_on_website
UPDATE public.vehicles SET show_on_website = is_active;
