import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Copy, ExternalLink, Rss, FileJson, PlayCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TestResult = {
  status: number;
  ok: boolean;
  durationMs: number;
  contentType: string;
  cacheControl: string;
  sizeKb: number;
  count: number;
  preview: Array<{ title: string; price?: number; url?: string }>;
  raw: string;
  error?: string;
};

async function runFeedTest(url: string, kind: "xml" | "json"): Promise<TestResult> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const durationMs = Math.round(performance.now() - t0);
    const sizeKb = Math.round((new Blob([text]).size / 1024) * 10) / 10;
    const contentType = res.headers.get("content-type") || "";
    const cacheControl = res.headers.get("cache-control") || "";
    let count = 0;
    let preview: TestResult["preview"] = [];
    if (res.ok) {
      if (kind === "json") {
        try {
          const json = JSON.parse(text);
          const items = Array.isArray(json.items) ? json.items : [];
          count = json.count ?? items.length;
          preview = items.slice(0, 5).map((i: any) => ({ title: i.title, price: i.price, url: i.url }));
        } catch {/* ignore */}
      } else {
        const matches = text.match(/<item[\s>]/gi);
        count = matches ? matches.length : 0;
        const itemRegex = /<item[\s\S]*?<\/item>/gi;
        const items = text.match(itemRegex) || [];
        preview = items.slice(0, 5).map((block) => {
          const title = (block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          const link = (block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
          const priceStr = block.match(/<g:price>([\d.]+)/i)?.[1];
          return { title, url: link, price: priceStr ? Number(priceStr) : undefined };
        });
      }
    }
    return {
      status: res.status,
      ok: res.ok,
      durationMs,
      contentType,
      cacheControl,
      sizeKb,
      count,
      preview,
      raw: text.slice(0, 2000),
      error: res.ok ? undefined : text.slice(0, 200),
    };
  } catch (e: any) {
    return {
      status: 0, ok: false, durationMs: Math.round(performance.now() - t0),
      contentType: "", cacheControl: "", sizeKb: 0, count: 0, preview: [], raw: "",
      error: e?.message || "Falha de rede",
    };
  }
}

