import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/admin/ImageUpload";

interface Testimonial {
  id: string;
  name: string;
  designation: string;
  quote: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyTestimonial: Omit<Testimonial, "id"> = {
  name: "",
  designation: "",
  quote: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

const AdminTestimonials = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(emptyTestimonial);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (t: typeof form & { id?: string }) => {
      if (t.id) {
        const { error } = await supabase.from("testimonials").update({
          name: t.name,
          designation: t.designation,
          quote: t.quote,
          image_url: t.image_url,
          sort_order: t.sort_order,
          is_active: t.is_active,
        }).eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("testimonials").insert({
          name: t.name,
          designation: t.designation,
          quote: t.quote,
          image_url: t.image_url,
          sort_order: t.sort_order,
          is_active: t.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: editing ? "Depoimento atualizado" : "Depoimento criado" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Depoimento excluído" });
    },
  });

  function openNew() {
    setEditing(null);
    setForm(emptyTestimonial);
    setDialogOpen(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({ name: t.name, designation: t.designation, quote: t.quote, image_url: t.image_url, sort_order: t.sort_order, is_active: t.is_active });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyTestimonial);
  }

  function handleSave() {
    if (!form.name || !form.quote) {
      toast({ title: "Preencha nome e depoimento", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Depoimentos</h1>
        <Button onClick={openNew}><Plus size={18} className="mr-2" />Novo Depoimento</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum depoimento cadastrado.</div>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
              {t.image_url ? (
                <img src={t.image_url} alt={t.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Star size={20} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  {!t.is_active && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground">{t.designation}</p>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">"{t.quote}"</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="icon" onClick={() => openEdit(t)}><Pencil size={16} /></Button>
                <Button variant="outline" size="icon" onClick={() => { if (confirm("Excluir este depoimento?")) deleteMutation.mutate(t.id); }}><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
            </div>
            <div>
              <Label>Título / Cargo</Label>
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Ex: Cliente satisfeito" />
            </div>
            <div>
              <Label>Depoimento *</Label>
              <Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="O que o cliente disse..." rows={4} />
            </div>
            <div>
              <Label>Foto</Label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                bucket="banner-images"
                label="Foto do cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTestimonials;
