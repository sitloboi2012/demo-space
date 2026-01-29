import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Rocket
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "All Reviews", href: "/reviews" },
    { icon: ShieldCheck, label: "Compliance Rules", href: "/rules" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col shadow-xl shadow-black/5 z-20">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Momentus</h1>
            <p className="text-xs text-muted-foreground font-medium">Compliance Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", location === item.href ? "stroke-[2.5px]" : "stroke-2")} />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              JS
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">Jane Smith</p>
              <p className="text-xs text-muted-foreground truncate">Senior Engineer</p>
            </div>
          </div>
        </div>
        
        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
