import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X, ImagePlus, Eye, EyeOff, Star, Search as SearchIcon, AlertTriangle } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import ImagePositionSelector from "@/components/admin/ImagePositionSelector";
import { objectPositionFor, ImagePosition } from "@/lib/imagePosition";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  version: string;
  display_name: string;
  year: number;
  year_model: number | null;
  km: number;
  fuel: string;
  transmission: string;
  price: number;
  color: string;
  internal_color: string;
  doors: number;
  image_url: string;
  highlights: string[];
  accessories: string[];
  description: string | null;
  is_active: boolean;
  show_on_website: boolean;
  featured: boolean;
  plate: string;
  renavam: string;
  chassis: string;
  crv: string;
  engine_number: string;
  power_cv: string;
  ownership_type: string;
  current_owner: string;
  dpvat_year: string;
  licensing_year: string;
  internal_notes: string;
  factory_warranty_date: string | null;
  purchase_price: number;
  extra_expenses_total: number;
  total_cost: number;
  fipe_price: number;
  suggested_price: number;
  entry_date: string;
  yard_location: string;
  video_url: string;
  status: string;
  is_promotion: boolean;
  promotion_price: number | null;
  promotion_label: string;
  promotion_until: string | null;
  image_position: string;
  created_at: string;
  updated_at: string;
}

interface Expense {
  id?: string;
  description: string;
  amount: number;
}

const ownershipOptions = [
  { value: "proprio", label: "Próprio" },
  { value: "terceiro_consignado", label: "Terceiro (Consignado)" },
  { value: "terceiro_demonstracao", label: "Terceiro (Demonstração)" },
  { value: "terceiro_financiamento", label: "Terceiro (Financiamento)" },
];

const emptyVehicle: Partial<VehicleRow> = {
  brand: "", model: "", version: "", display_name: "", year: new Date().getFullYear(), year_model: new Date().getFullYear(),
  km: 0, fuel: "Flex", transmission: "Automático", price: 0, color: "", internal_color: "",
  doors: 4, image_url: "", highlights: [], accessories: [], description: "", is_active: true,
  show_on_website: false, featured: false, plate: "", renavam: "", chassis: "",
  crv: "", engine_number: "", power_cv: "", ownership_type: "proprio", current_owner: "",
  dpvat_year: "", licensing_year: "", internal_notes: "", factory_warranty_date: null,
  purchase_price: 0, extra_expenses_total: 0, total_cost: 0, fipe_price: 0, suggested_price: 0,
  entry_date: new Date().toISOString().split("T")[0], yard_location: "", video_url: "", status: "em_estoque",
  is_promotion: false, promotion_price: null, promotion_label: "OFERTA", promotion_until: null,
  image_position: "center",
};

