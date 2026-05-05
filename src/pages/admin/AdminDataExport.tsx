import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  Users,
  HardDrive,
  Code2,
  Key,
  ScrollText,
  Download,
  Loader2,
  Copy,
  CheckCircle2,
  ShieldAlert,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";

const TABLE_NAMES = [
  "vehicles",
  "vehicle_images",
  "vehicle_documents",
  "vehicle_expenses",
  "vehicle_movements",
  "banners",
  "contacts",
  "site_settings",
  "testimonials",
  "user_profiles",
  "user_roles",
] as const;

const SCHEMA_SQL = `-- ====================================================
-- SQL de criação das tabelas — Prospect Car System
-- Use este SQL para recriar a estrutura em outro projeto
-- ====================================================

-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Tabela: vehicles
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  display_name TEXT DEFAULT '',
  year INTEGER NOT NULL,
  year_model INTEGER,
  km INTEGER NOT NULL DEFAULT 0,
  fuel TEXT NOT NULL DEFAULT 'Flex',
  transmission TEXT NOT NULL DEFAULT 'Automático',
  price NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '',
  internal_color TEXT DEFAULT '',
  doors INTEGER DEFAULT 4,
  image_url TEXT NOT NULL DEFAULT '',
  image_position TEXT NOT NULL DEFAULT 'center',
  highlights TEXT[] DEFAULT '{}',
  accessories TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN DEFAULT false,
  show_on_website BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'em_estoque',
  plate TEXT DEFAULT '',
  renavam TEXT DEFAULT '',
  chassis TEXT DEFAULT '',
  crv TEXT DEFAULT '',
  engine_number TEXT DEFAULT '',
  power_cv TEXT DEFAULT '',
  ownership_type TEXT DEFAULT 'proprio',
  current_owner TEXT DEFAULT '',
  dpvat_year TEXT DEFAULT '',
  licensing_year TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  entry_date DATE DEFAULT CURRENT_DATE,
  yard_location TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  factory_warranty_date DATE,
  is_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_price NUMERIC,
  promotion_label TEXT DEFAULT 'OFERTA',
  promotion_until DATE,
  purchase_price NUMERIC DEFAULT 0,
  extra_expenses_total NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  fipe_price NUMERIC DEFAULT 0,
  suggested_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_images
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  image_position TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_documents
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT 'documento',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_expenses
CREATE TABLE public.vehicle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: vehicle_movements
CREATE TABLE public.vehicle_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'status_change',
  description TEXT NOT NULL DEFAULT '',
  previous_value TEXT DEFAULT '',
  new_value TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link TEXT DEFAULT '#veiculos',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: site_settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_profiles
CREATE TABLE public.user_profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  username TEXT,
  recovery_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  is_master BOOLEAN NOT NULL DEFAULT false,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (user_id, role)
);

-- ====================================================
-- Funções auxiliares
-- ====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
      AND (is_master = true OR _permission = ANY(permissions))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin' AND is_master = true
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ====================================================
-- Habilitar RLS em todas as tabelas
-- ====================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Realtime para vehicles
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
`;

type ExportCategory = {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
};

const EXPORT_CATEGORIES: ExportCategory[] = [
  { key: "database", label: "Banco de Dados", icon: Database, description: "Todas as tabelas: veículos, banners, contatos, depoimentos, configurações." },
  { key: "users", label: "Usuários", icon: Users, description: "Perfis, roles e permissões dos administradores." },
  { key: "storage", label: "Storage (Mídia)", icon: HardDrive, description: "Lista de arquivos nos buckets (veículos, banners, documentos)." },
  { key: "edge_functions", label: "Edge Functions", icon: Code2, description: "Código das funções de borda (apenas nomes — código está no repositório)." },
  { key: "secrets", label: "Secrets", icon: Key, description: "Nomes das secrets configuradas (valores NÃO são exportados por segurança)." },
  { key: "logs", label: "Logs Recentes", icon: ScrollText, description: "Últimas movimentações registradas no sistema." },
  { key: "appointments", label: "Agendamentos", icon: CalendarCheck, description: "Contatos recebidos com data (funciona como agendamentos)." },
];

