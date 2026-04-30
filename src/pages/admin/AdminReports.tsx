import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { FileDown, FileSpreadsheet, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  em_estoque: "Em Estoque",
  reservado: "Reservado",
  vendido: "Vendido",
  em_manutencao: "Em Manutenção",
};

const AdminReports = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["admin-report-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = statusFilter === "all" ? vehicles : vehicles.filter((v) => v.status === statusFilter);
  const now = Date.now();

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const totalCost = filtered.reduce((s, v) => s + (Number(v.total_cost) || 0), 0);
  const totalSalePrice = filtered.reduce((s, v) => s + (Number(v.price) || 0), 0);
  const totalMargin = totalSalePrice - totalCost;

  const exportCSV = () => {
    const headers = ["Marca", "Modelo", "Versão", "Ano", "Placa", "Status", "Custo Total", "Preço Venda", "Margem", "FIPE", "Dias Estoque", "Exibir no Site", "Destaque"];
    const rows = filtered.map((v) => {
      const cost = Number(v.total_cost) || 0;
      const price = Number(v.price) || 0;
      const days = v.entry_date ? Math.floor((now - new Date(v.entry_date).getTime()) / 86400000) : 0;
      return [v.brand, v.model, v.version, v.year, v.plate || "", statusLabels[v.status] || v.status, cost, price, price - cost, Number(v.fipe_price) || 0, days, v.show_on_website ? "Sim" : "Não", v.featured ? "Sim" : "Não"];
    });

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-veiculos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPrintable = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filtered.map((v) => {
      const cost = Number(v.total_cost) || 0;
      const price = Number(v.price) || 0;
      const margin = price - cost;
      const days = v.entry_date ? Math.floor((now - new Date(v.entry_date).getTime()) / 86400000) : 0;
      return `<tr>
        <td>${v.brand} ${v.model}</td>
        <td>${v.version}</td>
        <td>${v.year}</td>
        <td>${v.plate || "—"}</td>
        <td>${statusLabels[v.status] || v.status}</td>
        <td style="text-align:right">${formatCurrency(cost)}</td>
        <td style="text-align:right">${formatCurrency(price)}</td>
        <td style="text-align:right;color:${margin >= 0 ? "green" : "red"}">${formatCurrency(margin)}</td>
        <td style="text-align:center">${days}d</td>
        <td style="text-align:center">${v.show_on_website ? "✔" : "—"}</td>
      </tr>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Relatório de Veículos</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f5f5f5}h1{font-size:18px}
      .summary{display:flex;gap:20px;margin:16px 0}
      .summary div{padding:8px 12px;background:#f5f5f5;border-radius:4px;font-size:13px}
      @media print{body{padding:0}}</style></head><body>
      <h1>Relatório de Veículos — Wale Automóveis</h1>
      <p style="color:#666;font-size:13px">${new Date().toLocaleDateString("pt-BR")} • ${filtered.length} veículos</p>
      <div class="summary">
        <div><strong>Custo Total:</strong> ${formatCurrency(totalCost)}</div>
        <div><strong>Venda Total:</strong> ${formatCurrency(totalSalePrice)}</div>
        <div><strong>Margem Total:</strong> <span style="color:${totalMargin >= 0 ? "green" : "red"}">${formatCurrency(totalMargin)}</span></div>
      </div>
      <table><thead><tr><th>Veículo</th><th>Versão</th><th>Ano</th><th>Placa</th><th>Status</th><th>Custo</th><th>Preço</th><th>Margem</th><th>Dias</th><th>Site</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
      <script>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl text-foreground">Relatórios</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-sm text-sm hover:bg-secondary transition-colors">
            <FileSpreadsheet size={16} /> Exportar CSV
          </button>
          <button onClick={exportPrintable} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
            <FileDown size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Filter + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Filtrar por Status</label>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">Custo Total</p>
          <p className="font-display font-bold text-foreground">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">Valor Venda Total</p>
          <p className="font-display font-bold text-foreground">{formatCurrency(totalSalePrice)}</p>
        </div>
        <div className={`border rounded-lg p-4 text-center ${totalMargin >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
          <p className="text-xs text-muted-foreground">Margem Total</p>
          <p className={`font-display font-bold ${totalMargin >= 0 ? "text-green-400" : "text-destructive"}`}>{formatCurrency(totalMargin)}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3 px-3 text-muted-foreground font-medium">Veículo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Placa</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Status</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">Custo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">Preço</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">Margem</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">FIPE</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-center">Dias</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-center">Site</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const cost = Number(v.total_cost) || 0;
                const price = Number(v.price) || 0;
                const margin = price - cost;
                const days = v.entry_date ? Math.floor((now - new Date(v.entry_date).getTime()) / 86400000) : 0;
                return (
                  <tr key={v.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-3 text-foreground font-medium">{v.brand} {v.model} <span className="text-muted-foreground text-xs">{v.version}</span></td>
                    <td className="py-3 px-3 text-foreground font-mono text-xs">{v.plate || "—"}</td>
                    <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{statusLabels[v.status] || v.status}</Badge></td>
                    <td className="py-3 px-3 text-foreground text-right">{formatCurrency(cost)}</td>
                    <td className="py-3 px-3 text-foreground text-right font-medium">{formatCurrency(price)}</td>
                    <td className={`py-3 px-3 text-right font-medium ${margin >= 0 ? "text-green-400" : "text-destructive"}`}>{formatCurrency(margin)}</td>
                    <td className="py-3 px-3 text-muted-foreground text-right">{Number(v.fipe_price) ? formatCurrency(Number(v.fipe_price)) : "—"}</td>
                    <td className={`py-3 px-3 text-center text-xs font-medium ${days > 45 ? "text-destructive" : "text-foreground"}`}>{days}d</td>
                    <td className="py-3 px-3 text-center">{v.show_on_website ? <span className="text-green-400">✔</span> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
