import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, Database, Image as ImageIcon, FileText, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const AdminBackup = () => {
  const { isMaster } = useAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [stats, setStats] = useState<{ done: number; total: number; failed: number } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  if (!isMaster) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-destructive" size={48} />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Apenas administradores Master podem exportar backups completos do sistema.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const fetchAsBlob = async (url: string): Promise<Blob | null> => {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return await r.blob();
    } catch {
      return null;
    }
  };

  const handleExport = async () => {
    setRunning(true);
    setStats(null);
    setProgress("Coletando dados do banco...");
    try {
      const { data, error } = await supabase.functions.invoke("export-backup");
      if (error) throw error;

      const zip = new JSZip();

      // database.json
      zip.file("manifest.json", JSON.stringify(data.manifest, null, 2));
      zip.file("database.json", JSON.stringify(data.tables, null, 2));
      zip.file("auth_users.json", JSON.stringify(data.auth_users, null, 2));

      // README
      zip.file(
        "README.md",
        `# Backup Wale Automóveis\n\nGerado em: ${data.manifest.generated_at}\n\n## Conteúdo\n- database.json — todas as tabelas (${Object.keys(data.tables).length})\n- auth_users.json — usuários administradores (sem senhas — devem ser recriadas no destino)\n- manifest.json — metadados e contagem\n- media/ — todos os arquivos dos buckets de storage\n\n## Como restaurar\n1. Crie um novo projeto Supabase / Lovable Cloud\n2. Aplique as migrations (estrutura das tabelas)\n3. Faça insert dos JSONs em cada tabela correspondente\n4. Faça upload do conteúdo de \`media/{bucket}/\` no bucket equivalente\n5. Recadastre os usuários admin (senhas não são exportadas por segurança)\n`
      );

      // Download all media
      const allMedia: { bucket: string; path: string; public_url: string }[] = [];
      for (const [bucket, files] of Object.entries(data.buckets) as any) {
        for (const f of files) allMedia.push({ bucket, ...f });
      }

      let done = 0;
      let failed = 0;
      const total = allMedia.length;
      setStats({ done, total, failed });

      // Download in parallel batches
      const BATCH = 6;
      for (let i = 0; i < allMedia.length; i += BATCH) {
        const batch = allMedia.slice(i, i + BATCH);
        await Promise.all(
          batch.map(async (f) => {
            setProgress(`Baixando mídia ${done + 1}/${total}: ${f.path}`);
            const blob = await fetchAsBlob(f.public_url);
            if (blob) {
              zip.file(`media/${f.bucket}/${f.path}`, blob);
            } else {
              failed++;
            }
            done++;
            setStats({ done, total, failed });
          })
        );
      }

      setProgress("Compactando arquivo ZIP...");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" }, (meta) => {
        setProgress(`Compactando... ${Math.round(meta.percent)}%`);
      });

      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `wale-backup-${ts}.zip`;
      saveAs(blob, filename);
      setLastBackup(filename);
      setProgress("Backup concluído!");
    } catch (e) {
      setProgress(`Erro: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Backup do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Exporte todos os dados, mídias e configurações em um único arquivo ZIP.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">O que será exportado</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Item icon={Database} title="Banco de dados" desc="Todas as tabelas: veículos, banners, contatos, depoimentos, configurações, usuários admin, despesas e movimentações." />
            <Item icon={ImageIcon} title="Imagens" desc="Fotos de veículos, banners e logos." />
            <Item icon={FileText} title="Documentos" desc="CRLV, notas fiscais e demais arquivos anexados aos veículos." />
            <Item icon={ShieldAlert} title="Usuários admin" desc="Lista de e-mails e permissões. Senhas NÃO são exportadas (recadastrar no destino)." />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <button
            onClick={handleExport}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {running ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {running ? "EXPORTANDO..." : "EXPORTAR BACKUP COMPLETO"}
          </button>

          {running && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">{progress}</p>
              {stats && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: stats.total ? `${(stats.done / stats.total) * 100}%` : "0%" }}
                  />
                </div>
              )}
              {stats && (
                <p className="text-xs text-muted-foreground">
                  {stats.done}/{stats.total} mídias {stats.failed > 0 && `(${stats.failed} falharam)`}
                </p>
              )}
            </div>
          )}

          {!running && lastBackup && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded text-sm text-foreground">
              <CheckCircle2 size={18} className="text-primary" />
              Backup gerado: <strong>{lastBackup}</strong>
            </div>
          )}
        </div>

        <div className="bg-secondary/40 border border-border rounded-lg p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">⚠️ Recomendação:</strong> Armazene este arquivo em local seguro (Google Drive, Dropbox, HD externo). Faça backups periódicos (semanal ou mensal) e antes de qualquer mudança grande no sistema.
        </div>
      </div>
    </AdminLayout>
  );
};

const Item = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="flex gap-3 p-3 bg-secondary/30 rounded-md">
    <Icon size={18} className="text-primary mt-0.5 shrink-0" />
    <div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </div>
);

export default AdminBackup;
