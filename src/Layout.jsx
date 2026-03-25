import React, { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, PlusCircle, CalendarDays, User, Menu, X, Sun, Moon, MapPin, ArrowLeft, HelpCircle } from "lucide-react";
import NotificationBell from "./components/NotificationBell";
import { useNavigate, useLocation } from "react-router-dom";
import { goBack, pushPath, useAndroidBackHandler } from "@/lib/nav-history";

const navItems = [
{ name: "Partidos", page: "Home", icon: Home },
{ name: "Crear Partido", page: "CreateMatch", icon: PlusCircle },
{ name: "Mis Partidos", page: "MyMatches", icon: CalendarDays },
{ name: "Canchas", page: "Canchas", icon: MapPin },
{ name: "Ayuda", page: "Help", icon: HelpCircle },
{ name: "Perfil", page: "Profile", icon: User }];


const MAIN_PAGES = new Set(["Home", "CreateMatch", "MyMatches", "Canchas", "Profile"]);

// Bottom tab pages (excluding Profile/Help)
const BOTTOM_TABS = navItems.filter(i => i.page !== "Profile" && i.page !== "Help");
const TAB_ROOTS = BOTTOM_TABS.map(i => createPageUrl(i.page));

// Store/restore last visited path per tab
function getTabKey(page) { return `tab_last_${page}`; }
function saveTabPath(page, path) { sessionStorage.setItem(getTabKey(page), path); }
function getTabPath(page) { return sessionStorage.getItem(getTabKey(page)) || createPageUrl(page); }

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isChildScreen = !MAIN_PAGES.has(currentPageName);

  // Determine initial dark mode: manual preference → OS preference
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [manualTheme, setManualTheme] = useState(() => !!localStorage.getItem("theme"));

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Push every location change onto the internal navigation stack
  useEffect(() => {
    pushPath(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Sync current path into per-tab storage (only for main/tab pages, never child screens)
  useEffect(() => {
    if (isChildScreen) return;
    const tab = BOTTOM_TABS.find(t => t.page === currentPageName);
    if (tab) saveTabPath(tab.page, location.pathname + location.search);
  }, [location, currentPageName, isChildScreen]);

  // Hook the Android hardware back button into our internal navigation stack
  useAndroidBackHandler(navigate);

  // Listen to OS dark mode changes (only if user hasn't set a manual preference)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) {
        setDark(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (manualTheme) {
      localStorage.setItem("theme", dark ? "dark" : "light");
    }
  }, [dark, manualTheme]);

  const toggleTheme = useCallback(() => {
    setManualTheme(true);
    setDark(d => !d);
  }, []);

  // Navigate to tab, restoring last visited path within that tab
  const navigateToTab = useCallback((tabPage) => {
    const restoredPath = getTabPath(tabPage);
    navigate(restoredPath);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          {/* Mobile: back or profile left, logo center, menu right */}
          <div className="flex items-center gap-2 md:hidden">
            {isChildScreen ?
            <button
              onClick={() => goBack(navigate)}
              className="p-2 rounded-lg hover:bg-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Volver">
              
                <ArrowLeft className="w-5 h-5" />
              </button> :

            <a href="/Profile" aria-label="Mi perfil" className="p-2 rounded-lg hover:bg-secondary min-h-[44px] min-w-[44px] flex items-center justify-center">
                <User className="w-5 h-5" />
              </a>
            }
          </div>

          <a href={createPageUrl("Home")} className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69af676714ee0899079240af/0c99155b3_VibrantLogoforSeJuegaApp512x512px.png" alt="Se Juega" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg md:text-xl text-foreground tracking-tight">Se Juega</span>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ?
                  "bg-primary text-primary-foreground" :
                  "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                  }>
                  
                  <Icon className="w-4 h-4" />
                  {item.name}
                </a>);

            })}
          </nav>

          {/* Notification bell + Dark mode toggle (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <NotificationBell userEmail={user?.email} />
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
            
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell userEmail={user?.email} />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen(!menuOpen)}>
              
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen &&
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
                isActive ?
                "bg-primary text-primary-foreground" :
                "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                }>
                
                  <Icon className="w-4 h-4" />
                  {item.name}
                </a>);

          })}
          </nav>
        }
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border pb-safe">
        <div className="flex items-center justify-around h-14">
          {BOTTOM_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigateToTab(item.page)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 min-h-0 ${
                isActive ? "text-primary" : "text-muted-foreground"}`
                }>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium leading-tight">{item.name}</span>
              </button>);
          })}
        </div>
      </nav>
    </div>);

}