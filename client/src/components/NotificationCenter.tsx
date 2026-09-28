import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, BellRing, Check, Clock3, Loader2, LockKeyhole, Save, ShieldCheck, VolumeX } from "lucide-react";
import { startLogin } from "@/const";

type Language = "pt" | "en" | "es";
type Preferences = {
  enabled: boolean;
  browserEnabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  reminderDays: string[];
  weeklySummary: boolean;
  weeklyDay: string;
  weeklyTime: string;
  monthlyCheckIn: boolean;
  quietStart: string;
  quietEnd: string;
  customMessage: string | null;
};

const defaults: Preferences = { enabled: true, browserEnabled: false, dailyReminder: true, reminderTime: "18:00", reminderDays: ["1", "2", "3", "4", "5"], weeklySummary: true, weeklyDay: "0", weeklyTime: "20:00", monthlyCheckIn: true, quietStart: "22:00", quietEnd: "07:00", customMessage: null };
const dayOptions = {
  pt: [{ value: "1", label: "Seg" }, { value: "2", label: "Ter" }, { value: "3", label: "Qua" }, { value: "4", label: "Qui" }, { value: "5", label: "Sex" }, { value: "6", label: "Sáb" }, { value: "0", label: "Dom" }],
  en: [{ value: "1", label: "Mon" }, { value: "2", label: "Tue" }, { value: "3", label: "Wed" }, { value: "4", label: "Thu" }, { value: "5", label: "Fri" }, { value: "6", label: "Sat" }, { value: "0", label: "Sun" }],
  es: [{ value: "1", label: "Lun" }, { value: "2", label: "Mar" }, { value: "3", label: "Mié" }, { value: "4", label: "Jue" }, { value: "5", label: "Vie" }, { value: "6", label: "Sáb" }, { value: "0", label: "Dom" }],
} as const;
const copy = {
  pt: { eyebrow: "/ lembretes personalizados", title: "Deixe o Ritmo lembrar você.", description: "Escolha quando receber lembretes de treino, resumo da semana e check-in mensal. As preferências ficam salvas na sua conta.", login: "Entrar para configurar", enabled: "Notificações ativas", daily: "Lembrete de treino", dailyHelp: "Avise nos dias escolhidos quando estiver perto do horário do treino.", weekly: "Resumo da semana", weeklyHelp: "Receba um lembrete para revisar dias feitos e pendências.", monthly: "Check-in mensal", monthlyHelp: "Lembrete para atualizar fotos, medidas e contexto do ciclo.", days: "Dias do lembrete", time: "Horário", weeklyDay: "Dia do resumo", quiet: "Horário silencioso", quietHelp: "Nenhum aviso do navegador será disparado neste intervalo.", custom: "Mensagem personalizada", customPlaceholder: "Ex.: Seu treino de hoje espera por você.", browser: "Notificações do navegador", browserOn: "Navegador autorizado", browserOff: "Ativar no navegador", browserHelp: "O site precisa estar aberto para os lembretes locais funcionarem. O celular pode bloquear notificações conforme suas permissões.", allow: "Permitir notificações", test: "Testar agora", save: "Salvar preferências", saved: "Preferências salvas.", denied: "O navegador não permitiu notificações. Ative nas configurações do navegador.", unsupported: "Este navegador não oferece notificações.", testTitle: "Ritmo Pro Woman", testBody: "Este é um teste dos seus lembretes personalizados.", privacy: "Você controla os horários e pode desligar tudo quando quiser.", noBrowser: "As notificações do navegador estão desligadas.", next: "Próximo lembrete", browserPermission: "Permissão", notificationSection: "Tipos de lembrete" },
  en: { eyebrow: "/ personalized reminders", title: "Let Ritmo remember you.", description: "Choose when to receive workout reminders, a weekly summary and a monthly check-in. Preferences are saved to your account.", login: "Sign in to configure", enabled: "Notifications active", daily: "Workout reminder", dailyHelp: "Notify me on selected days near the workout time.", weekly: "Weekly summary", weeklyHelp: "Get a reminder to review completed days and pending sessions.", monthly: "Monthly check-in", monthlyHelp: "Reminder to update photos, measurements and cycle context.", days: "Reminder days", time: "Time", weeklyDay: "Summary day", quiet: "Quiet hours", quietHelp: "No browser alert will be sent during this interval.", custom: "Custom message", customPlaceholder: "E.g. Your workout is waiting for you.", browser: "Browser notifications", browserOn: "Browser authorized", browserOff: "Enable in browser", browserHelp: "The site must be open for these local reminders. Your phone may block alerts based on its permissions.", allow: "Allow notifications", test: "Test now", save: "Save preferences", saved: "Preferences saved.", denied: "The browser blocked notifications. Enable them in browser settings.", unsupported: "This browser does not support notifications.", testTitle: "Ritmo Pro Woman", testBody: "This is a test of your personalized reminders.", privacy: "You control the schedule and can turn everything off anytime.", noBrowser: "Browser notifications are off.", next: "Next reminder", browserPermission: "Permission", notificationSection: "Reminder types" },
  es: { eyebrow: "/ recordatorios personalizados", title: "Deja que Ritmo te recuerde.", description: "Elige cuándo recibir recordatorios de entrenamiento, resumen semanal y check-in mensual. Las preferencias se guardan en tu cuenta.", login: "Entrar para configurar", enabled: "Notificaciones activas", daily: "Recordatorio de entrenamiento", dailyHelp: "Avisarme en los días elegidos cerca de la hora del entrenamiento.", weekly: "Resumen semanal", weeklyHelp: "Recibir un recordatorio para revisar días hechos y sesiones pendientes.", monthly: "Check-in mensual", monthlyHelp: "Recordatorio para actualizar fotos, medidas y contexto del ciclo.", days: "Días del recordatorio", time: "Hora", weeklyDay: "Día del resumen", quiet: "Horario silencioso", quietHelp: "No se enviará ningún aviso del navegador en este intervalo.", custom: "Mensaje personalizado", customPlaceholder: "Ej.: Tu entrenamiento te espera.", browser: "Notificaciones del navegador", browserOn: "Navegador autorizado", browserOff: "Activar en el navegador", browserHelp: "El sitio debe estar abierto para estos recordatorios locales. El móvil puede bloquear avisos según sus permisos.", allow: "Permitir notificaciones", test: "Probar ahora", save: "Guardar preferencias", saved: "Preferencias guardadas.", denied: "El navegador bloqueó las notificaciones. Actívalas en la configuración del navegador.", unsupported: "Este navegador no admite notificaciones.", testTitle: "Ritmo Pro Woman", testBody: "Esta es una prueba de tus recordatorios personalizados.", privacy: "Tú controlas los horarios y puedes apagar todo cuando quieras.", noBrowser: "Las notificaciones del navegador están apagadas.", next: "Próximo recordatorio", browserPermission: "Permiso", notificationSection: "Tipos de recordatorio" },
} as const;

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function inQuietHours(now: number, start: string, end: string) {
  const quietStart = minutes(start);
  const quietEnd = minutes(end);
  return quietStart > quietEnd ? now >= quietStart || now < quietEnd : now >= quietStart && now < quietEnd;
}

