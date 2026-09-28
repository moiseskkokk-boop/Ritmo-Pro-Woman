import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, Moon, Sparkles, Sun, UserCircle, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Perfil", path: "/perfil" },
  { label: "Treino + Smartwatch", path: "/treino" },
  { label: "Análise Corporal", path: "/analise" },
];

export default function AppHeader({ onInstall }: { onInstall?: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const photoQuery = trpc.account.profilePhoto.useQuery(undefined, { enabled: isAuthenticated });
  const displayName = user?.name?.trim() || "Atleta";
  const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  const close = () => setOpen(false);
  const signOut = async () => { close(); await logout(); };

  return <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f2ee]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f2ee]/80">
    <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-4 md:px-10">
      <Link href="/treino" onClick={close} className="group flex shrink-0 items-center gap-3" aria-label="Ritmo Pro Woman início">
        <img src="/ritmo-woman-icon-192.png" alt="Logo Ritmo Pro Woman" className="h-10 w-10 rounded-xl object-cover transition-transform duration-200 group-hover:rotate-3" />
        <span><span className="block text-[13px] font-extrabold tracking-[.2em]">RITMO PRO WOMAN</span><span className="font-mono-label block text-[9px] text-black/50">TREINO / 04X</span></span>
      </Link>
      <nav className="hidden items-center gap-5 text-[11px] font-bold uppercase tracking-[.1em] lg:flex">
        {navItems.map(item => <Link key={item.path} href={item.path} className={`transition-colors hover:text-[#e878aa] ${location === item.path ? "text-[#e878aa]" : ""}`}>{item.label}</Link>)}
        <span className="flex max-w-[180px] items-center gap-2 truncate rounded-full border border-black/10 bg-white/45 px-3 py-2 normal-case tracking-normal" title={isAuthenticated ? `Online: ${displayName}` : "Não autenticada"}><span className={`h-2 w-2 shrink-0 rounded-full ${isAuthenticated ? "bg-[#72c7a0] shadow-[0_0_8px_rgba(114,199,160,.8)]" : "bg-black/20"}`} /><span className="truncate text-[12px] font-extrabold">{isAuthenticated ? displayName : "Visitante"}</span></span>
        {isAuthenticated && <Link href="/perfil" aria-label="Abrir perfil" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e878aa]"><Avatar className="h-9 w-9 border border-black/10"><AvatarImage src={photoQuery.data?.url ?? undefined} alt={`Foto de ${displayName}`} /><AvatarFallback className="bg-[#f5a7c7] text-xs font-extrabold text-[#171717]">{initials || <UserCircle size={16} />}</AvatarFallback></Avatar></Link>}
        <button onClick={() => toggleTheme?.()} className="flex items-center gap-2 transition-colors hover:text-[#e878aa]" aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} title={theme === "dark" ? "Modo claro" : "Modo escuro"}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} {theme === "dark" ? "Modo claro" : "Modo escuro"}</button>
        {onInstall && <button onClick={onInstall} className="flex items-center gap-2 transition-colors hover:text-[#e878aa]"><Sparkles size={13} /> Instalar app</button>}
        {isAuthenticated ? <button onClick={signOut} className="flex items-center gap-2 text-black/60 transition-colors hover:text-[#171717]"><LogOut size={14} /> Sair da conta</button> : <button onClick={() => startLogin()} className="rounded-full bg-[#171717] px-4 py-2 text-[#fffdf9] transition-transform hover:-translate-y-0.5">Criar conta</button>}
      </nav>
      <div className="flex items-center gap-2 lg:hidden">
        {isAuthenticated && <Link href="/perfil" onClick={close} aria-label="Abrir perfil"><Avatar className="h-9 w-9 border border-black/10"><AvatarImage src={photoQuery.data?.url ?? undefined} alt={`Foto de ${displayName}`} /><AvatarFallback className="bg-[#f5a7c7] text-xs font-extrabold text-[#171717]">{initials}</AvatarFallback></Avatar></Link>}
        <button onClick={() => setOpen(value => !value)} className="rounded-full p-2" aria-label={open ? "Fechar menu" : "Abrir menu"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>
    {open && <div className="border-t border-black/10 px-5 py-4 lg:hidden"><div className="flex flex-col gap-4 text-sm font-bold uppercase tracking-[.1em]">
      {isAuthenticated && <div className="flex items-center gap-3 border-b border-black/10 pb-4 normal-case tracking-normal"><Avatar className="h-9 w-9"><AvatarImage src={photoQuery.data?.url ?? undefined} alt="" /><AvatarFallback className="bg-[#f5a7c7] text-xs font-extrabold">{initials}</AvatarFallback></Avatar><span>Online como <strong>{displayName}</strong></span></div>}
      {navItems.map(item => <Link key={item.path} href={item.path} onClick={close} className={location === item.path ? "text-[#e878aa]" : ""}>{item.label}</Link>)}
      <button className="flex items-center gap-2 text-left" onClick={() => { toggleTheme?.(); close(); }}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} {theme === "dark" ? "Modo claro" : "Modo escuro"}</button>
      {onInstall && <button className="flex items-center gap-2 text-left" onClick={() => { close(); onInstall(); }}><Sparkles size={15} /> Instalar app</button>}
      {isAuthenticated ? <button className="flex items-center gap-2 text-left" onClick={signOut}><LogOut size={15} /> Sair da conta</button> : <button className="text-left" onClick={() => startLogin()}>Criar conta</button>}
    </div></div>}
  </header>;
}
