import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { FileText, Upload, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface VehicleDoc {
  id: string;
  vehicle_id: string;
  name: string;
  file_url: string;
  doc_type: string;
  created_at: string;
  vehicles?: { brand: string; model: string; version: string };
}

const docTypes = ["documento", "nota_fiscal", "recibo", "laudo", "checklist", "outro"];
const docTypeLabels: Record<string, string> = {
  documento: "Documento", nota_fiscal: "Nota Fiscal", recibo: "Recibo",
  laudo: "Laudo", checklist: "Checklist", outro: "Outro",
};

const AdminDocuments = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", name: "", doc_type: "documento", file_url: "" });
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("vehicle_documents" as any).select("*, vehicles(brand, model, version)") as any).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as VehicleDoc[];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["admin-vehicles-list"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, brand, model, version").order("brand");
      return data || [];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("vehicle-documents").upload(path, file);
    if (error) {
      toast.error("Erro no upload.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("vehicle-documents").getPublicUrl(path);
    setForm({ ...form, file_url: urlData.publicUrl, name: form.name || file.name });
    setUploading(false);
    toast.success("Arquivo enviado!");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("vehicle_documents" as any) as any).insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      setShowForm(false);
      setForm({ vehicle_id: "", name: "", doc_type: "documento", file_url: "" });
      toast.success("Documento salvo!");
    },
    onError: () => toast.error("Erro ao salvar documento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("vehicle_documents" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Documento removido.");
    },
  });

  const filtered = searchTerm
    ? documents.filter((d) => `${d.name} ${d.vehicles?.brand} ${d.vehicles?.model}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : documents;

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl text-foreground">Documentos</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-48" />
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
            <Upload size={16} /> Novo Documento
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-foreground">Adicionar Documento</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Veículo</label>
              <select className={inputClass} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
                <option value="">Selecione...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} {v.version}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Tipo</label>
              <select className={inputClass} value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
                {docTypes.map((t) => <option key={t} value={t}>{docTypeLabels[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Nome do Documento</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: CRLV 2024" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Arquivo</label>
              <input type="file" onChange={handleUpload} className="text-sm text-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:text-xs cursor-pointer" />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
              {form.file_url && <p className="text-xs text-green-400 mt-1">✔ Arquivo enviado</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-sm text-sm">Cancelar</button>
            <button onClick={() => saveMutation.mutate()} disabled={!form.vehicle_id || !form.file_url || saveMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 disabled:opacity-50">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum documento encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3 px-3 text-muted-foreground font-medium">Documento</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Veículo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Tipo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Data</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-3">
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <FileText size={16} /> {d.name}
                    </a>
                  </td>
                  <td className="py-3 px-3 text-foreground">{d.vehicles?.brand} {d.vehicles?.model}</td>
                  <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{docTypeLabels[d.doc_type] || d.doc_type}</Badge></td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => { if (confirm("Remover documento?")) deleteMutation.mutate(d.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocuments;
