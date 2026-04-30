import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, X, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Movement {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  previous_value: string;
  new_value: string;
  created_at: string;
  vehicles?: { brand: string; model: string; version: string };
}

const typeLabels: Record<string, string> = {
  status_change: "Mudança de Status",
  price_change: "Alteração de Preço",
  entry: "Entrada",
  exit: "Saída",
  maintenance: "Manutenção",
  other: "Outro",
};

const AdminMovements = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", type: "other", description: "", previous_value: "", new_value: "" });

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["admin-movements"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("vehicle_movements" as any).select("*, vehicles(brand, model, version)") as any).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Movement[];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["admin-vehicles-list"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, brand, model, version").order("brand");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("vehicle_movements" as any) as any).insert({
        ...form,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-movements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-movements"] });
      setShowForm(false);
      setForm({ vehicle_id: "", type: "other", description: "", previous_value: "", new_value: "" });
      toast.success("Movimentação registrada!");
    },
    onError: () => toast.error("Erro ao registrar movimentação."),
  });

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Movimentações</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nova Movimentação
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-foreground">Registrar Movimentação</h2>
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
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Descrição</label>
              <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Veículo enviado para polimento" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Valor Anterior</label>
              <input className={inputClass} value={form.previous_value} onChange={(e) => setForm({ ...form, previous_value: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Novo Valor</label>
              <input className={inputClass} value={form.new_value} onChange={(e) => setForm({ ...form, new_value: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-sm text-sm">Cancelar</button>
            <button onClick={() => saveMutation.mutate()} disabled={!form.vehicle_id || !form.description || saveMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 disabled:opacity-50">
              {saveMutation.isPending ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : movements.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhuma movimentação registrada.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3 px-3 text-muted-foreground font-medium">Data</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Veículo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Tipo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Descrição</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">De → Para</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-3 text-foreground text-xs">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-3 text-foreground font-medium">{m.vehicles?.brand} {m.vehicles?.model}</td>
                  <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{typeLabels[m.type] || m.type}</Badge></td>
                  <td className="py-3 px-3 text-foreground">{m.description}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">
                    {m.previous_value || m.new_value ? `${m.previous_value || "—"} → ${m.new_value || "—"}` : "—"}
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

export default AdminMovements;
