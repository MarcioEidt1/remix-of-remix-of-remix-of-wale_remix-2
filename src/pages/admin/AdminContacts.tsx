import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminContacts = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("contacts").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contacts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      toast.success("Contato removido.");
    },
  });

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Contatos</h1>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhuma mensagem recebida.</div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className={`bg-card border rounded-lg p-4 ${c.is_read ? "border-border" : "border-primary/40"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {!c.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-muted-foreground text-xs">{c.email} {c.phone && `· ${c.phone}`}</p>
                  <p className="text-foreground text-sm mt-2 whitespace-pre-wrap">{c.message}</p>
                  <p className="text-muted-foreground text-xs mt-2">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => markReadMutation.mutate({ id: c.id, is_read: !c.is_read })}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    title={c.is_read ? "Marcar como não lido" : "Marcar como lido"}
                  >
                    {c.is_read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </button>
                  <button
                    onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(c.id); }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContacts;
