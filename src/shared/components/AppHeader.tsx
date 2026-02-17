"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/home", icon: "🏠" },
  { label: "Corporativo", href: "/home", icon: "🏢" },
  { label: "Automação", href: "/home", icon: "⚙️" },
  { label: "Empresas", href: "/home", icon: "🏭" },
];

const recruitingNav: NavItem[] = [
  { label: "Gerenciar vagas", href: "/vagas", icon: "📋" },
  { label: "Banco de talentos", href: "/banco-talentos", icon: "👥" },
  { label: "Pareceres", href: "/banco-talentos", icon: "🗂️" },
  { label: "Entrevistados", href: "/entrevistados", icon: "✅" },
  { label: "Entrevistas", href: "/banco-talentos", icon: "📅" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);

  const userName = useMemo(() => "Usuário", []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="app-header sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-fit">
          <button
            type="button"
            className="md:hidden rounded-lg p-2 hover:bg-slate-100 active:scale-95 transition-all duration-200"
            aria-label="Abrir menu"
            aria-controls="mobileNav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg width="22" height="22" fill="none" stroke="var(--ink)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <Image src="/Rhesult.png" alt="Logo Rhesult" width={140} height={36} className="h-9 w-auto object-contain" priority />
            <div className="hidden xs:flex flex-col leading-tight">
              <span className="text-xs font-extrabold text-[var(--brand)]">RHESULT</span>
              <span className="text-[10px] text-slate-500">RH System</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-3xl">
          <nav className="flex items-center gap-0.5 text-sm font-semibold">
            {mainNav.slice(0, 2).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isActive(pathname, item.href) ? "text-[var(--brand)] bg-[var(--brand)]/10" : "text-[var(--ink)] hover:bg-slate-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="relative group">
              <button
                type="button"
                className={`nav-dropdown flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  pathname.startsWith("/vagas") || pathname.startsWith("/banco-talentos") || pathname.startsWith("/entrevistados")
                    ? "text-[var(--brand)] bg-[var(--brand)]/10"
                    : "text-[var(--ink)] hover:bg-slate-50"
                }`}
              >
                📋 Recrutamento
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:rotate-180 transition-transform duration-200">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-[9999] py-2 overflow-hidden">
                {recruitingNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                      isActive(pathname, item.href) ? "text-[var(--brand)] bg-[var(--brand)]/10" : "text-[var(--ink)] hover:bg-[var(--brand)]/10"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {mainNav.slice(2).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-link flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--ink)] hover:bg-slate-50 whitespace-nowrap transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-l border-gray-200 h-6 mx-2"></div>

          <form className="relative flex-1 max-w-xs hidden lg:block" role="search" aria-label="Busca global">
            <input
              type="search"
              placeholder="Buscar…"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium shadow-sm transition-all duration-200 focus:outline-none focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/20 hover:border-slate-300"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded border border-slate-200">⌘K</kbd>
          </form>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 relative flex-shrink-0">
          <Link
            href="/vagas#nova"
            className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--brand)] to-orange-500 text-white text-xs font-extrabold hover:shadow-lg hover:scale-105 active:scale-95 transition whitespace-nowrap"
          >
            <span>✨</span> Nova vaga
          </Link>

          <button type="button" className="rounded-lg p-2.5 hover:bg-slate-100 active:scale-95 transition-all duration-200" aria-label="Alternar tema" title="Alternar tema (L/E)">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="rounded-lg p-2.5 hover:bg-slate-100 active:scale-95 transition-all duration-200 relative"
              aria-label="Notificações"
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <span className="text-lg">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 z-40">
                <div className="p-4 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><span>🔔</span> Notificações</h3>
                    <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700">Marcar como lidas</button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    <div className="px-3 py-3 text-xs text-slate-500 text-center bg-slate-50 rounded-lg">Sem notificações no momento</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-all duration-200"
              aria-label="Menu do usuário"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <Image
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><circle cx='64' cy='64' r='64' fill='%23F58634'/><circle cx='64' cy='48' r='20' fill='%23fff'/><path d='M 32 100 Q 32 76 64 76 Q 96 76 96 100' fill='%23fff'/></svg>"
                alt="Usuário"
                width={32}
                height={32}
                className="rounded-full w-8 h-8 border-2 border-[var(--brand)]/60 shadow-sm object-cover"
              />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-slate-900 text-sm font-bold leading-tight max-w-[100px] truncate">{userName}</span>
                <span className="text-slate-500 text-xs font-medium leading-tight">Usuário</span>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="2" viewBox="0 0 24 24" className="hidden sm:block text-slate-600">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 z-40">
                <div className="py-2 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-xl">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold">CONECTADO COMO</p>
                    <p className="text-sm text-slate-900 font-bold mt-1 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">usuario@rhesult.com</p>
                  </div>
                  <Link href="/perfil" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors">
                    <span className="text-lg">👤</span> 
                    <div>
                      <p>Meu Perfil</p>
                      <p className="text-xs text-slate-500 font-normal">Edite suas informações</p>
                    </div>
                  </Link>
                  <Link href="/perfil" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors border-b border-slate-100">
                    <span className="text-lg">🔐</span> 
                    <div>
                      <p>Segurança</p>
                      <p className="text-xs text-slate-500 font-normal">Senhas e permissões</p>
                    </div>
                  </Link>
                  <Link href="/home" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors">
                    <span className="text-lg">⚙️</span> 
                    <div>
                      <p>Configurações</p>
                      <p className="text-xs text-slate-500 font-normal">Sistema e preferências</p>
                    </div>
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <Link href="/login" className="px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm font-semibold transition-colors">
                    <span className="text-lg">🚪</span> Sair da conta
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav ref={mobileNavRef} id="mobileNav" className="md:hidden px-4 pb-4 border-t border-slate-200/50 bg-white/90 backdrop-blur-md text-sm space-y-3">
          <div className="pt-2 space-y-2">
            <Link href="/home" className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--brand)] to-orange-500 text-white font-bold flex items-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md">
              🏠 Dashboard
            </Link>
            <Link href="/home" className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors duration-200">
              🏢 Corporativo
            </Link>
          </div>

          <details className="group">
            <summary className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors duration-200 list-none">
              📋 Recrutamento
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-open:rotate-180 transition-transform">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="mt-2 pl-4 space-y-2 border-l-2 border-slate-200">
              {recruitingNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive(pathname, item.href) ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="group">
            <summary className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors duration-200 list-none">
              ⚙️ Menu
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-open:rotate-180 transition-transform">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="mt-2 pl-4 space-y-2 border-l-2 border-slate-200">
              <Link href="/home" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">⚙️ Automação</Link>
              <Link href="/home" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">🏭 Empresas</Link>
              <Link href="/perfil" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">👤 Meu Perfil</Link>
            </div>
          </details>

          <div className="pt-2">
            <Link href="/vagas#nova" className="w-full px-4 py-3 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)] text-[var(--brand)] font-bold flex items-center gap-2 justify-center transition-colors duration-200 hover:bg-[var(--brand)]/20">
              ✨ Nova vaga
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