function browserNotify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return false;
  new Notification(title, { body, icon: "/ritmo-woman-icon-192.png", tag: "ritmo-pro-woman" });
  return true;
}

export default function NotificationCenter() {
  const { isAuthenticated } = useAuth();
  const profileQuery = trpc.personalization.profile.useQuery(undefined, { enabled: isAuthenticated });
  const language = (profileQuery.data?.language as Language | undefined) ?? "pt";
  const t = copy[language];
  const prefsQuery = trpc.notifications.preferences.useQuery(undefined, { enabled: isAuthenticated });
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [permission, setPermission] = useState<NotificationPermission>(typeof Notification === "undefined" ? "default" : Notification.permission);
  const save = trpc.notifications.save.useMutation({ onSuccess: data => { setPrefs(data as Preferences); prefsQuery.refetch(); toast.success(t.saved); }, onError: () => toast.error("Não foi possível salvar agora.") });

  useEffect(() => {
    if (!prefsQuery.data) return;
    setPrefs({ ...defaults, ...prefsQuery.data, reminderDays: prefsQuery.data.reminderDays ?? defaults.reminderDays });
  }, [prefsQuery.data]);

  const nextReminder = useMemo(() => {
    if (!prefs.enabled) return t.noBrowser;
    if (prefs.dailyReminder) return `${t.daily} · ${prefs.reminderTime}`;
    if (prefs.weeklySummary) return `${t.weekly} · ${prefs.weeklyTime}`;
    return t.noBrowser;
  }, [prefs, t]);

  useEffect(() => {
    if (!isAuthenticated || !prefs.enabled || !prefs.browserEnabled || permission !== "granted") return;
    const check = () => {
      const now = new Date();
      const day = String(now.getDay());
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (inQuietHours(currentMinutes, prefs.quietStart, prefs.quietEnd)) return;
      const date = now.toISOString().slice(0, 10);
      const maybeNotify = (type: string, target: string, allowed: boolean, windowMinutes: number, message: string) => {
        if (!allowed || !prefs.enabled || !prefs.browserEnabled || !prefs.reminderDays.includes(day) && type === "daily") return;
        const diff = currentMinutes - minutes(target);
        const key = `ritmo-pro-woman-notification:${type}:${date}`;
        if (diff >= 0 && diff <= windowMinutes && !localStorage.getItem(key)) {
          if (browserNotify("Ritmo Pro Woman", message)) localStorage.setItem(key, "1");
        }
      };
      maybeNotify("daily", prefs.reminderTime, prefs.dailyReminder, 90, prefs.customMessage || t.daily);
      if (day === prefs.weeklyDay) maybeNotify("weekly", prefs.weeklyTime, prefs.weeklySummary, 90, t.weekly);
      if (now.getDate() === 1) maybeNotify("monthly", prefs.weeklyTime, prefs.monthlyCheckIn, 180, t.monthly);
    };
    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, permission, prefs, t]);

  if (!isAuthenticated) return <section id="notificacoes" className="scroll-mt-20 border-y border-white/10 bg-[#111614] px-5 py-16 text-white md:px-10 md:py-20"><div className="mx-auto max-w-[1320px] rounded-3xl border border-white/10 bg-white/[.04] p-7 md:p-10"><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{t.eyebrow}</span><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] md:text-5xl">{t.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{t.description}</p><Button onClick={startLogin} className="mt-6 rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]"><LockKeyhole size={16} /> {t.login}</Button></div></section>;

  const toggleDay = (day: string) => setPrefs(current => ({ ...current, reminderDays: current.reminderDays.includes(day) ? current.reminderDays.filter(item => item !== day) : [...current.reminderDays, day] }));
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPrefs(current => ({ ...current, [key]: value }));
  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) return toast.error(t.unsupported);
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") { update("browserEnabled", true); save.mutate({ browserEnabled: true }); browserNotify(t.testTitle, t.testBody); }
    else toast.error(t.denied);
  };
  const testNotification = () => {
    if (permission !== "granted") return requestBrowserPermission();
    browserNotify(t.testTitle, t.testBody);
  };

  return <section id="notificacoes" className="scroll-mt-20 border-y border-white/10 bg-[#111614] px-5 py-16 text-white md:px-10 md:py-20"><div className="mx-auto max-w-[1320px]"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{t.eyebrow}</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.05em] md:text-5xl">{t.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{t.description}</p></div><div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[.04] px-4 py-3 text-xs text-white/60"><Clock3 size={15} className="text-[#f5a7c7]" /><span>{t.next}: <strong className="text-white">{nextReminder}</strong></span></div></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 md:p-8"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><BellRing className="text-[#f5a7c7]" /><div><h3 className="text-xl font-extrabold">{t.enabled}</h3><p className="mt-1 text-xs text-white/45">{t.privacy}</p></div></div><button onClick={() => update("enabled", !prefs.enabled)} role="switch" aria-checked={prefs.enabled} className={`relative h-7 w-12 rounded-full transition ${prefs.enabled ? "bg-[#f5a7c7]" : "bg-white/15"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-[#171717] transition ${prefs.enabled ? "left-6" : "left-1"}`} /></button></div><div className="mt-7 space-y-4"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-4"><div><h4 className="font-extrabold">{t.daily}</h4><p className="mt-1 text-xs leading-5 text-white/50">{t.dailyHelp}</p></div><input type="checkbox" checked={prefs.dailyReminder} onChange={event => update("dailyReminder", event.target.checked)} className="mt-1 h-4 w-4 accent-[#f5a7c7]" /></div><div className="mt-4 flex flex-wrap gap-2">{dayOptions[language].map(day => <button key={day.value} onClick={() => toggleDay(day.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${prefs.reminderDays.includes(day.value) ? "border-[#f5a7c7] bg-[#f5a7c7] text-[#171717]" : "border-white/15 text-white/50"}`}>{day.label}</button>)}<label className="ml-auto flex items-center gap-2 text-xs text-white/50">{t.time}<input type="time" value={prefs.reminderTime} onChange={event => update("reminderTime", event.target.value)} className="rounded-lg border border-white/10 bg-white/[.06] px-2 py-1 text-white" /></label></div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-4"><div><h4 className="font-extrabold">{t.weekly}</h4><p className="mt-1 text-xs leading-5 text-white/50">{t.weeklyHelp}</p></div><input type="checkbox" checked={prefs.weeklySummary} onChange={event => update("weeklySummary", event.target.checked)} className="mt-1 h-4 w-4 accent-[#f5a7c7]" /></div><div className="mt-4 flex flex-wrap gap-2"><label className="flex items-center gap-2 text-xs text-white/50">{t.weeklyDay}<select value={prefs.weeklyDay} onChange={event => update("weeklyDay", event.target.value)} className="rounded-lg border border-white/10 bg-white/[.06] px-2 py-1 text-white">{dayOptions[language].map(day => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label><label className="ml-auto flex items-center gap-2 text-xs text-white/50">{t.time}<input type="time" value={prefs.weeklyTime} onChange={event => update("weeklyTime", event.target.value)} className="rounded-lg border border-white/10 bg-white/[.06] px-2 py-1 text-white" /></label></div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-4"><div><h4 className="font-extrabold">{t.monthly}</h4><p className="mt-1 text-xs leading-5 text-white/50">{t.monthlyHelp}</p></div><input type="checkbox" checked={prefs.monthlyCheckIn} onChange={event => update("monthlyCheckIn", event.target.checked)} className="mt-1 h-4 w-4 accent-[#f5a7c7]" /></div></div></div></div><div className="space-y-5"><div className="rounded-3xl border border-[#f5a7c7]/30 bg-[#f5a7c7]/10 p-6 md:p-8"><div className="flex items-start gap-3"><Bell className="mt-1 text-[#f5a7c7]" /><div><h3 className="text-xl font-extrabold">{t.browser}</h3><p className="mt-2 text-sm leading-6 text-white/65">{t.browserHelp}</p><div className="mt-4 flex flex-wrap gap-2"><Button onClick={requestBrowserPermission} className="rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]"><ShieldCheck size={16} /> {permission === "granted" ? t.browserOn : t.allow}</Button><Button onClick={testNotification} variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"><BellRing size={16} /> {t.test}</Button></div><p className="mt-3 text-xs text-white/45">{t.browserPermission}: {permission === "granted" ? t.browserOn : t.browserOff}</p></div></div></div><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 md:p-8"><div className="flex items-start gap-3"><VolumeX className="mt-1 text-[#f5a7c7]" /><div className="w-full"><h3 className="text-xl font-extrabold">{t.quiet}</h3><p className="mt-2 text-sm leading-6 text-white/55">{t.quietHelp}</p><div className="mt-4 flex flex-wrap items-center gap-3"><input type="time" value={prefs.quietStart} onChange={event => update("quietStart", event.target.value)} className="rounded-lg border border-white/10 bg-white/[.06] px-3 py-2 text-white" /><span className="text-white/40">→</span><input type="time" value={prefs.quietEnd} onChange={event => update("quietEnd", event.target.value)} className="rounded-lg border border-white/10 bg-white/[.06] px-3 py-2 text-white" /></div></div></div><label className="mt-5 block text-xs font-bold text-white/60">{t.custom}<textarea value={prefs.customMessage ?? ""} onChange={event => update("customMessage", event.target.value)} placeholder={t.customPlaceholder} maxLength={180} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f5a7c7]" /></label><Button disabled={save.isPending} onClick={() => save.mutate({ ...prefs, reminderDays: prefs.reminderDays })} className="mt-5 rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]">{save.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {t.save}</Button></div></div></div></div></section>;
}
