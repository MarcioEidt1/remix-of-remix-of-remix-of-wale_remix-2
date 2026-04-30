import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import VehicleCard from "./VehicleCard";
import { mockVehicles } from "@/data/mockVehicles";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const VehiclesSection = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [transmissionFilter, setTransmissionFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortBy, setSortBy] = useState("recent");

  const { data: vehicles } = useQuery({
    queryKey: ["public-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, version, display_name, year, year_model, km, fuel, transmission, color, internal_color, doors, power_cv, price, image_url, image_position, highlights, accessories, description, video_url, is_active, status, is_promotion, promotion_price, promotion_label, promotion_until, featured, show_on_website, factory_warranty_date, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Filter by show_on_website (new column not yet in generated types)
      const activeVehicles = data.filter((v: any) => v.show_on_website === true);

      const vehicleIds = activeVehicles.map((v) => v.id);
      if (vehicleIds.length === 0) return [];

      const { data: images } = await supabase
        .from("vehicle_images")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("sort_order", { ascending: true });

      const imagesByVehicle = (images || []).reduce<Record<string, string[]>>((acc, img) => {
        if (!acc[img.vehicle_id]) acc[img.vehicle_id] = [];
        acc[img.vehicle_id].push(img.image_url);
        return acc;
      }, {});

      return activeVehicles.map((v) => ({ ...v, extra_images: imagesByVehicle[v.id] || [] }));
    },
  });

  // Realtime: auto-refresh when vehicles change
  useEffect(() => {
    const channel = supabase
      .channel("public-vehicles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["public-vehicles"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const allVehicles = vehicles && vehicles.length > 0
    ? vehicles.map((v: any) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        version: v.version,
        display_name: v.display_name || "",
        year: v.year,
        km: v.km,
        fuel: v.fuel,
        transmission: v.transmission,
        price: Number(v.price),
        image: v.image_url,
        images: v.extra_images.length > 0 ? [v.image_url, ...v.extra_images] : [v.image_url],
        highlights: v.highlights || [],
        color: v.color,
        is_promotion: v.is_promotion,
        promotion_price: v.promotion_price,
        promotion_label: v.promotion_label,
        promotion_until: v.promotion_until,
      }))
    : mockVehicles;

  const brands = useMemo(() => [...new Set(allVehicles.map((v) => v.brand).filter(Boolean))].sort(), [allVehicles]);
  const fuels = useMemo(() => [...new Set(allVehicles.map((v) => v.fuel).filter(Boolean))].sort(), [allVehicles]);
  const transmissions = useMemo(() => [...new Set(allVehicles.map((v) => v.transmission).filter(Boolean))].sort(), [allVehicles]);
  const years = useMemo(() => [...new Set(allVehicles.map((v) => v.year))].sort((a, b) => b - a), [allVehicles]);
  const maxPrice = useMemo(() => Math.max(...allVehicles.map((v) => v.price), 500000), [allVehicles]);

  const displayVehicles = useMemo(() => {
    const filtered = allVehicles.filter((v) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || `${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(q);
      const matchesBrand = brandFilter === "all" || v.brand === brandFilter;
      const matchesFuel = fuelFilter === "all" || v.fuel === fuelFilter;
      const matchesTransmission = transmissionFilter === "all" || v.transmission === transmissionFilter;
      const matchesYear = yearFilter === "all" || v.year === Number(yearFilter);
      const matchesPrice = v.price >= priceRange[0] && v.price <= priceRange[1];
      return matchesSearch && matchesBrand && matchesFuel && matchesTransmission && matchesYear && matchesPrice;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "km-asc": return a.km - b.km;
        case "recent":
        default: return 0;
      }
    });
  }, [allVehicles, search, brandFilter, fuelFilter, transmissionFilter, yearFilter, priceRange, sortBy]);

  const hasActiveFilters = search || brandFilter !== "all" || fuelFilter !== "all" || transmissionFilter !== "all" || yearFilter !== "all" || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const clearFilters = () => {
    setSearch("");
    setBrandFilter("all");
    setFuelFilter("all");
    setTransmissionFilter("all");
    setYearFilter("all");
    setPriceRange([0, maxPrice]);
    setSortBy("recent");
  };

  const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <section id="veiculos" className="py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-black text-2xl md:text-4xl text-foreground">
            Nós selecionamos os <span className="text-gradient">melhores carros.</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Nossos veículos são avaliados sob vários critérios de qualidade para garantir a melhor experiência.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 p-4 md:p-6 rounded-lg border border-border bg-card"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar veículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={fuelFilter} onValueChange={setFuelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {fuels.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Câmbio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {transmissions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="km-asc">Menor km</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Preço: {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
              </p>
              <Slider
                min={0}
                max={maxPrice}
                step={5000}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="w-full"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground self-end">
                <X className="h-4 w-4 mr-1" /> Limpar filtros
              </Button>
            )}
          </div>
        </motion.div>

        {displayVehicles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Nenhum veículo encontrado com os filtros selecionados.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVehicles.map((vehicle, i) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            {displayVehicles.length} de {allVehicles.length} veículos
          </p>
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
