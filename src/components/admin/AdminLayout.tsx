import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Car, Image, MessageSquare, LogOut, LayoutDashboard, Globe, Palette, Users, Settings, ArrowLeftRight, FileBarChart, FileText, Star, Download, HardDriveDownload, Rss, DatabaseBackup } from "lucide-react";
import prospectLogo from "@/assets/prospect-logo.png";
import RequireRecoveryEmail from "@/components/admin/RequireRecoveryEmail";

const allNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard" },
  { label: "Veículos", href: "/admin/vehicles", icon: Car, permission: "vehicles" },
  { label: "Movimentações", href: "/admin/movements", icon: ArrowLeftRight, permission: "vehicles" },
  { label: "Relatórios", href: "/admin/reports", icon: FileBarChart, permission: "vehicles" },
  { label: "Documentos", href: "/admin/documents", icon: FileText, permission: "vehicles" },
  { label: "Banners", href: "/admin/banners", icon: Image, permission: "banners" },
  { label: "Contatos", href: "/admin/contacts", icon: MessageSquare, permission: "contacts" },
  { label: "Depoimentos", href: "/admin/testimonials", icon: Star, permission: "banners" },
  { label: "Aparência", href: "/admin/appearance", icon: Palette, permission: "appearance" },
  { label: "Configurações", href: "/admin/settings", icon: Settings, permission: "settings" },
  { label: "Google", href: "/admin/google", icon: Globe, permission: "google" },
  { label: "Usuários", href: "/admin/users", icon: Users, permission: "users" },
  { label: "Importar dados", href: "/admin/import", icon: Download, permission: "import" },
  { label: "Feeds Catálogo", href: "/admin/feeds", icon: Rss, permission: "feeds" },
  { label: "Backup", href: "/admin/backup", icon: HardDriveDownload, permission: "backup" },
  { label: "Exportar Dados", href: "/admin/data-export", icon: DatabaseBackup, permission: "__master__" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isMaster, loading, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = allNavItems.filter((item) =>
    item.permission === "__master__" ? isMaster : hasPermission(item.permission)
  );

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <RequireRecoveryEmail>
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={prospectLogo} alt="Prospect Car System" className="h-16 w-auto" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-xl tracking-wider text-foreground">PROSPECT</span>
              <span className="font-display font-semibold text-[0.7rem] tracking-[0.35em] text-gradient">CAR SYSTEM</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => signOut().then(() => navigate("/admin/login"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
    </RequireRecoveryEmail>
  );
};

export default AdminLayout;