const AdminDataExport = () => {
  const { isMaster } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isMaster) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-destructive" size={48} />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">Apenas administradores Master podem exportar dados.</p>
        </div>
      </AdminLayout>
    );
  }

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      toast.success("SQL copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente.");
    }
  };

  const exportCategory = async (key: string) => {
    setExporting(key);
    try {
      let jsonData: any = {};
      let filename = "";

      switch (key) {
        case "database": {
          const results: Record<string, any[]> = {};
          for (const table of TABLE_NAMES) {
            const { data, error } = await supabase.from(table).select("*");
            if (error) throw error;
            results[table] = data || [];
          }
          jsonData = results;
          filename = "database-export.json";
          break;
        }
        case "users": {
          const [profiles, roles] = await Promise.all([
            supabase.from("user_profiles").select("*"),
            supabase.from("user_roles").select("*"),
          ]);
          if (profiles.error) throw profiles.error;
          if (roles.error) throw roles.error;
          jsonData = { user_profiles: profiles.data, user_roles: roles.data };
          filename = "users-export.json";
          break;
        }
        case "storage": {
          const buckets = ["vehicle-images", "banner-images", "vehicle-documents"];
          const result: Record<string, any[]> = {};
          for (const bucket of buckets) {
            const { data } = await supabase.storage.from(bucket).list("", { limit: 1000 });
            result[bucket] = data || [];
          }
          jsonData = result;
          filename = "storage-export.json";
          break;
        }
        case "edge_functions": {
          jsonData = {
            note: "O código das Edge Functions está no repositório em supabase/functions/",
            functions: [
              "export-backup",
              "feed-json",
              "feed-xml",
              "manage-admin-users",
              "resolve-login",
            ],
          };
          filename = "edge-functions-info.json";
          break;
        }
        case "secrets": {
          jsonData = {
            note: "Valores das secrets NÃO são exportados por segurança.",
            configured_secrets: [
              "SUPABASE_SERVICE_ROLE_KEY",
              "SUPABASE_URL",
              "SUPABASE_ANON_KEY",
              "LOVABLE_API_KEY",
            ],
          };
          filename = "secrets-info.json";
          break;
        }
        case "logs": {
          const { data, error } = await supabase
            .from("vehicle_movements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(500);
          if (error) throw error;
          jsonData = { vehicle_movements: data };
          filename = "logs-export.json";
          break;
        }
        case "appointments": {
          const { data, error } = await supabase
            .from("contacts")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          jsonData = { contacts: data };
          filename = "appointments-export.json";
          break;
        }
      }

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      saveAs(blob, filename);
      toast.success(`${filename} exportado com sucesso!`);
    } catch (e) {
      toast.error(`Erro ao exportar: ${(e as Error).message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Exportar Dados</h1>
          <p className="text-muted-foreground mt-1">
            Exporte cada tipo de dado individualmente ou copie o SQL das tabelas para migração.
          </p>
        </div>

        {/* Export categories */}
        <div className="grid sm:grid-cols-2 gap-4">
          {EXPORT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isLoading = exporting === cat.key;
            return (
              <div
                key={cat.key}
                className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => exportCategory(cat.key)}
                  disabled={!!exporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-display font-bold text-xs tracking-wider rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {isLoading ? "EXPORTANDO..." : "EXPORTAR JSON"}
                </button>
              </div>
            );
          })}
        </div>

        {/* SQL Schema */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">SQL das Tabelas</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Copie este SQL para recriar toda a estrutura do banco em outro projeto.
              </p>
            </div>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-xs rounded-md hover:opacity-90 transition-opacity"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? "COPIADO!" : "COPIAR SQL"}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-secondary/60 border border-border rounded-md p-4 text-xs text-foreground font-mono overflow-auto max-h-[500px] whitespace-pre">
              {SCHEMA_SQL}
            </pre>
          </div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-lg p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">💡 Dica de migração:</strong> 1) Copie o SQL acima e execute no novo projeto para criar as tabelas. 2) Exporte os dados (JSON) de cada categoria. 3) Importe os JSONs no novo banco via INSERT.
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDataExport;
