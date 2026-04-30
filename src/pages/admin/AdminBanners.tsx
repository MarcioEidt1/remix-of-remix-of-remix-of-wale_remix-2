import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Banner = Tables<"banners">;

const emptyBanner: Partial<TablesInsert<"banners">> = {
  title: "", subtitle: "", image_url: "", link: "#veiculos", sort_order: 0, is_active: true,
};

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (banner: Partial<Banner>) => {
      if (banner.id) {
        const { error } = await supabase.from("banners").update(banner).eq("id", banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(banner as TablesInsert<"banners">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setEditing(null);
      toast.success("Banner salvo!");
    },
    onError: () => toast.error("Erro ao salvar banner."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner removido.");
    },
  });

  const handleSave = () => {
    if (!editing) return;
    const { id, created_at, updated_at, ...rest } = editing as Banner;
    if (editing.id) {
      saveMutation.mutate({ id, ...rest });
    } else {
      saveMutation.mutate(rest);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Banners</h1>
        <button onClick={() => setEditing({ ...emptyBanner })} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Novo Banner
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-foreground">{editing.id ? "Editar" : "Novo"} Banner</h2>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Título</label>
              <input className={inputClass} value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Subtítulo</label>
              <input className={inputClass} value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </div>
            <div>
              <ImageUpload
                bucket="banner-images"
                value={editing.image_url || ""}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
                label="Imagem do Banner"
                hint="Tamanho recomendado: 1920 × 1080 pixels (proporção 16:9)"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Link</label>
              <input className={inputClass} value={editing.link || ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Ordem</label>
              <input type="number" className={inputClass} value={editing.sort_order || 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="accent-primary" />
              <label className="text-sm text-foreground">Ativo</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border text-muted-foreground rounded-sm text-sm hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : banners.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum banner cadastrado.</div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 bg-card border border-border rounded-lg p-4">
              {b.image_url && <img src={b.image_url} alt="" className="w-24 h-14 object-cover rounded" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{b.title}</p>
                <p className="text-muted-foreground text-xs truncate">{b.subtitle}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                {b.is_active ? "Ativo" : "Inativo"}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setEditing(b)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil size={16} /></button>
                <button onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(b.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBanners;
