"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AppContext";

type NavItem = {
  label: string;
  href: string;
};

function resolveAvatarUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";

  if (url.startsWith("/uploads/")) {
    return `/api/public${url}`;
  }

  return url;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Corporativo", href: "/corporativo" },
  { label: "Automação", href: "/" },
  { label: "Empresas", href: "/" },
];

const recruitingNav: NavItem[] = [
  { label: "Gerenciar vagas", href: "/vagas" },
  { label: "Banco de talentos", href: "/banco-talentos" },
  { label: "Pareceres", href: "/parecer" },
  { label: "Entrevistados", href: "/entrevistados" },
  { label: "Entrevistas", href: "/agenda" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);

  const userName = useMemo(() => user?.nome || "Usuário", [user?.nome]);
  const userEmail = useMemo(() => user?.email || "usuario@rhesult.com", [user?.email]);
  const userRole = useMemo(() => {
    if (!user?.role) return "Usuário";
    const roleMap = { admin: "Administrador", rh: "RH", recruiter: "Recrutador", candidate: "Candidato" };
    return roleMap[user.role as keyof typeof roleMap] || user.role;
  }, [user?.role]);
  const avatarLetter = useMemo(() => user?.nome?.charAt(0).toUpperCase() || "U", [user?.nome]);
  const avatarUrl = useMemo(
    () => resolveAvatarUrl((user as { avatar_url?: string } | null)?.avatar_url),
    [user],
  );
  const hasAvatar = Boolean(avatarUrl);
  const isRecruitingActive =
    pathname.startsWith("/vagas") ||
    pathname.startsWith("/banco-talentos") ||
    pathname.startsWith("/parecer") ||
    pathname.startsWith("/entrevistados") ||
    pathname.startsWith("/agenda");

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
    <header className="app-header sticky top-4 z-50 px-3 sm:px-5 flex justify-center">
      <div className="navPanel rounded-full pl-4 sm:pl-6 pr-2 py-2 flex items-center justify-between gap-4 sm:gap-8 max-w-6xl w-full max-w-[calc(100vw-1.5rem)] transition-all duration-300 hover:-translate-y-px">
        <div className="flex items-center gap-2 min-w-fit">
          <button
            type="button"
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700 border border-slate-200"
            aria-label="Abrir menu"
            aria-controls="mobileNav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            ≡
          </button>

          <Link href="/" className="flex items-center gap-2 mr-auto md:mr-0 group">
            <Image
              src="/Rhesult.png"
              alt="RHesult"
              width={122}
              height={32}
              className="h-8 w-auto group-hover:-rotate-6 transition-transform duration-300"
              priority
            />
          </Link>
        </div>

        <div className="hidden xl:flex items-center gap-2 min-w-0 flex-1">
          <nav className="flex items-center gap-1">
            {mainNav.slice(0, 2).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive(pathname, item.href)
                    ? "text-[var(--accent)]"
                    : "text-slate-500 hover-accent"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="relative group">
              <button
                type="button"
                className={`nav-dropdown flex items-center gap-1 relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isRecruitingActive
                    ? "text-[var(--accent)]"
                    : "text-slate-500 hover-accent"
                }`}
              >
                Recrutamento
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:rotate-180 transition-transform duration-200">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-[9999] py-2 overflow-hidden">
                {recruitingNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2.5 flex items-center text-sm font-medium transition-colors ${
                      isActive(pathname, item.href) ? "text-[var(--brand)] bg-[var(--brand)]/10" : "text-[var(--ink)] hover:bg-[var(--brand)]/10"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {mainNav.slice(2).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive(pathname, item.href)
                    ? "text-[var(--accent)]"
                    : "text-slate-500 hover-accent"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 relative flex-shrink-0 min-w-0">
          <button type="button" className="hidden lg:inline-flex w-9 h-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-all" aria-label="Buscar">
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link
            href="/vagas#nova"
            className="hidden lg:inline-flex px-6 py-2.5 rounded-full bg-ink text-white text-xs font-bold hover-bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all items-center gap-2"
          >
            <span>+</span>
            <span>Nova vaga</span>
          </Link>

          <button type="button" className="rounded-full p-2 text-slate-700 hover:bg-slate-100 transition-all" aria-label="Alternar tema" title="Alternar tema (L/E)">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="rounded-full p-2 text-slate-700 hover:bg-slate-100 transition-all relative"
              aria-label="Notificações"
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 z-40">
                <div className="p-4 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">Notificações</h3>
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
              className="flex items-center gap-2 hover:bg-slate-100 rounded-full px-2 py-1.5 transition-all duration-200"
              aria-label="Menu do usuário"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-[var(--brand)]/60 shadow-sm ${
                  hasAvatar
                    ? "bg-center bg-cover bg-no-repeat"
                    : "bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm"
                }`}
                style={hasAvatar ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!hasAvatar && avatarLetter}
              </div>
              <div className="hidden lg:flex flex-col items-start min-w-0">
                <span className="text-slate-900 text-sm font-bold leading-tight max-w-[100px] truncate">{userName}</span>
                <span className="text-slate-500 text-xs font-medium leading-tight">{userRole}</span>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="2" viewBox="0 0 24 24" className="hidden sm:block text-slate-600">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 z-40">
                <div className="py-2 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-xl">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full shadow-sm ${
                        hasAvatar
                          ? "bg-center bg-cover bg-no-repeat"
                          : "bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg"
                      }`}
                      style={hasAvatar ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                    >
                      {!hasAvatar && avatarLetter}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold">CONECTADO COMO</p>
                      <p className="text-sm text-slate-900 font-bold mt-1 truncate">{userName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{userEmail}</p>
                      <p className="text-xs text-orange-600 font-semibold mt-1">{userRole}</p>
                    </div>
                  </div>
                  <Link href="/perfil" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors">
                    <div>
                      <p>Meu Perfil</p>
                      <p className="text-xs text-slate-500 font-normal">Edite suas informações</p>
                    </div>
                  </Link>
                  <Link href="/perfil" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors border-b border-slate-100">
                    <div>
                      <p>Segurança</p>
                      <p className="text-xs text-slate-500 font-normal">Senhas e permissões</p>
                    </div>
                  </Link>
                  <Link href="/" className="px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-sm font-semibold transition-colors">
                    <div>
                      <p>Configurações</p>
                      <p className="text-xs text-slate-500 font-normal">Sistema e preferências</p>
                    </div>
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      router.push("/login");
                    }}
                    className="w-full px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm font-semibold transition-colors text-left"
                  >
                    Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav ref={mobileNavRef} id="mobileNav" className="md:hidden mt-3 w-full max-w-7xl mx-auto px-4 pb-4 rounded-3xl navPanel border border-white/60 text-sm space-y-3 pointer-events-auto">
          <div className="pt-3 px-1">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-3 shadow-sm">
              <div
                className={`w-10 h-10 rounded-full ${
                  hasAvatar
                    ? "bg-center bg-cover bg-no-repeat"
                    : "bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold"
                }`}
                style={hasAvatar ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!hasAvatar && avatarLetter}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userRole}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Link href="/" className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--brand)] to-orange-500 text-white font-bold flex items-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md">
              Dashboard
            </Link>
            <Link href="/" className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 transition-colors duration-200">
              Corporativo
            </Link>
          </div>

          <details className="group">
            <summary className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors duration-200 list-none">
              Recrutamento
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
                  {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="group">
            <summary className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors duration-200 list-none">
              Menu
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-open:rotate-180 transition-transform">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="mt-2 pl-4 space-y-2 border-l-2 border-slate-200">
              <Link href="/" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">Automação</Link>
              <Link href="/" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">Empresas</Link>
              <Link href="/perfil" className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium">Meu Perfil</Link>
            </div>
          </details>

          <div className="pt-2">
            <Link href="/vagas#nova" className="w-full px-4 py-3 rounded-lg bg-[var(--brand)]/10 border border-[var(--brand)] text-[var(--brand)] font-bold flex items-center gap-2 justify-center transition-colors duration-200 hover:bg-[var(--brand)]/20">
              Nova vaga
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