const statusOptions = [
  { value: "em_estoque", label: "Em Estoque" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
  { value: "em_manutencao", label: "Em Manutenção" },
];

const AdminVehicles = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<VehicleRow> | null>(null);
  const [highlightInput, setHighlightInput] = useState("");
  const [accessoryInput, setAccessoryInput] = useState("");
  const [extraImages, setExtraImages] = useState<{ id?: string; image_url: string; image_position?: string | null }[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fipeLoading, setFipeLoading] = useState(false);
  const [fipeError, setFipeError] = useState("");

  // FIPE selects state
  const FIPE_BASE = "https://fipe.parallelum.com.br/api/v2";
  const [fipeBrands, setFipeBrands] = useState<{ code: string; name: string }[]>([]);
  const [fipeModels, setFipeModels] = useState<{ code: string; name: string }[]>([]);
  const [fipeBrandsLoading, setFipeBrandsLoading] = useState(false);
  const [fipeModelsLoading, setFipeModelsLoading] = useState(false);
  const [selectedBrandCode, setSelectedBrandCode] = useState("");
  const [selectedModelCode, setSelectedModelCode] = useState("");

  // Fetch FIPE brands on mount
  useEffect(() => {
    fetch(`${FIPE_BASE}/cars/brands`)
      .then((r) => r.json())
      .then((data) => setFipeBrands(data || []))
      .catch(() => {});
  }, []);

  // Fetch FIPE models when brand changes
  useEffect(() => {
    if (!selectedBrandCode) { setFipeModels([]); return; }
    setFipeModelsLoading(true);
    fetch(`${FIPE_BASE}/cars/brands/${selectedBrandCode}/models`)
      .then((r) => r.json())
      .then((data) => setFipeModels(data || []))
      .catch(() => setFipeModels([]))
      .finally(() => setFipeModelsLoading(false));
  }, [selectedBrandCode]);

  const consultarFipe = useCallback(async () => {
    if (!selectedBrandCode || !selectedModelCode || !editing?.year) {
      setFipeError("Selecione marca, modelo e preencha o ano primeiro.");
      return;
    }
    setFipeLoading(true);
    setFipeError("");
    try {
      const targetYear = String(editing.year_model || editing.year);

      // Fetch years for selected model
      const yearsRes = await fetch(`${FIPE_BASE}/cars/brands/${selectedBrandCode}/models/${selectedModelCode}/years`);
      if (!yearsRes.ok) throw new Error("Erro ao buscar anos");
      const years: { code: string; name: string }[] = await yearsRes.json();
      const yearMatch = years.find((y) => y.name.startsWith(targetYear))
        || years.find((y) => y.name.includes(targetYear));

      if (!yearMatch) {
        setFipeError(`Ano ${targetYear} não encontrado na FIPE para este modelo.`);
        return;
      }

      // Get price
      const priceRes = await fetch(`${FIPE_BASE}/cars/brands/${selectedBrandCode}/models/${selectedModelCode}/years/${yearMatch.code}`);
      if (!priceRes.ok) throw new Error("Erro ao buscar preço");
      const priceData = await priceRes.json();
      const priceStr = priceData.price || priceData.Valor || "";
      const valor = parseFloat(priceStr.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
      setEditing((prev) => prev ? { ...prev, fipe_price: valor, suggested_price: parseFloat((valor * 1.1).toFixed(2)) } : prev);
      toast.success(`FIPE encontrado: ${priceStr} (Ref: ${priceData.referenceMonth || priceData.MesReferencia || ""})`);
    } catch (err: any) {
      setFipeError(err?.message || "Erro ao consultar a API FIPE.");
    } finally {
      setFipeLoading(false);
    }
  }, [selectedBrandCode, selectedModelCode, editing?.year, editing?.year_model]);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as VehicleRow[];
    },
  });

  const loadExtraImages = async (vehicleId: string) => {
    const { data } = await supabase.from("vehicle_images").select("*").eq("vehicle_id", vehicleId).order("sort_order", { ascending: true });
    setExtraImages((data || []).map((img: any) => ({ id: img.id, image_url: img.image_url, image_position: img.image_position })));
  };

  const loadExpenses = async (vehicleId: string) => {
    const { data } = await supabase.from("vehicle_expenses").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: true });
    setExpenses((data || []).map((e: any) => ({ id: e.id, description: e.description, amount: Number(e.amount) })));
  };

  // Auto-calculate total cost
  useEffect(() => {
    if (!editing) return;
    const purchasePrice = Number(editing.purchase_price) || 0;
    const expensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    setEditing((prev) => prev ? { ...prev, extra_expenses_total: expensesTotal, total_cost: purchasePrice + expensesTotal } : prev);
  }, [editing?.purchase_price, expenses]);

  const saveMutation = useMutation({
    mutationFn: async (vehicle: Partial<VehicleRow>) => {
      const { id, created_at, updated_at, ...rest } = vehicle as VehicleRow;
      let vehicleId = id;

      if (vehicleId) {
        const { error } = await supabase.from("vehicles").update(rest as any).eq("id", vehicleId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("vehicles").insert(rest as any).select("id").single();
        if (error) throw error;
        vehicleId = data.id;
      }

      // Sync extra images
      await supabase.from("vehicle_images").delete().eq("vehicle_id", vehicleId!);
      if (extraImages.length > 0) {
        const rows = extraImages.map((img, i) => ({
          vehicle_id: vehicleId!,
          image_url: img.image_url,
          image_position: img.image_position || null,
          sort_order: i,
        }));
        await supabase.from("vehicle_images").insert(rows);
      }

      // Sync expenses
      await supabase.from("vehicle_expenses").delete().eq("vehicle_id", vehicleId!);
      if (expenses.length > 0) {
        const rows = expenses.map((e) => ({ vehicle_id: vehicleId!, description: e.description, amount: e.amount }));
        await supabase.from("vehicle_expenses").insert(rows);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["public-vehicles"] });
      setEditing(null);
      setExtraImages([]);
      setExpenses([]);
      toast.success("Veículo salvo com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar veículo."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["public-vehicles"] });
      toast.success("Veículo removido.");
    },
  });

  const toggleWebsite = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      await supabase.from("vehicles").update({ show_on_website: value } as any).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["public-vehicles"] });
    },
  });

  const validateFields = (): string | null => {
    if (!editing) return "Nenhum veículo em edição";
    const plate = editing.plate?.trim();
    if (plate && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plate)) {
      return "Placa inválida. Use o formato Mercosul (ABC1D23) ou antigo (ABC1234).";
    }
    const renavam = editing.renavam?.trim();
    if (renavam && !/^\d{11}$/.test(renavam)) {
      return "RENAVAM inválido. Deve conter exatamente 11 dígitos numéricos.";
    }
    if (renavam && renavam.length === 11) {
      const digits = renavam.split("").map(Number);
      const weights = [3,2,9,8,7,6,5,4,3,2];
      const sum = weights.reduce((acc, w, i) => acc + digits[i] * w, 0);
      const rem = (sum * 10) % 11;
      const dv = rem >= 10 ? 0 : rem;
      if (dv !== digits[10]) return "RENAVAM inválido. Dígito verificador incorreto.";
    }
    const chassis = editing.chassis?.trim();
    if (chassis && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(chassis)) {
      return "Chassi/VIN inválido. Deve conter 17 caracteres alfanuméricos (sem I, O, Q).";
    }
    const crv = editing.crv?.trim();
    if (crv && !/^[A-Z0-9]{12}$/.test(crv.toUpperCase())) {
      return "CRV inválido. Deve conter 12 caracteres alfanuméricos.";
    }
    return null;
  };

  const handleSave = () => {
    if (!editing) return;
    const error = validateFields();
    if (error) {
      toast.error(error);
      return;
    }
    saveMutation.mutate(editing);
  };

  const startEditing = async (vehicle?: Partial<VehicleRow>) => {
    if (vehicle?.id) {
      setEditing(vehicle);
      await loadExtraImages(vehicle.id);
      await loadExpenses(vehicle.id);
    } else {
      setEditing({ ...emptyVehicle });
      setExtraImages([]);
      setExpenses([]);
    }
    setHighlightInput("");
    setAccessoryInput("");
    setFipeError("");
    // Resolve FIPE codes for existing vehicle
    if (vehicle?.brand) {
      const brandMatch = fipeBrands.find((b) => b.name.toLowerCase() === vehicle.brand!.toLowerCase())
        || fipeBrands.find((b) => b.name.toLowerCase().includes(vehicle.brand!.toLowerCase()));
      if (brandMatch) {
        setSelectedBrandCode(brandMatch.code);
        // Fetch models to resolve model code
        try {
          const res = await fetch(`${FIPE_BASE}/cars/brands/${brandMatch.code}/models`);
          const models = await res.json();
          setFipeModels(models || []);
          if (vehicle.model) {
            const modelMatch = models.find((m: any) => m.name.toLowerCase().includes(vehicle.model!.toLowerCase()));
            setSelectedModelCode(modelMatch?.code || "");
          }
        } catch { setFipeModels([]); }
      } else {
        setSelectedBrandCode("");
        setSelectedModelCode("");
      }
    } else {
      setSelectedBrandCode("");
      setSelectedModelCode("");
      setFipeModels([]);
    }
  };

  const addTag = (field: "highlights" | "accessories", input: string, setInput: (v: string) => void) => {
    if (!input.trim() || !editing) return;
    setEditing({ ...editing, [field]: [...(editing[field] as string[] || []), input.trim()] });
    setInput("");
  };

  const removeTag = (field: "highlights" | "accessories", index: number) => {
    if (!editing) return;
    const arr = [...(editing[field] as string[] || [])];
    arr.splice(index, 1);
    setEditing({ ...editing, [field]: arr });
  };

  const addExpense = () => setExpenses([...expenses, { description: "", amount: 0 }]);
  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));
  const updateExpense = (i: number, field: keyof Expense, value: string | number) => {
    const updated = [...expenses];
    (updated[i] as any)[field] = value;
    setExpenses(updated);
  };

  const daysInStock = (entryDate: string | undefined) => {
    if (!entryDate) return 0;
    return Math.floor((Date.now() - new Date(entryDate).getTime()) / 86400000);
  };

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const q = searchTerm.toLowerCase();
    return vehicles.filter((v) => `${v.brand} ${v.model} ${v.version} ${v.plate}`.toLowerCase().includes(q));
  }, [vehicles, searchTerm]);

  const grossMargin = (editing: Partial<VehicleRow> | null) => {
    if (!editing) return 0;
    return (Number(editing.price) || 0) - (Number(editing.total_cost) || 0);
  };

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl text-foreground">Veículos</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-48" />
          </div>
          <button onClick={() => startEditing()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">
            <Plus size={16} /> Novo Veículo
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-foreground">{editing.id ? "Editar" : "Novo"} Veículo</h2>
            <button onClick={() => { setEditing(null); setExtraImages([]); setExpenses([]); }} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>

          {/* ============ TOGGLES PROMINENTES ============ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                {editing.show_on_website ? <Eye className="h-6 w-6 text-primary" /> : <EyeOff className="h-6 w-6 text-muted-foreground" />}
                <div>
                  <p className="font-display font-bold text-foreground text-sm">Exibir no Site</p>
                  <p className="text-xs text-muted-foreground">Veículo visível na página pública</p>
                </div>
              </div>
              <Switch checked={editing.show_on_website ?? false} onCheckedChange={(v) => setEditing({ ...editing, show_on_website: v })} className="scale-125" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <Star className={`h-6 w-6 ${editing.featured ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-display font-bold text-foreground text-sm">Em Destaque</p>
                  <p className="text-xs text-muted-foreground">Destacar na home do site</p>
                </div>
              </div>
              <Switch checked={editing.featured ?? false} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} className="scale-125" />
            </div>
          </div>

          {/* ============ PROMOÇÃO ============ */}
          <fieldset className="border-2 border-red-500/30 bg-red-500/5 rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground flex items-center gap-2">
              🏷️ Promoção
            </legend>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-display font-bold text-foreground text-sm">Veículo em promoção</p>
                <p className="text-xs text-muted-foreground">Exibe selo animado e preço "De/Por" no site</p>
              </div>
              <Switch
                checked={editing.is_promotion ?? false}
                onCheckedChange={(v) => setEditing({ ...editing, is_promotion: v })}
                className="scale-125"
              />
            </div>
            {editing.is_promotion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Preço promocional (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    value={editing.promotion_price ?? ""}
                    onChange={(e) => setEditing({ ...editing, promotion_price: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    placeholder="Ex: 89900.00"
                  />
                  <span className="text-[10px] text-muted-foreground">Deve ser menor que o preço normal</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Texto do selo</label>
                  <input
                    className={inputClass}
                    maxLength={20}
                    value={editing.promotion_label ?? "OFERTA"}
                    onChange={(e) => setEditing({ ...editing, promotion_label: e.target.value })}
                    placeholder="OFERTA"
                  />
                  <span className="text-[10px] text-muted-foreground">Ex: OFERTA, BLACK FRIDAY, FEIRÃO</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Válida até</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={editing.promotion_until ?? ""}
                    onChange={(e) => setEditing({ ...editing, promotion_until: e.target.value || null })}
                  />
                  <span className="text-[10px] text-muted-foreground">Opcional. Após essa data desativa sozinha.</span>
                </div>
              </div>
            )}
          </fieldset>

          {/* ============ IDENTIFICAÇÃO ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Identificação</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Placa</label>
                <input className={inputClass} value={(() => { const p = editing.plate || ""; if (p.length <= 3) return p; return p.slice(0, 3) + "-" + p.slice(3); })()} maxLength={8} onChange={(e) => { const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7); setEditing({ ...editing, plate: raw }); }} placeholder="ABC-1D23" />
                <span className="text-[10px] text-muted-foreground">Formato: ABC-1D23 ou ABC-1234</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">RENAVAM</label>
                <input className={inputClass} value={editing.renavam || ""} maxLength={11} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 11); setEditing({ ...editing, renavam: raw }); }} placeholder="00000000000" />
                {(() => {
                  const r = editing.renavam?.trim() || "";
                  if (r.length === 11) {
                    const digits = r.split("").map(Number);
                    const weights = [3,2,9,8,7,6,5,4,3,2];
                    const sum = weights.reduce((acc, w, i) => acc + digits[i] * w, 0);
                    const rem = (sum * 10) % 11;
                    const dv = rem >= 10 ? 0 : rem;
                    const valid = dv === digits[10];
                    return <span className={`text-[10px] font-medium ${valid ? "text-green-600" : "text-destructive"}`}>{valid ? "✓ Dígito verificador válido" : "✗ Dígito verificador inválido"}</span>;
                  }
                  return <span className="text-[10px] text-muted-foreground">11 dígitos numéricos</span>;
                })()}
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Chassi / VIN</label>
                <input className={inputClass} value={editing.chassis || ""} maxLength={17} onChange={(e) => setEditing({ ...editing, chassis: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "") })} placeholder="9BWZZZ377VT004251" />
                <span className="text-[10px] text-muted-foreground">17 caracteres (sem I, O, Q)</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">CRV</label>
                <input className={inputClass} value={editing.crv || ""} maxLength={12} onChange={(e) => setEditing({ ...editing, crv: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="ABC123456789" />
                <span className="text-[10px] text-muted-foreground">12 caracteres alfanuméricos</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Nº do Motor</label>
                <input className={inputClass} value={editing.engine_number || ""} onChange={(e) => setEditing({ ...editing, engine_number: e.target.value })} />
              </div>
            </div>
          </fieldset>

          {/* ============ PROPRIEDADE E DOCUMENTAÇÃO ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Propriedade e Documentação</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Propriedade</label>
                <select className={inputClass} value={editing.ownership_type || "proprio"} onChange={(e) => setEditing({ ...editing, ownership_type: e.target.value })}>
                  {ownershipOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Proprietário Atual</label><input className={inputClass} value={editing.current_owner || ""} onChange={(e) => setEditing({ ...editing, current_owner: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Potência (CV)</label><input className={inputClass} value={editing.power_cv || ""} onChange={(e) => setEditing({ ...editing, power_cv: e.target.value })} placeholder="Ex: 170" /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">IPVA Exercício</label><input className={inputClass} value={editing.dpvat_year || ""} onChange={(e) => setEditing({ ...editing, dpvat_year: e.target.value })} placeholder="Ex: 2025" /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Licenciamento Exercício</label><input className={inputClass} value={editing.licensing_year || ""} onChange={(e) => setEditing({ ...editing, licensing_year: e.target.value })} placeholder="Ex: 2025" /></div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Garantia de Fábrica</label>
                <input type="date" className={inputClass} value={editing.factory_warranty_date || ""} onChange={(e) => setEditing({ ...editing, factory_warranty_date: e.target.value || null })} />
              </div>
            </div>
          </fieldset>

          {/* ============ OBSERVAÇÕES INTERNAS ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Observações Internas</legend>
            <textarea className={inputClass + " min-h-[100px] resize-y"} value={editing.internal_notes || ""} onChange={(e) => setEditing({ ...editing, internal_notes: e.target.value })} placeholder="Anotações internas sobre o veículo (não aparece no site)" rows={4} />
          </fieldset>

          {/* ============ DETALHES DO VEÍCULO ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Detalhes do Veículo</legend>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Nome de Exibição no Site</label>
                <input className={inputClass} value={editing.display_name || ""} onChange={(e) => setEditing({ ...editing, display_name: e.target.value })} placeholder="Ex: Corolla XEi 2.0 - Nome personalizado para o site" />
                <p className="text-[10px] text-muted-foreground mt-1">Se preenchido, este nome aparecerá no site público em vez do nome da FIPE.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Marca (FIPE)</label>
                <select className={inputClass} value={editing.brand || ""} onChange={(e) => {
                  const selected = fipeBrands.find((b) => b.name === e.target.value);
                  setEditing({ ...editing, brand: e.target.value, model: "", version: "" });
                  setSelectedBrandCode(selected?.code || "");
                  setSelectedModelCode("");
                  setFipeModels([]);
                }}>
                  <option value="">Selecione a marca</option>
                  {fipeBrands.map((b) => <option key={b.code} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Modelo</label>
                <select className={inputClass} value={editing.model || ""} disabled={!selectedBrandCode || fipeModelsLoading} onChange={(e) => {
                  const selected = fipeModels.find((m) => m.name === e.target.value);
                  setEditing({ ...editing, model: e.target.value });
                  setSelectedModelCode(selected?.code || "");
                }}>
                  <option value="">{fipeModelsLoading ? "Carregando..." : "Selecione o modelo"}</option>
                  {fipeModels.map((m) => <option key={m.code} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Versão</label><input className={inputClass} value={editing.version || ""} onChange={(e) => setEditing({ ...editing, version: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Ano Fabricação</label><input type="number" className={inputClass} value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Ano Modelo</label><input type="number" className={inputClass} value={editing.year_model || ""} onChange={(e) => setEditing({ ...editing, year_model: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Cor Externa</label><input className={inputClass} value={editing.color || ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Cor Interna</label><input className={inputClass} value={editing.internal_color || ""} onChange={(e) => setEditing({ ...editing, internal_color: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Quilometragem</label><input type="number" className={inputClass} value={editing.km || ""} onChange={(e) => setEditing({ ...editing, km: parseInt(e.target.value) || 0 })} /></div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Combustível</label>
                <select className={inputClass} value={editing.fuel || "Flex"} onChange={(e) => setEditing({ ...editing, fuel: e.target.value })}>
                  <option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Elétrico</option><option>Híbrido</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Câmbio</label>
                <select className={inputClass} value={editing.transmission || "Automático"} onChange={(e) => setEditing({ ...editing, transmission: e.target.value })}>
                  <option>Automático</option><option>Manual</option><option>CVT</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Portas</label><input type="number" className={inputClass} value={editing.doors || 4} onChange={(e) => setEditing({ ...editing, doors: parseInt(e.target.value) || 4 })} /></div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Status</label>
                <select className={inputClass} value={editing.status || "em_estoque"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* ============ ESTOQUE ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Estoque</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Data de Entrada</label><input type="date" className={inputClass} value={editing.entry_date || ""} onChange={(e) => setEditing({ ...editing, entry_date: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Localização no Pátio</label><input className={inputClass} value={editing.yard_location || ""} onChange={(e) => setEditing({ ...editing, yard_location: e.target.value })} placeholder="Ex: Vaga A3" /></div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Dias em Estoque</label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${daysInStock(editing.entry_date) > 45 ? "text-destructive" : "text-foreground"}`}>
                    {daysInStock(editing.entry_date)} dias
                  </span>
                  {daysInStock(editing.entry_date) > 45 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ============ VALORES / CUSTOS ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Valores e Custos</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Valor de Compra (R$)</label><input type="number" step="0.01" className={inputClass} value={editing.purchase_price || ""} onChange={(e) => setEditing({ ...editing, purchase_price: parseFloat(e.target.value) || 0 })} /></div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Valor FIPE (R$)</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" className={inputClass + " flex-1"} value={editing.fipe_price || ""} onChange={(e) => setEditing({ ...editing, fipe_price: parseFloat(e.target.value) || 0 })} />
                  <button type="button" onClick={consultarFipe} disabled={fipeLoading} className="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap">
                    {fipeLoading ? "Buscando..." : "🔎 Consultar FIPE"}
                  </button>
                </div>
                {fipeError && <p className="text-xs text-destructive mt-1">{fipeError}</p>}
              </div>
              <div><label className="text-xs text-muted-foreground font-medium mb-1 block">Preço de Venda (R$)</label><input type="number" step="0.01" className={inputClass} value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} /></div>
            </div>

            {/* Despesas extras */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground font-medium">Despesas Extras</label>
                <button onClick={addExpense} className="text-xs text-primary hover:underline">+ Adicionar despesa</button>
              </div>
              {expenses.map((exp, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input className={inputClass + " flex-1"} placeholder="Descrição" value={exp.description} onChange={(e) => updateExpense(i, "description", e.target.value)} />
                  <input type="number" step="0.01" className={inputClass + " w-32"} placeholder="Valor" value={exp.amount || ""} onChange={(e) => updateExpense(i, "amount", parseFloat(e.target.value) || 0)} />
                  <button onClick={() => removeExpense(i)} className="text-destructive hover:text-destructive/80"><X size={16} /></button>
                </div>
              ))}
            </div>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="font-display font-bold text-foreground">{(editing.total_cost || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Preço de Venda</p>
                <p className="font-display font-bold text-foreground">{(editing.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${grossMargin(editing) >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
                <p className="text-xs text-muted-foreground">Margem Bruta</p>
                <p className={`font-display font-bold ${grossMargin(editing) >= 0 ? "text-green-400" : "text-destructive"}`}>
                  {grossMargin(editing).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </fieldset>

          {/* ============ MÍDIA ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Mídia (formato 3:4)</legend>
            <div className="space-y-5">
              {/* Padrão de recorte do veículo */}
              <div className="p-3 rounded-md bg-secondary/50 border border-border">
                <ImagePositionSelector
                  value={editing.image_position}
                  onChange={(pos) => setEditing({ ...editing, image_position: pos })}
                  previewSrc={editing.image_url || extraImages[0]?.image_url}
                  label="Recorte padrão do veículo (3:4)"
                  hint="Aplica-se à foto principal e a todas as fotos adicionais que não tiverem recorte específico."
                />
              </div>

              {/* Imagem principal */}
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <ImageUpload
                  bucket="vehicle-images"
                  value={editing.image_url || ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  label="Imagem Principal"
                  hint="Recomendado: foto vertical ou quadrada para melhor enquadramento 3:4."
                  previewAspect="3/4"
                  previewObjectPosition={objectPositionFor(editing.image_position)}
                />
              </div>

              {/* Fotos adicionais com recorte individual */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-2 block flex items-center gap-1">
                  <ImagePlus size={14} /> Fotos Adicionais
                </label>
                {extraImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                    {extraImages.map((img, i) => {
                      const effectivePos = (img.image_position || editing.image_position || "center") as ImagePosition;
                      return (
                        <div key={i} className="relative group/img p-2 rounded-md border border-border bg-secondary/40">
                          <button
                            type="button"
                            onClick={() => setExtraImages(extraImages.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 z-10 p-1 bg-destructive text-destructive-foreground rounded-full opacity-80 hover:opacity-100"
                            title="Remover foto"
                          >
                            <X size={12} />
                          </button>
                          <div className="w-full aspect-[3/4] rounded overflow-hidden border border-border bg-background mb-2">
                            <img
                              src={img.image_url}
                              alt=""
                              style={{ objectPosition: objectPositionFor(effectivePos) }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <ImagePositionSelector
                            compact
                            value={img.image_position || editing.image_position}
                            onChange={(pos) => {
                              const updated = [...extraImages];
                              updated[i] = { ...updated[i], image_position: pos };
                              setExtraImages(updated);
                            }}
                            label=""
                            hint=""
                          />
                          {!img.image_position && (
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              Usando recorte padrão do veículo
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <ImageUpload
                  bucket="vehicle-images"
                  value=""
                  multiple
                  onChange={(url) => { if (url) setExtraImages([...extraImages, { image_url: url, image_position: null }]); }}
                  onMultiple={(urls) => setExtraImages([...extraImages, ...urls.map((u) => ({ image_url: u, image_position: null }))])}
                  label=""
                  previewAspect="3/4"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">URL do Vídeo</label>
                <input className={inputClass} value={editing.video_url || ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
            </div>
          </fieldset>

          {/* ============ DESTAQUES E ACESSÓRIOS ============ */}
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="px-2 font-display font-bold text-sm text-foreground">Destaques e Acessórios</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Destaques (tags)</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {(editing.highlights || []).map((h, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded">{h} <button onClick={() => removeTag("highlights", i)}><X size={12} /></button></span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputClass} value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} placeholder="Ex: Teto Solar" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("highlights", highlightInput, setHighlightInput))} />
                  <button onClick={() => addTag("highlights", highlightInput, setHighlightInput)} className="px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm hover:bg-primary hover:text-primary-foreground transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Opcionais / Acessórios</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {(editing.accessories || []).map((a, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-secondary text-foreground text-xs rounded">{a} <button onClick={() => removeTag("accessories", i)}><X size={12} /></button></span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputClass} value={accessoryInput} onChange={(e) => setAccessoryInput(e.target.value)} placeholder="Ex: Ar Condicionado" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("accessories", accessoryInput, setAccessoryInput))} />
                  <button onClick={() => addTag("accessories", accessoryInput, setAccessoryInput)} className="px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm hover:bg-primary hover:text-primary-foreground transition-colors">+</button>
                </div>
              </div>
            </div>
          </fieldset>

          {/* ============ DESCRIÇÃO ============ */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Descrição</label>
            <textarea className={inputClass + " resize-none"} rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => { setEditing(null); setExtraImages([]); setExpenses([]); }} className="px-4 py-2 border border-border text-muted-foreground rounded-sm text-sm hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saveMutation.isPending} className="px-6 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* ============ LISTAGEM ============ */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum veículo encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3 px-3 text-muted-foreground font-medium">Veículo</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Placa</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Ano</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Preço</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Status</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-center">No Site</th>
                <th className="py-3 px-3 text-muted-foreground font-medium">Dias</th>
                <th className="py-3 px-3 text-muted-foreground font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const days = daysInStock(v.entry_date);
                return (
                  <tr key={v.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {v.image_url && (
                          <img
                            src={v.image_url}
                            alt=""
                            style={{ objectPosition: objectPositionFor(v.image_position) }}
                            className="w-12 aspect-[3/4] object-cover rounded border border-border"
                          />
                        )}
                        <div>
                          <p className="text-foreground font-medium">{v.brand} {v.model}</p>
                          <p className="text-muted-foreground text-xs">{v.version}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-foreground font-mono text-xs">{v.plate || "—"}</td>
                    <td className="py-3 px-3 text-foreground">{v.year}</td>
                    <td className="py-3 px-3 text-foreground font-medium">{Number(v.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3">
                      <Badge variant={v.status === "vendido" ? "default" : v.status === "reservado" ? "secondary" : "outline"} className="text-xs">
                        {statusOptions.find((s) => s.value === v.status)?.label || v.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleWebsite.mutate({ id: v.id, value: !v.show_on_website })}
                        title={v.show_on_website ? "Visível no site" : "Oculto do site"}
                      >
                        {v.show_on_website ? <Eye className="h-5 w-5 text-green-400 mx-auto" /> : <EyeOff className="h-5 w-5 text-muted-foreground mx-auto" />}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-medium ${days > 45 ? "text-destructive" : "text-foreground"}`}>
                        {days}d {days > 45 && <AlertTriangle className="inline h-3 w-3" />}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => startEditing(v)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => { if (confirm("Remover este veículo?")) deleteMutation.mutate(v.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors ml-1"><Trash2 size={16} /></button>
                    </td>
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

export default AdminVehicles;
