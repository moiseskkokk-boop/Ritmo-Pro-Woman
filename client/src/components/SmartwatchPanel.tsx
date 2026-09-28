import { useMemo, useRef, useState } from "react";
import { Activity, Cable, CheckCircle2, Clock3, FileUp, HeartPulse, Loader2, RefreshCw, ShieldCheck, Watch, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type Provider = "health_connect" | "apple_health" | "fitbit" | "garmin" | "other";

const providers: Array<{ value: Provider; label: string }> = [
  { value: "health_connect", label: "Google Health Connect / Android" },
  { value: "apple_health", label: "Apple Health / iPhone" },
  { value: "fitbit", label: "Fitbit / Google Health" },
  { value: "garmin", label: "Garmin Connect" },
  { value: "other", label: "Outro dispositivo" },
];

function weekKey() {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function formatMetric(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "Dados não disponíveis" : `${value.toLocaleString("pt-BR")}${suffix}`;
}

export function SmartwatchPanel({ enabled }: { enabled: boolean }) {
  const [provider, setProvider] = useState<Provider>("health_connect");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWeek = useMemo(() => weekKey(), []);
  const connections = trpc.personalization.wearableConnections.useQuery(undefined, { enabled });
  const activity = trpc.personalization.weeklyActivity.useQuery({ weekKey: currentWeek }, { enabled });
  const sync = trpc.personalization.syncWearable.useMutation({
    onSuccess: async result => {
      await Promise.all([connections.refetch(), activity.refetch()]);
      toast.success(`${result.imported} atividade(s) sincronizada(s) sem duplicação.`);
    },
    onError: () => toast.error("Não foi possível sincronizar este arquivo oficial."),
  });
  const connection = useMemo(() => connections.data?.find(item => item.provider === provider), [connections.data, provider]);

  const connectInfo = () => {
    toast.info("A autorização será feita pela plataforma oficial do dispositivo. Enquanto a ponte oficial não estiver autorizada, nenhum dado é acessado ou inventado.");
  };

  const importOfficialFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { activities?: unknown } | unknown;
      const rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray((parsed as { activities?: unknown }).activities) ? (parsed as { activities: unknown[] }).activities : []);
      if (!rows.length) throw new Error("empty");
      const activities = rows.map((row, index) => {
        if (!row || typeof row !== "object") throw new Error("invalid");
        const item = row as Record<string, unknown>;
        return {
          provider,
          externalId: String(item.externalId ?? item.id ?? `${provider}-${item.activityDate ?? "unknown"}-${index}`),
          activityDate: String(item.activityDate ?? ""),
          startedAt: item.startedAt ? String(item.startedAt) : null,
          activityType: item.activityType ? String(item.activityType) : null,
          durationMinutes: item.durationMinutes == null ? null : Number(item.durationMinutes),
          caloriesKcal: item.caloriesKcal == null ? null : Number(item.caloriesKcal),
          heartRateAvg: item.heartRateAvg == null ? null : Number(item.heartRateAvg),
          heartRateMax: item.heartRateMax == null ? null : Number(item.heartRateMax),
          steps: item.steps == null ? null : Number(item.steps),
          distanceMeters: item.distanceMeters == null ? null : Number(item.distanceMeters),
          rawMetrics: item,
        };
      });
      if (activities.some(item => !/^\d{4}-\d{2}-\d{2}$/.test(item.activityDate))) throw new Error("date");
      await sync.mutateAsync({ activities });
    } catch {
      toast.error("Arquivo inválido. Use dados oficiais com activityDate no formato AAAA-MM-DD.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const summary = activity.data?.summary;
  const metrics: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: "Treinos concluídos", value: `${activity.data?.completedWorkouts ?? 0}/4`, Icon: Activity },
    { label: "Calorias", value: formatMetric(summary?.caloriesKcal, " kcal"), Icon: Activity },
    { label: "Tempo total", value: formatMetric(summary?.durationMinutes, " min"), Icon: Clock3 },
    { label: "FC média", value: formatMetric(summary?.heartRateAvg, " bpm"), Icon: HeartPulse },
  ];
  return <div className="mt-5 rounded-3xl border border-[#72c7a0]/25 bg-[#72c7a0]/[.06] p-6 md:p-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#72c7a0]">/ atividade real</span>
        <h3 className="mt-2 flex items-center gap-2 text-2xl font-extrabold"><Watch size={22} className="text-[#72c7a0]" /> Conectar smartwatch</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Importe somente atividades fornecidas pela plataforma oficial. O Ritmo não cria calorias, passos, frequência cardíaca ou outras métricas que o dispositivo não enviar.</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-white/55"><ShieldCheck size={14} className="text-[#72c7a0]" /> Privado por conta</div>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
      <select value={provider} onChange={event => setProvider(event.target.value as Provider)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[#72c7a0]">{providers.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <Button type="button" onClick={connectInfo} variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"><Cable size={16} /> Conectar smartwatch</Button>
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={sync.isPending} className="rounded-full bg-[#72c7a0] text-[#101513] hover:bg-[#8bd8b2]"><input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={event => importOfficialFile(event.target.files?.[0])} />{sync.isPending ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} Sincronizar dados</Button>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50"><span className="inline-flex items-center gap-1.5">{connection?.status === "connected" ? <CheckCircle2 size={14} className="text-[#72c7a0]" /> : <Clock3 size={14} className="text-[#f5a7c7]" />} {connection?.status === "connected" ? "Sincronizado" : "Aguardando autorização oficial"}</span>{connection?.lastSyncedAt && <span>Última sincronização: {new Date(connection.lastSyncedAt).toLocaleString("pt-BR")}</span>}<span>• Os dados são vinculados somente à sua conta.</span></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ label, value, Icon: MetricIcon }) => <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-4"><MetricIcon size={16} className="text-[#72c7a0]" /><span className="mt-3 block text-[10px] font-bold uppercase tracking-[.1em] text-white/45">{label}</span><strong className="mt-1 block text-lg font-extrabold">{value}</strong></div>)}
    </div>
    <div className="mt-6 flex items-center justify-between gap-3"><h4 className="text-sm font-extrabold">Histórico diário · {activity.data?.weekKey}</h4><RefreshCw size={15} className={activity.isFetching ? "animate-spin text-[#72c7a0]" : "text-white/30"} /></div>
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">{activity.data?.daily.map(day => <div key={day.date} className="rounded-2xl border border-white/10 bg-black/10 p-3"><span className="font-mono-label text-[10px] uppercase tracking-[.1em] text-[#72c7a0]">{new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</span><p className="mt-2 text-xs font-bold text-white/70">{day.summary.activities ? `${day.summary.activities} atividade(s)` : "Nenhuma atividade sincronizada"}</p><p className="mt-1 text-[11px] text-white/45">{formatMetric(day.summary.caloriesKcal, " kcal")} · {formatMetric(day.summary.steps, " passos")}</p></div>)}</div>
  </div>;
}