const TestResultPanel = ({ result, kind }: { result: TestResult; kind: "xml" | "json" }) => (
  <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
    <div className="flex items-center gap-2 text-sm">
      {result.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
      <span className="font-semibold">
        {result.ok ? "Feed respondendo" : "Falha ao carregar"}
      </span>
      <span className="text-muted-foreground">HTTP {result.status || "—"} · {result.durationMs}ms · {result.sizeKb} KB</span>
    </div>
    {result.error && <p className="text-red-600">{result.error}</p>}
    {result.ok && (
      <>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div><strong>Itens:</strong> {result.count}</div>
          <div><strong>Cache:</strong> {result.cacheControl || "—"}</div>
          <div className="col-span-2 truncate"><strong>Content-Type:</strong> {result.contentType}</div>
        </div>
        {result.preview.length > 0 && (
          <div>
            <p className="font-semibold text-foreground mb-1">Primeiras entradas:</p>
            <ul className="space-y-1">
              {result.preview.map((p, i) => (
                <li key={i} className="truncate">
                  {i + 1}. {p.title || "(sem título)"}
                  {p.price ? ` — R$ ${p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        <details className="mt-1">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Ver resposta bruta ({kind.toUpperCase()})
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-background p-2 text-[10px]">{result.raw}</pre>
        </details>
      </>
    )}
  </div>
);

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const FN_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1`;

const CACHE_OPTIONS = [
  { value: "0", label: "Tempo real (sem cache)" },
  { value: "300", label: "5 minutos (recomendado)" },
  { value: "900", label: "15 minutos" },
  { value: "3600", label: "1 hora" },
  { value: "21600", label: "6 horas" },
  { value: "86400", label: "24 horas" },
];

const AdminFeeds = () => {
  const qc = useQueryClient();
  const [xmlEnabled, setXmlEnabled] = useState(true);
  const [jsonEnabled, setJsonEnabled] = useState(true);
  const [cacheSeconds, setCacheSeconds] = useState("300");
  const [detailLevel, setDetailLevel] = useState("public");
  const [siteUrl, setSiteUrl] = useState("");
  const [xmlTest, setXmlTest] = useState<TestResult | null>(null);
  const [jsonTest, setJsonTest] = useState<TestResult | null>(null);
  const [xmlTesting, setXmlTesting] = useState(false);
  const [jsonTesting, setJsonTesting] = useState(false);

  const testXml = async () => {
    setXmlTesting(true);
    const r = await runFeedTest(xmlUrl, "xml");
    setXmlTest(r);
    setXmlTesting(false);
    r.ok ? toast.success(`XML OK · ${r.count} itens`) : toast.error("Falha ao testar XML");
  };
  const testJson = async () => {
    setJsonTesting(true);
    const r = await runFeedTest(jsonUrl, "json");
    setJsonTest(r);
    setJsonTesting(false);
    r.ok ? toast.success(`JSON OK · ${r.count} itens`) : toast.error("Falha ao testar JSON");
  };

  const { data: settings = [] } = useQuery({
    queryKey: ["feed-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["feed_xml_enabled", "feed_json_enabled", "feed_cache_seconds", "feed_detail_level", "feed_site_url"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleCount = 0 } = useQuery({
    queryKey: ["feed-vehicle-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("show_on_website", true);
      return count ?? 0;
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    settings.forEach((s: any) => { map[s.key] = s.value; });
    setXmlEnabled(map.feed_xml_enabled !== "false");
    setJsonEnabled(map.feed_json_enabled !== "false");
    setCacheSeconds(map.feed_cache_seconds || "300");
    setDetailLevel(map.feed_detail_level || "public");
    setSiteUrl(map.feed_site_url || window.location.origin);
  }, [settings]);

  const xmlUrl = `${FN_BASE}/feed-xml`;
  const jsonUrl = `${FN_BASE}/feed-json`;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        feed_xml_enabled: String(xmlEnabled),
        feed_json_enabled: String(jsonEnabled),
        feed_cache_seconds: cacheSeconds,
        feed_detail_level: detailLevel,
        feed_site_url: siteUrl.trim(),
      };
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas. Cache será atualizado na próxima requisição.");
      qc.invalidateQueries({ queryKey: ["feed-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const cacheLabel = useMemo(
    () => CACHE_OPTIONS.find((o) => o.value === cacheSeconds)?.label || `${cacheSeconds}s`,
    [cacheSeconds],
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Feeds de Catálogo</h1>
          <p className="text-muted-foreground">
            Exporte seu catálogo em XML e JSON para Google Merchant, Meta Catalog, marketplaces e IAs.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>{vehicleCount}</strong> veículos serão incluídos (ativos e visíveis no site).
          </p>
        </div>

        {/* Configurações gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Aplica-se a ambos os feeds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tempo de cache</Label>
              <Select value={cacheSeconds} onValueChange={setCacheSeconds}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CACHE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Menor cache = dados mais frescos, maior consumo. Recomendado: 5 min.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nível de detalhe</Label>
              <Select value={detailLevel} onValueChange={setDetailLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (preço, fotos, destaques)</SelectItem>
                  <SelectItem value="full">Completo (+ ficha técnica)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nunca expõe dados sensíveis (chassi, placa, custos). Apenas controla quanto da ficha pública é incluído.
              </p>
            </div>

            <div className="space-y-2">
              <Label>URL base do site (para gerar links)</Label>
              <Input
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://seusite.com.br"
              />
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </CardContent>
        </Card>

        {/* Feed XML */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Rss className="w-5 h-5 mt-1 text-orange-500" />
                <div>
                  <CardTitle>Feed XML (RSS 2.0)</CardTitle>
                  <CardDescription>
                    Padrão Google Merchant Center / Meta Catalog / portais automotivos
                  </CardDescription>
                </div>
              </div>
              <Switch checked={xmlEnabled} onCheckedChange={setXmlEnabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={xmlUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(xmlUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={xmlUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Cache: <strong>{cacheLabel}</strong> · Status:{" "}
                {xmlEnabled ? <span className="text-green-600">ativo</span> : <span className="text-red-600">desativado</span>}
              </p>
              <Button size="sm" variant="secondary" onClick={testXml} disabled={xmlTesting}>
                {xmlTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                Testar feed
              </Button>
            </div>
            {xmlTest && <TestResultPanel result={xmlTest} kind="xml" />}
          </CardContent>
        </Card>

        {/* Feed JSON */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileJson className="w-5 h-5 mt-1 text-blue-500" />
                <div>
                  <CardTitle>Feed JSON</CardTitle>
                  <CardDescription>
                    Mais leve e moderno — ideal para IAs, apps e integrações personalizadas
                  </CardDescription>
                </div>
              </div>
              <Switch checked={jsonEnabled} onCheckedChange={setJsonEnabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input value={jsonUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(jsonUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={jsonUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Cache: <strong>{cacheLabel}</strong> · Status:{" "}
                {jsonEnabled ? <span className="text-green-600">ativo</span> : <span className="text-red-600">desativado</span>}
              </p>
              <Button size="sm" variant="secondary" onClick={testJson} disabled={jsonTesting}>
                {jsonTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                Testar feed
              </Button>
            </div>
            {jsonTest && <TestResultPanel result={jsonTest} kind="json" />}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">💡 Como usar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• <strong>Google Merchant:</strong> cole a URL XML em "Feeds → Adicionar feed primário"</p>
            <p>• <strong>Meta Catalog:</strong> Commerce Manager → Catálogo → Fontes de dados → URL programada</p>
            <p>• <strong>IA / ChatGPT custom GPT:</strong> use a URL JSON como fonte de dados (Actions / Knowledge)</p>
            <p>• <strong>Cron / scraper externo:</strong> respeitar o cache evita sobrecarga e custos</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeeds;
