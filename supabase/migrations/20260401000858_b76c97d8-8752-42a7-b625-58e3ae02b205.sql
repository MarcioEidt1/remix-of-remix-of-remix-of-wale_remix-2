
-- Vehicle movements/history
CREATE TABLE public.vehicle_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'status_change',
  description text NOT NULL DEFAULT '',
  previous_value text DEFAULT '',
  new_value text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.vehicle_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage movements"
  ON public.vehicle_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vehicle documents
CREATE TABLE public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'documento',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage documents"
  ON public.vehicle_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Storage bucket for vehicle documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle-documents bucket
CREATE POLICY "Admins can upload vehicle documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view vehicle documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicle documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-documents' AND has_role(auth.uid(), 'admin'));
