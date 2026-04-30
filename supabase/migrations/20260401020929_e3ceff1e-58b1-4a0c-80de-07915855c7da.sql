ALTER TABLE public.vehicles ADD COLUMN internal_notes text DEFAULT ''::text;
ALTER TABLE public.vehicles ADD COLUMN factory_warranty_date date DEFAULT NULL;