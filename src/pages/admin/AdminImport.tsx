import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type ImportPayload = {
  vehicles?: any[];
  vehicle_images?: any[];
  banners?: any[];
  testimonials?: any[];
  site_settings?: any[];
};

const TABLES: (keyof ImportPayload)[] = [
  "site_settings",
  "banners",
  "testimonials",
  "vehicles",
  "vehicle_images",
];

const SAMPLE_EXPORT_SQL = `-- Execute estas queries no SQL Editor do projeto ORIGINAL
-- e cole o resultado JSON consolidado abaixo no formato:
-- { "vehicles": [...], "vehicle_images": [...], "banners": [...], "testimonials": [...], "site_settings": [...] }

SELECT json_build_object(
  'vehicles',       (SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM public.vehicles v),
  'vehicle_images', (SELECT COALESCE(json_agg(row_to_json(i)), '[]'::json) FROM public.vehicle_images i),
  'banners',        (SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) FROM public.banners b),
  'testimonials',   (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM public.testimonials t),
  'site_settings',  (SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM public.site_settings s)
) AS export;`;

const AdminImport = () => {
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [rawText, setRawText] = useState("");
  const [parseError, setParseError] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, { ok: number; fail: number; error?: string }>>({});
  const [wipeFirst, setWipeFirst] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      setRawText(text);
      tryParse(text);
    };
    reader.readAsText(file);
  };

  const tryParse = (text: string) => {
    setParseError("");
    setPayload(null);
    if (!text.trim()) return;
    try {
      let parsed = JSON.parse(text);
      // Suporta formato { export: {...} } vindo direto do json_build_object
      if (parsed?.export) parsed = parsed.export;
      // Suporta um array vindo do Supabase SQL Editor: [{ export: {...} }]
      if (Array.isArray(parsed) && parsed[0]?.export) parsed = parsed[0].export;
      if (typeof parsed !== "object" || !parsed) throw new Error("JSON inválido");
      setPayload(parsed as ImportPayload);
    } catch (err: any) {
      setParseError(err.message || "JSON inválido");
    }
  };

  const counts = payload
    ? TABLES.map((t) => ({ table: t, count: Array.isArray(payload[t]) ? payload[t]!.length : 0 }))
    : [];

  const runImport = async () => {
    if (!payload) return;
    setRunning(true);
    const newResults: typeof results = {};

    // Wipe na ordem inversa (respeitando dependências lógicas)
    if (wipeFirst) {
      const wipeOrder: (keyof ImportPayload)[] = ["vehicle_images", "vehicles", "banners", "testimonials", "site_settings"];
      for (const table of wipeOrder) {
        await supabase.from(table as any).delete().not("id", "is", null);
      }
    }

    for (const table of TABLES) {
      const rows = payload[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        newResults[table] = { ok: 0, fail: 0 };
        continue;
      }

      // upsert em lotes de 100
      let ok = 0;
      let fail = 0;
      let lastError = "";
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error, count } = await supabase
          .from(table as any)
          .upsert(chunk, { onConflict: "id", count: "exact" });
        if (error) {
          fail += chunk.length;
          lastError = error.message;
        } else {
          ok += count ?? chunk.length;
        }
      }
      newResults[table] = { ok, fail, error: lastError || undefined };
      setResults({ ...newResults });
    }

    setRunning(false);
  };

  const totalOk = Object.values(results).reduce((s, r) => s + r.ok, 0);
  const totalFail = Object.values(results).reduce((s, r) => s + r.fail, 0);

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-foreground mb-2">Importar dados do site original</h1>
        <p className="text-muted-foreground mb-8">
          Cole abaixo um JSON exportado do banco do projeto original. As tabelas serão preenchidas via upsert (atualiza por <code>id</code>).
        </p>

        {/* Instruções de exportação */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-primary" />
            <h2 className="font-display font-bold text-lg">1. Exporte do projeto original</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            No projeto original, abra o SQL Editor do backend e execute a query abaixo. Salve o resultado como <code>export.json</code>.
          </p>
          <pre className="bg-secondary/50 p-4 rounded text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{SAMPLE_EXPORT_SQL}
          </pre>
        </div>

        {/* Upload */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Upload size={18} className="text-primary" />
            <h2 className="font-display font-bold text-lg">2. Cole ou envie o JSON</h2>
          </div>

          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:opacity-90 mb-4"
          />

          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              tryParse(e.target.value);
            }}
            placeholder='{ "vehicles": [...], "banners": [...], "testimonials": [...], "site_settings": [...], "vehicle_images": [...] }'
            className="w-full h-48 bg-secondary text-foreground border border-border rounded p-3 font-mono text-xs focus:outline-none focus:border-primary"
          />

          {parseError && (
            <div className="mt-3 flex items-start gap-2 text-destructive text-sm">
              <AlertCircle size={16} className="mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {payload && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              {counts.map((c) => (
                <div key={c.table} className="bg-secondary/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{c.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.table}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execução */}
        {payload && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display font-bold text-lg mb-3">3. Importar</h2>
            <label className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <input type="checkbox" checked={wipeFirst} onChange={(e) => setWipeFirst(e.target.checked)} />
              Apagar todos os dados existentes antes de importar (cuidado!)
            </label>

            <button
              onClick={runImport}
              disabled={running}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              {running ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {running ? "IMPORTANDO..." : "INICIAR IMPORTAÇÃO"}
            </button>

            {Object.keys(results).length > 0 && (
              <div className="mt-6 space-y-2">
                {TABLES.map((table) => {
                  const r = results[table];
                  if (!r) return null;
                  const success = r.fail === 0;
                  return (
                    <div key={table} className="flex items-start gap-3 p-3 bg-secondary/40 rounded">
                      {success ? (
                        <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="text-destructive mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">{table}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.ok} importados · {r.fail} falhas
                        </div>
                        {r.error && <div className="text-xs text-destructive mt-1">{r.error}</div>}
                      </div>
                    </div>
                  );
                })}

                {!running && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded text-sm">
                    <strong className="text-foreground">Concluído:</strong>{" "}
                    <span className="text-muted-foreground">
                      {totalOk} registros importados, {totalFail} falhas no total.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminImport;
