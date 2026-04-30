import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Car, AlertTriangle, TrendingUp, RotateCw, Eye, MessageSquare, DollarSign, Package } from "lucide-react";

const Dashboard = () => {
  const { data: vehicles = [] } = useQuery({
    queryKey: ["admin-dashboard-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["admin-unread-count"],
    queryFn: async () => {
      const { count } = await supabase.from("contacts").select("*", { count: "exact", head: true }).eq("is_read", false);
      return count ?? 0;
    },
  });

  const { data: recentMovements = [] } = useQuery({
    queryKey: ["admin-recent-movements"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("vehicle_movements" as any).select("*, vehicles(brand, model)") as any).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const now = Date.now();
  const inStock = vehicles.filter((v) => v.status === "em_estoque" || !v.status);
  const staleVehicles = inStock.filter((v) => {
    if (!v.entry_date) return false;
    const days = Math.floor((now - new Date(v.entry_date).getTime()) / 86400000);
    return days > 45;
  });

  const totalProjectedProfit = inStock.reduce((sum, v) => {
    const cost = Number(v.total_cost) || Number(v.purchase_price) || 0;
    const price = Number(v.price) || 0;
    return sum + (price - cost);
  }, 0);

  const soldVehicles = vehicles.filter((v) => v.status === "vendido");
  const avgTurnover = soldVehicles.length > 0
    ? Math.round(soldVehicles.reduce((sum, v) => {
        if (!v.entry_date) return sum;
        const days = Math.floor((now - new Date(v.entry_date).getTime()) / 86400000);
        return sum + days;
      }, 0) / soldVehicles.length)
    : 0;

  const onWebsite = vehicles.filter((v) => v.show_on_website).length;

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const mainStats = [
    { label: "Total em Estoque", value: String(inStock.length), icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Encalhados (>45 dias)", value: String(staleVehicles.length), icon: AlertTriangle, color: staleVehicles.length > 0 ? "text-destructive" : "text-muted-foreground", bg: staleVehicles.length > 0 ? "bg-destructive/10" : "bg-secondary" },
    { label: "Lucro Projetado", value: formatCurrency(totalProjectedProfit), icon: TrendingUp, color: totalProjectedProfit >= 0 ? "text-green-400" : "text-destructive", bg: totalProjectedProfit >= 0 ? "bg-green-500/10" : "bg-destructive/10" },
    { label: "Giro Médio (dias)", value: avgTurnover > 0 ? `${avgTurnover}d` : "—", icon: RotateCw, color: "text-primary", bg: "bg-primary/10" },
  ];

  const secondaryStats = [
    { label: "Total de Veículos", value: vehicles.length, icon: Car },
    { label: "Visíveis no Site", value: onWebsite, icon: Eye },
    { label: "Vendidos", value: soldVehicles.length, icon: DollarSign },
    { label: "Contatos não lidos", value: unreadCount ?? 0, icon: MessageSquare },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Dashboard</h1>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainStats.map((stat) => (
          <div key={stat.label} className={`rounded-lg p-5 border border-border ${stat.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{stat.label}</p>
                <p className={`font-display font-black text-2xl mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon size={28} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <stat.icon size={16} className="text-muted-foreground" />
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </div>
            <p className="font-display font-bold text-xl text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Stale vehicles alert */}
      {staleVehicles.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display font-bold text-foreground text-sm">Veículos Encalhados ({staleVehicles.length})</h3>
          </div>
          <div className="space-y-2">
            {staleVehicles.slice(0, 5).map((v) => {
              const days = Math.floor((now - new Date(v.entry_date).getTime()) / 86400000);
              return (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{v.brand} {v.model} {v.version}</span>
                  <span className="text-destructive font-medium">{days} dias</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-display font-bold text-foreground text-sm mb-4">Movimentações Recentes</h3>
        {recentMovements.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="space-y-3">
            {recentMovements.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-foreground">{m.vehicles?.brand} {m.vehicles?.model} — {m.description}</p>
                  <p className="text-xs text-muted-foreground">{m.type}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
