import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, PlusCircle, CalendarDays, User, Menu, X, Sun, Moon, MapPin, Building2 } from "lucide-react";

const navItems = [
  { name: "Partidos", page: "Home", icon: Home },
  { name: "Crear Partido", page: "CreateMatch", icon: PlusCircle },
  { name: "Mis Partidos", page: "MyMatches", icon: CalendarDays },
  { name: "Canchas", page: "Canchas", icon: MapPin },
  { name: "Mis Canchas", page: "MisCanchas", icon: Building2 },
  { name: "Perfil", page: "Profile", icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">⚽</span>
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">Hay Equipo</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <a
                  key={item.page}
                  href={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Dark mode toggle (desktop) */}
          <button
            onClick={() => setDark(!dark)}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={dark ? "Modo claro" : "Modo oscuro"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-secondary"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <a
                  key={item.page}
                  href={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </a>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <a
                key={item.page}
                href={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}