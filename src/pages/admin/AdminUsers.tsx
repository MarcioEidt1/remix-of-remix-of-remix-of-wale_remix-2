import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Shield, ShieldCheck, Save, Pencil, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import PasswordInput from "@/components/admin/PasswordInput";

const PERMISSION_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "vehicles", label: "Veículos" },
  { key: "banners", label: "Banners" },
  { key: "contacts", label: "Contatos" },
  { key: "appearance", label: "Aparência" },
  { key: "settings", label: "Configurações" },
  { key: "google", label: "Google" },
  { key: "users", label: "Usuários" },
  { key: "import", label: "Importar dados" },
  { key: "feeds", label: "Feeds Catálogo" },
  { key: "backup", label: "Backup" },
];

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  recovery_email: string | null;
  is_master: boolean;
  permissions: string[];
  created_at: string;
}

const AdminUsers = () => {
  const { session, isMaster } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRecoveryEmail, setNewRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsMaster, setNewIsMaster] = useState(false);
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfileUsername, setEditProfileUsername] = useState("");
  const [editProfileRecovery, setEditProfileRecovery] = useState("");
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: {
          action: "create",
          username: newUsername || null,
          email: newEmail || null,
          recovery_email: newRecoveryEmail,
          password: newPassword,
          is_master: newIsMaster,
          permissions: newIsMaster ? [] : newPermissions,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowForm(false);
      setNewUsername("");
      setNewEmail("");
      setNewRecoveryEmail("");
      setNewPassword("");
      setNewIsMaster(false);
      setNewPermissions([]);
      toast.success("Usuário criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ user_id, username, recovery_email }: { user_id: string; username: string | null; recovery_email: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "update_profile", user_id, username, recovery_email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingProfileId(null);
      toast.success("Dados atualizados!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ user_id, permissions, is_master }: { user_id: string; permissions?: string[]; is_master?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "update", user_id, permissions, is_master },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permissões atualizadas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ user_id, password }: { user_id: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "reset_password", user_id, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setResetPasswordUserId(null);
      setResetPasswordValue("");
      toast.success("Senha redefinida com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "delete", user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePermission = (userId: string, currentPermissions: string[], perm: string) => {
    const updated = currentPermissions.includes(perm)
      ? currentPermissions.filter((p) => p !== perm)
      : [...currentPermissions, perm];
    updateMutation.mutate({ user_id: userId, permissions: updated });
  };

  const toggleNewPermission = (perm: string) => {
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os acessos ao painel administrativo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Criar Usuário</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome de usuário (opcional, ex: joao)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="email"
              placeholder="E-mail de recuperação * (obrigatório)"
              value={newRecoveryEmail}
              onChange={(e) => setNewRecoveryEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="email"
              placeholder="E-mail de login (opcional, usa username se vazio)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <PasswordInput
              placeholder="Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Informe pelo menos um: nome de usuário ou e-mail de login. O e-mail de recuperação é usado para redefinir a senha.
          </p>

          {isMaster && (
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={newIsMaster}
                onChange={(e) => setNewIsMaster(e.target.checked)}
                className="rounded border-border"
              />
              <ShieldCheck size={16} className="text-amber-500" />
              Administrador Master (acesso total)
            </label>
          )}

          {!newIsMaster && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Permissões:</p>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => toggleNewPermission(p.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newPermissions.includes(p.key)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={(!newUsername && !newEmail) || !newRecoveryEmail || !newPassword || createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={16} />
              {createMutation.isPending ? "Criando..." : "Criar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-secondary text-foreground rounded-md text-sm hover:opacity-80"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {user.is_master ? (
                    <ShieldCheck size={20} className="text-amber-500" />
                  ) : (
                    <Shield size={20} className="text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {user.username || user.email}
                      {user.username && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">({user.email})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.recovery_email ? (
                        <>📧 {user.recovery_email}</>
                      ) : (
                        <span className="text-amber-500">⚠️ Sem e-mail de recuperação</span>
                      )}
                      {" · "}
                      {user.is_master ? "Master" : `${user.permissions.length} permissões`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isMaster && (
                    <button
                      onClick={() => {
                        if (editingProfileId === user.id) {
                          setEditingProfileId(null);
                        } else {
                          setEditingProfileId(user.id);
                          setEditProfileUsername(user.username || "");
                          setEditProfileRecovery(user.recovery_email || "");
                        }
                      }}
                      className={`p-2 transition-colors ${editingProfileId === user.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      title="Editar usuário e e-mail"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  {isMaster && !user.is_master && (
                    <button
                      onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                      className={`p-2 transition-colors ${editingUserId === user.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      title="Editar permissões"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {isMaster && (
                    <button
                      onClick={() => {
                        setResetPasswordUserId(user.id);
                        setResetPasswordValue("");
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      title="Redefinir senha"
                    >
                      <KeyRound size={16} />
                    </button>
                  )}
                  {isMaster && user.id !== session?.user?.id && (
                    <button
                      onClick={() => {
                        const warn = user.is_master
                          ? `Atenção: ${user.email} é um administrador MASTER. Tem certeza que deseja remover?`
                          : `Remover ${user.email}?`;
                        if (confirm(warn)) deleteMutation.mutate(user.id);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Excluir usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {editingProfileId === user.id && (
                <div className="mb-3 p-4 bg-secondary/50 border border-border rounded-md space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail size={14} /> Editar dados de {user.email}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome de usuário"
                      value={editProfileUsername}
                      onChange={(e) => setEditProfileUsername(e.target.value)}
                      className="px-3 py-2 bg-background text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="email"
                      placeholder="E-mail de recuperação *"
                      value={editProfileRecovery}
                      onChange={(e) => setEditProfileRecovery(e.target.value)}
                      className="px-3 py-2 bg-background text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateProfileMutation.mutate({
                          user_id: user.id,
                          username: editProfileUsername.trim() || null,
                          recovery_email: editProfileRecovery.trim(),
                        })
                      }
                      disabled={!editProfileRecovery.trim() || updateProfileMutation.isPending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => setEditingProfileId(null)}
                      className="px-4 py-2 bg-secondary text-foreground rounded-sm text-sm hover:opacity-80"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {resetPasswordUserId === user.id && (
                <div className="mb-3 p-4 bg-secondary/50 border border-border rounded-md space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <KeyRound size={14} /> Redefinir senha de {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por segurança, senhas não podem ser visualizadas (são criptografadas). Digite uma nova senha abaixo.
                  </p>
                  <div className="flex gap-2">
                    <PasswordInput
                      containerClassName="flex-1"
                      className="w-full px-4 py-2 pr-10 bg-background text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary"
                      placeholder="Nova senha (mín. 6 caracteres)"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                    />
                    <button
                      onClick={() => resetPasswordMutation.mutate({ user_id: user.id, password: resetPasswordValue })}
                      disabled={resetPasswordValue.length < 6 || resetPasswordMutation.isPending}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {resetPasswordMutation.isPending ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(""); }}
                      className="px-4 py-2 bg-secondary text-foreground rounded-sm text-sm hover:opacity-80"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {!user.is_master && (
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_OPTIONS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => togglePermission(user.id, user.permissions, p.key)}
                      disabled={editingUserId !== user.id || (user.id === session?.user?.id && p.key === "users")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:cursor-default ${
                        user.permissions.includes(p.key)
                          ? editingUserId === user.id ? "bg-primary text-primary-foreground" : "bg-primary/60 text-primary-foreground"
                          : editingUserId === user.id ? "bg-secondary text-muted-foreground hover:text-foreground" : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
