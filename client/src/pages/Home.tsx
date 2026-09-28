import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  MoveUpRight,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PersonalizationPanel from "@/components/PersonalizationPanel";
import NotificationCenter from "@/components/NotificationCenter";
import AppHeader from "@/components/AppHeader";
import { SmartwatchPanel } from "@/components/SmartwatchPanel";

const STORAGE_ASSETS: Record<string, string> = {
  "agachamento-bulgaro": "/exercises/agachamento-bulgaro_891cf377.png",
  "agachamento-smith": "/exercises/agachamento-smith_bb5ce4a7.png",
  "cadeira-abdutora": "/exercises/cadeira-abdutora_52fa0f21.png",
  "cadeira-adutora": "/exercises/cadeira-adutora_62799837.png",
  "cadeira-extensora": "/exercises/cadeira-extensora_e8ae9141.png",
  "desenvolvimento-ombros": "/exercises/desenvolvimento-ombros_37111aae.png",
  "elevacao-lateral-halteres": "/exercises/elevacao-lateral-halteres_a93bd4f5.png",
  "hip-thrust": "/exercises/hip-thrust_d11d5899.png",
  "leg-press-45": "/exercises/leg-press-45_cc84911a.png",
  "mesa-flexora": "/exercises/mesa-flexora_9290c436.png",
  "passada-afundo": "/exercises/passada-afundo_0547620e.png",
  "puxada-frontal-polia": "/exercises/puxada-frontal-polia_aa0c6299.png",
  "puxada-fechada-supinada": "/exercises/puxada-fechada-supinada_d6ec89e1.png",
  "remada-maquina": "/exercises/remada-maquina_f67c110a.png",
  "remada-sentada-polia": "/exercises/remada-sentada-polia_714e812f.png",
  "rosca-direta-barra": "/exercises/rosca-direta-barra_7880a996.png",
  "rosca-martelo-halteres": "/exercises/rosca-martelo-halteres_9d724415.png",
  "remada-cavalinho": "/exercises/remada-cavalinho_171e62d1.png",
  "stiff-barra": "/exercises/stiff-barra_2caca81b.png",
  "supino-halteres": "/exercises/supino-halteres_734a389b.png",
  "supino-inclinado-halteres": "/exercises/supino-inclinado-halteres_9231f4ce.png",
  "triceps-frances-halter": "/exercises/triceps-frances-halter_f733c1b9.png",
  "triceps-polia-corda": "/exercises/triceps-polia-corda_6dccee9b.png",
};

const asset = (name: string) => STORAGE_ASSETS[name] ?? "/exercises/agachamento-smith_bb5ce4a7.png";

type Exercise = {
  id: string;
  name: string;
  sets: string;
  image: string;
  cue: string;
};

type WorkoutDay = {
  id: string;
  label: string;
  short: string;
  focus: string;
  eyebrow: string;
  accent: string;
  exercises: Exercise[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const workouts: WorkoutDay[] = [
  {
    id: "segunda",
    label: "Segunda",
    short: "SEG",
    focus: "Inferior A",
    eyebrow: "BASE & FORÇA",
    accent: "pink",
    exercises: [
      { id: "agachamento-smith", name: "Agachamento no Smith", sets: "3 × 6–10", image: asset("agachamento-smith"), cue: "Desça com o peito aberto e empurre o chão para subir." },
      { id: "leg-press-45", name: "Leg Press 45°", sets: "3 × 8–12", image: asset("leg-press-45"), cue: "Controle a descida sem tirar o quadril do encosto." },
      { id: "hip-thrust", name: "Hip Thrust", sets: "3 × 8–12", image: asset("hip-thrust"), cue: "Suba contraindo os glúteos e mantenha as costelas baixas." },
      { id: "agachamento-bulgaro", name: "Agachamento Búlgaro", sets: "3 × 8–12", image: asset("agachamento-bulgaro"), cue: "Desça verticalmente, mantendo o joelho alinhado ao pé." },
      { id: "cadeira-extensora", name: "Cadeira Extensora", sets: "3 × 10–15", image: asset("cadeira-extensora"), cue: "Estenda sem chutar e pause um instante no topo." },
      { id: "cadeira-abdutora", name: "Cadeira Abdutora", sets: "3 × 15–20", image: asset("cadeira-abdutora"), cue: "Abra os joelhos com controle e segure a contração." },
      { id: "cadeira-adutora", name: "Cadeira Adutora", sets: "3 × 15–20", image: asset("cadeira-adutora"), cue: "Feche as pernas com controle e mantenha a lombar apoiada." },
    ],
  },
  {
    id: "terca",
    label: "Terça",
    short: "TER",
    focus: "Superior A",
    eyebrow: "PUXAR & EMPURRAR",
    accent: "peach",
    exercises: [
      { id: "puxada-frontal-polia", name: "Puxada Frontal na Polia", sets: "3 × 8–12", image: asset("puxada-frontal-polia"), cue: "Puxe os cotovelos para baixo e não balance o tronco." },
      { id: "remada-sentada-polia", name: "Remada Sentada na Polia", sets: "3 × 8–12", image: asset("remada-sentada-polia"), cue: "Leve a alça ao umbigo com as costas longas." },
      { id: "supino-halteres", name: "Supino com Halteres", sets: "3 × 8–12", image: asset("supino-halteres"), cue: "Desça os pesos na linha do peito e suba sem bater os halteres." },
      { id: "elevacao-lateral-halteres", name: "Elevação Lateral com Halteres", sets: "3 × 12–20", image: asset("elevacao-lateral-halteres"), cue: "Eleve até a linha dos ombros com cotovelos macios." },
      { id: "rosca-direta-barra", name: "Rosca Direta com Barra", sets: "3 × 10–15", image: asset("rosca-direta-barra"), cue: "Mantenha os cotovelos próximos ao corpo durante todo o movimento." },
      { id: "triceps-polia-corda", name: "Tríceps na Polia com Corda", sets: "3 × 10–15", image: asset("triceps-polia-corda"), cue: "Empurre até estender e abra levemente a corda no final." },
    ],
  },
  {
    id: "quinta",
    label: "Quinta",
    short: "QUI",
    focus: "Inferior B",
    eyebrow: "POSTERIOR & GLÚTEOS",
    accent: "pink",
    exercises: [
      { id: "stiff-barra", name: "Stiff com Barra", sets: "3 × 6–10", image: asset("stiff-barra"), cue: "Leve o quadril para trás mantendo a barra próxima das pernas." },
      { id: "hip-thrust-2", name: "Hip Thrust", sets: "3 × 8–12", image: asset("hip-thrust"), cue: "Finalize o movimento com glúteos, sem hiperestender a lombar." },
      { id: "mesa-flexora", name: "Mesa Flexora", sets: "3 × 10–15", image: asset("mesa-flexora"), cue: "Flexione os joelhos suavemente e retorne sem soltar o peso." },
      { id: "passada-afundo", name: "Passada / Afundo", sets: "3 × 10–12", image: asset("passada-afundo"), cue: "Dê um passo firme e desça mantendo o tronco estável." },
      { id: "cadeira-extensora-2", name: "Cadeira Extensora", sets: "3 × 10–15", image: asset("cadeira-extensora"), cue: "Mantenha o quadril encaixado no banco e controle a volta." },
      { id: "cadeira-abdutora-2", name: "Cadeira Abdutora", sets: "3 × 15–20", image: asset("cadeira-abdutora"), cue: "Use uma amplitude confortável, priorizando a contração lateral." },
    ],
  },
  {
    id: "sexta",
    label: "Sexta",
    short: "SEX",
    focus: "Superior B",
    eyebrow: "COSTAS & OMBROS",
    accent: "peach",
    exercises: [
      { id: "remada-cavalinho", name: "Remada Cavalinho", sets: "3 × 8–12", image: asset("remada-cavalinho"), cue: "Incline o tronco com a coluna neutra e puxe o apoio em direção ao peito." },
      { id: "puxada-fechada-supinada", name: "Puxada Fechada com Barra Supinada", sets: "3 × 8–12", image: asset("puxada-fechada-supinada"), cue: "Use a pegada supinada e puxe a barra em direção ao alto do peito, mantendo os cotovelos próximos." },
      { id: "supino-inclinado-halteres", name: "Supino Inclinado com Halteres", sets: "3 × 8–12", image: asset("supino-inclinado-halteres"), cue: "Mantenha os punhos neutros e desça os pesos com controle." },
      { id: "desenvolvimento-ombros", name: "Desenvolvimento de Ombros", sets: "3 × 8–12", image: asset("desenvolvimento-ombros"), cue: "Empurre acima da cabeça sem arquear a lombar." },
      { id: "elevacao-lateral-halteres-2", name: "Elevação Lateral com Halteres", sets: "3 × 12–20", image: asset("elevacao-lateral-halteres"), cue: "Pense em afastar as mãos, não em subir os halteres." },
      { id: "rosca-martelo-halteres", name: "Rosca Martelo com Halteres", sets: "3 × 10–15", image: asset("rosca-martelo-halteres"), cue: "Suba com as palmas voltadas uma para a outra, sem embalo." },
      { id: "triceps-frances-halter", name: "Tríceps Francês com Halter", sets: "3 × 10–15", image: asset("triceps-frances-halter"), cue: "Flexione os cotovelos apontando para cima e mantenha-os fechados." },
    ],
  },
];

const dayIcons: Record<string, LucideIcon> = {
  segunda: Dumbbell,
  terca: MoveUpRight,
  quinta: Dumbbell,
  sexta: Sparkles,
};

const weekdayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeek() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { iso: toIsoDate(date), date };
  });
}

function getSuggestedWorkoutId(date = new Date()) {
  const workoutByWeekday: Record<number, string> = { 1: "segunda", 2: "terca", 4: "quinta", 5: "sexta" };
  return workoutByWeekday[date.getDay()] ?? "segunda";
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isWorkoutPage = location === "/treino";
  const [selectedDayId, setSelectedDayId] = useState(() => getSuggestedWorkoutId());
  const [week] = useState(getCurrentWeek);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, string | null>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const weekQueryInput = useMemo(() => ({ startDate: week[0].iso, endDate: week[6].iso }), [week]);
  const personalizationProfileQuery = trpc.personalization.profile.useQuery(undefined, { enabled: isAuthenticated });
  const day5Query = trpc.personalization.activeDay5.useQuery(undefined, { enabled: isAuthenticated && isWorkoutPage && Boolean(personalizationProfileQuery.data?.consentAt) });
  const completedQuery = trpc.workout.completed.useQuery(undefined, { enabled: isAuthenticated });
  const sessionsQuery = trpc.workout.sessions.useQuery(weekQueryInput, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const completionMutation = trpc.workout.setCompleted.useMutation({
    onSuccess: () => utils.workout.completed.invalidate(),
    onError: (_, variables) => {
      setStatusOverrides(current => {
        const next = { ...current };
        delete next[variables.exerciseId];
        return next;
      });
      toast.error("Não foi possível salvar agora. Tente novamente.");
    },
  });
  const sessionMutation = trpc.workout.setSession.useMutation({
    onSuccess: () => utils.workout.sessions.invalidate(),
    onError: (_, variables) => {
      setSessionOverrides(current => {
        const next = { ...current };
        delete next[variables.sessionDate];
        return next;
      });
      toast.error("Não foi possível salvar o dia. Tente novamente.");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setStatusOverrides({});
      setSessionOverrides({});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => undefined);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  const remoteCompleted = useMemo(() => new Set(completedQuery.data ?? []), [completedQuery.data]);
  const remoteSessions = useMemo(() => {
    const sessions = new Map<string, string>();
    (sessionsQuery.data ?? []).forEach(session => sessions.set(session.sessionDate, session.workoutId));
    return sessions;
  }, [sessionsQuery.data]);
  const allExercises = useMemo(() => workouts.flatMap(day => day.exercises), []);
  const totalCompleted = allExercises.filter(exercise => statusOverrides[exercise.id] ?? remoteCompleted.has(exercise.id)).length;
  const selectedDay = workouts.find(day => day.id === selectedDayId) ?? workouts[0];
  const dayCompleted = selectedDay.exercises.filter(exercise => statusOverrides[exercise.id] ?? remoteCompleted.has(exercise.id)).length;
  const progress = Math.round((totalCompleted / allExercises.length) * 100);
  const todayIso = toIsoDate(new Date());
  const isTodaySelectable = selectedDate === todayIso;
  const selectedSessionWorkoutId = sessionOverrides[selectedDate] ?? remoteSessions.get(selectedDate) ?? null;
  const weekSessions = week.filter(day => sessionOverrides[day.iso] !== undefined ? sessionOverrides[day.iso] : remoteSessions.has(day.iso));

  const isExerciseDone = (exerciseId: string) => statusOverrides[exerciseId] ?? remoteCompleted.has(exerciseId);

  const toggleExercise = (exercise: Exercise) => {
    if (!isAuthenticated) {
      toast("Entre para salvar seu treino", { description: "Seu progresso fica guardado na sua conta Ritmo Pro Woman." });
      startLogin();
      return;
    }
    const completed = !isExerciseDone(exercise.id);
    setStatusOverrides(current => ({ ...current, [exercise.id]: completed }));
    completionMutation.mutate({ exerciseId: exercise.id, completed });
    if (completed) toast.success("Exercício confirmado", { description: exercise.name });
  };

  const selectCalendarDate = (dateIso: string) => {
    if (dateIso !== todayIso) return;
    setSelectedDate(todayIso);
    const sessionWorkoutId = sessionOverrides[todayIso] ?? remoteSessions.get(todayIso);
    if (sessionWorkoutId) setSelectedDayId(sessionWorkoutId);
  };

  const confirmCalendarWorkout = (workoutId: string) => {
    if (!isAuthenticated) {
      toast("Entre para salvar sua semana", { description: "Assim você consegue registrar o treino de cada dia." });
      startLogin();
      return;
    }
    if (!isTodaySelectable) return;
    setSelectedDayId(workoutId);
    setSessionOverrides(current => ({ ...current, [todayIso]: workoutId }));
    sessionMutation.mutate({ sessionDate: todayIso, workoutId, completed: true });
    toast.success("Dia registrado", { description: `${workouts.find(workout => workout.id === workoutId)?.label} — ${workouts.find(workout => workout.id === workoutId)?.focus}` });
  };

  const clearCalendarWorkout = () => {
    if (!selectedSessionWorkoutId) return;
    setSessionOverrides(current => ({ ...current, [selectedDate]: null }));
    sessionMutation.mutate({ sessionDate: selectedDate, workoutId: selectedSessionWorkoutId, completed: false });
  };

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    setShowInstallTip(true);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f2ee] text-[#171717]">
      <AppHeader onInstall={installApp} />

      {!isWorkoutPage && <>
      <section id="top" className="paper-grain relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_.9fr] md:px-10 md:pb-24 md:pt-24">
        <div className="enter-up relative z-10 max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-[#e878aa]" />
            <span className="font-mono-label text-[11px] font-medium uppercase text-black/55">Seu treino, no seu ritmo</span>
          </div>
          <h1 className="max-w-[750px] text-[clamp(3.4rem,9vw,8.2rem)] font-extrabold leading-[.86] tracking-[-.075em]">
            Treine com
            <br />
            <span className="relative inline-block">intenção<span className="absolute -bottom-1 left-0 h-3 w-full -rotate-2 bg-[#f5a7c7] mix-blend-multiply md:h-5" /></span>.
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-black/65 md:text-lg">Um plano de 4 dias para você chegar mais forte, registrar cada repetição e construir constância sem complicar.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#treino" className="pressable flex items-center gap-3 rounded-full bg-[#171717] px-5 py-3.5 text-sm font-extrabold text-[#fffdf9] shadow-[5px_5px_0_#f5a7c7]">Começar treino <ArrowUpRight size={17} /></a>
            {!isStandalone && <button onClick={installApp} className="pressable flex items-center gap-2 rounded-full border border-black/20 bg-transparent px-5 py-3.5 text-sm font-extrabold hover:border-black/50"><Sparkles size={15} /> Instalar app</button>}
            {!isAuthenticated && <button onClick={() => startLogin()} className="pressable rounded-full border border-black/20 bg-transparent px-5 py-3.5 text-sm font-extrabold hover:border-black/50">Criar minha conta</button>}
          </div>
        </div>
        <div className="enter-up relative min-h-[330px] md:min-h-[430px]">
          <div className="absolute right-[3%] top-[8%] h-[270px] w-[270px] rounded-full border border-black/15 md:h-[370px] md:w-[370px]" />
          <div className="absolute right-[10%] top-[15%] h-[245px] w-[245px] rounded-full bg-[#f5a7c7] md:h-[340px] md:w-[340px]" />
          <div className="absolute right-[19%] top-[25%] h-[190px] w-[190px] rounded-full bg-[#171717] shadow-[14px_16px_0_rgba(23,23,23,.12)] md:h-[260px] md:w-[260px]" />
          <div className="absolute right-[21%] top-[27%] grid h-[180px] w-[180px] place-items-center rounded-full border border-white/20 text-center text-[#fffdf9] md:h-[230px] md:w-[230px]">
            <div><div className="font-mono-label text-[10px] uppercase tracking-[.25em] text-[#f5a7c7]">foco da semana</div><div className="mt-2 text-6xl font-extrabold tracking-[-.08em] md:text-7xl">04</div><div className="mt-1 text-xs font-bold uppercase tracking-[.2em]">dias de treino</div></div>
          </div>
          <div className="absolute left-[4%] top-[13%] rotate-[-9deg] rounded-xl border border-black/15 bg-[#fffdf9] px-4 py-3 shadow-[4px_5px_0_rgba(23,23,23,.12)] md:left-[5%] md:top-[19%]">
            <span className="font-mono-label block text-[9px] uppercase text-black/50">movimentos</span><strong className="mt-1 block text-3xl font-extrabold tracking-[-.08em]">{allExercises.length}</strong>
          </div>
          <div className="absolute bottom-[7%] left-[17%] rotate-[7deg] rounded-xl bg-[#fffdf9] px-4 py-3 shadow-[4px_5px_0_rgba(23,23,23,.12)] md:bottom-[8%] md:left-[15%]">
            <span className="font-mono-label block text-[9px] uppercase text-black/50">consistência</span><strong className="mt-1 block text-2xl font-extrabold">todo dia.</strong>
          </div>
          <div className="absolute bottom-[7%] right-[2%] grid h-12 w-12 rotate-12 place-items-center rounded-full border-2 border-[#171717] md:bottom-[10%] md:right-[4%]"><Check size={23} /></div>
        </div>
      </section>

      <div className="metric-strip border-y border-[#e878aa]/30 bg-[#f5a7c7] text-[#171717]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-[#171717]/10 md:grid-cols-4">
          {[{ value: "04", label: "dias por semana" }, { value: String(allExercises.length).padStart(2, "0"), label: "movimentos" }, { value: "03×", label: "séries por exercício" }, { value: "IA", label: "acompanhamento semanal" }].map(stat => <div key={stat.label} className="px-5 py-5 md:px-10 md:py-6"><strong className="block text-2xl font-extrabold tracking-[-.06em] md:text-3xl">{stat.value}</strong><span className="mt-1 block font-mono-label text-[9px] uppercase tracking-[.12em] text-black/55">{stat.label}</span></div>)}
        </div>
      </div>

      </>}

      <section id="treino" className="scroll-mt-20 bg-[#171717] px-5 py-14 text-[#fffdf9] md:px-10 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div><div className="font-mono-label mb-3 text-[10px] uppercase tracking-[.2em] text-[#f5a7c7]">/ seu plano semanal</div><h2 className="text-4xl font-extrabold tracking-[-.06em] md:text-6xl">O treino é seu.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-white/55">Abra o dia, veja a demonstração e confirme cada exercício quando terminar.</p></div>
            <div className="w-full max-w-xs"><div className="mb-2 flex justify-between font-mono-label text-[10px] uppercase tracking-[.13em] text-white/50"><span>{isAuthenticated ? `Olá, ${user?.name?.split(" ")[0] ?? "atleta"}` : "Seu progresso"}</span><span>{totalCompleted}/{allExercises.length} · {progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f5a7c7] transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
          </div>

          <div className="mt-12 rounded-3xl bg-[#fffdf9] p-5 text-[#171717] md:p-7">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div><div className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#e878aa]">/ semana atual</div><h3 className="mt-2 text-2xl font-extrabold tracking-[-.05em] md:text-3xl">O que você fez?</h3></div>
              <div className="font-mono-label text-[10px] uppercase tracking-[.14em] text-black/45">{weekSessions.length}/7 dias registrados</div>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-2 overflow-x-auto pb-1">
              {week.map((day, index) => {
                const recordedWorkoutId = sessionOverrides[day.iso] !== undefined ? sessionOverrides[day.iso] : remoteSessions.get(day.iso);
                const recordedWorkout = workouts.find(workout => workout.id === recordedWorkoutId);
                const active = selectedDate === day.iso;
                const isToday = toIsoDate(new Date()) === day.iso;
                return <button key={day.iso} type="button" disabled={!isToday} aria-current={isToday ? "date" : undefined} onClick={() => selectCalendarDate(day.iso)} className={`min-w-[42px] rounded-2xl border p-2 text-center transition-all md:min-w-0 ${active ? "border-[#171717] bg-[#171717] text-[#fffdf9]" : "border-black/10 bg-[#f5f2ee] hover:border-black/30"} ${!isToday ? "cursor-not-allowed opacity-40 grayscale" : ""}`}><span className={`font-mono-label block text-[9px] ${active ? "text-[#f5a7c7]" : "text-black/45"}`}>{weekdayLabels[index]}</span><span className="mt-2 block text-lg font-extrabold tracking-[-.06em]">{day.date.getDate()}</span><span className={`mx-auto mt-2 block h-2 w-2 rounded-full ${recordedWorkout ? "bg-[#e878aa]" : active ? "bg-white/25" : "bg-black/10"}`} />{isToday && <span className={`mt-1 block font-mono-label text-[8px] uppercase ${active ? "text-white/50" : "text-black/35"}`}>hoje</span>}</button>;
              })}
            </div>
            <div className="mt-6 grid gap-5 border-t border-black/10 pt-5 md:grid-cols-[.7fr_1.3fr] md:items-center">
              <div><span className="font-mono-label text-[10px] uppercase tracking-[.15em] text-black/45">{formatShortDate(week.find(day => day.iso === selectedDate)?.date ?? new Date())}</span><p className="mt-1 text-sm font-bold">{selectedSessionWorkoutId ? "Treino registrado neste dia" : "Escolha qual treino você fez"}</p>{selectedSessionWorkoutId && <button onClick={clearCalendarWorkout} className="mt-2 text-xs font-bold text-black/45 underline underline-offset-4 hover:text-[#e878aa]">Remover registro</button>}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {workouts.map(workout => { const selected = selectedSessionWorkoutId === workout.id; return <button key={workout.id} type="button" disabled={!isTodaySelectable} onClick={() => confirmCalendarWorkout(workout.id)} className={`rounded-xl border px-3 py-3 text-left transition-all ${selected ? "border-[#e878aa] bg-[#f5a7c7]" : "border-black/10 bg-[#f5f2ee] hover:border-black/30"} ${!isTodaySelectable ? "cursor-not-allowed opacity-40" : ""}`}><span className="font-mono-label block text-[9px] uppercase tracking-[.1em] text-black/45">{workout.label}</span><span className="mt-1 block text-sm font-extrabold">{workout.focus}</span>{selected && <span className="mt-2 flex items-center gap-1 font-mono-label text-[9px] uppercase text-black/60"><Check size={11} /> feito</span>}</button>; })}
              </div>
            </div>
            <div className="mt-5 grid gap-2 border-t border-black/10 pt-5 sm:grid-cols-7">
              {week.map((day, index) => { const recordedWorkoutId = sessionOverrides[day.iso] !== undefined ? sessionOverrides[day.iso] : remoteSessions.get(day.iso); const recordedWorkout = workouts.find(workout => workout.id === recordedWorkoutId); return <div key={`${day.iso}-summary`} className="flex min-w-0 items-center gap-2 text-xs"><span className="font-mono-label w-7 text-[9px] text-black/40">{weekdayLabels[index]}</span><span className={`h-2 w-2 shrink-0 rounded-full ${recordedWorkout ? "bg-[#e878aa]" : "bg-black/10"}`} /><span className="truncate font-bold text-black/55">{recordedWorkout ? recordedWorkout.focus : "Sem registro"}</span></div>; })}
            </div>
          </div>

          {isAuthenticated && day5Query.data?.active && (
            <section className="mt-8 overflow-hidden rounded-3xl border border-[#e878aa]/40 bg-[#f5a7c7] text-[#171717] shadow-[8px_8px_0_rgba(232,120,170,.18)]" aria-labelledby="day5-title">
              <div className="grid gap-6 p-5 md:grid-cols-[.75fr_1.25fr] md:p-7">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[.18em] text-black/55">/ 05 · sessão opcional com IA</div>
                  <h3 id="day5-title" className="mt-2 text-2xl font-extrabold tracking-[-.05em] md:text-3xl">{day5Query.data.focus}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/65">{day5Query.data.rationale}</p>
                  <div className="mt-4 inline-flex rounded-full border border-black/10 bg-white/45 px-3 py-1.5 font-mono-label text-[9px] uppercase tracking-[.12em]">Complementar aos 4 dias principais</div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(day5Query.data.session as Array<{name:string;sets:string;reps:string;cue:string}>).map((exercise, index) => (
                    <article key={exercise.name + index} className="rounded-2xl border border-black/10 bg-[#fffdf9]/80 p-4">
                      <div className="font-mono-label text-[9px] uppercase tracking-[.12em] text-black/40">0{index + 1}</div>
                      <h4 className="mt-2 text-sm font-extrabold">{exercise.name}</h4>
                      <div className="mt-1 font-mono-label text-[9px] uppercase text-[#e878aa]">{exercise.sets} · {exercise.reps}</div>
                      <p className="mt-2 text-xs leading-5 text-black/55">{exercise.cue}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="mt-12 grid gap-3 sm:grid-cols-4">
            {workouts.map((day, index) => {
              const Icon = dayIcons[day.id];
              const done = day.exercises.filter(exercise => isExerciseDone(exercise.id)).length;
              const active = selectedDay.id === day.id;
              return <button key={day.id} onClick={() => setSelectedDayId(day.id)} className={`pressable group relative overflow-hidden rounded-2xl border p-4 text-left ${active ? "border-[#f5a7c7] bg-[#f5a7c7] text-[#171717]" : "border-white/15 bg-white/[.04] text-white hover:border-white/35"}`}><div className="flex items-start justify-between"><span className={`font-mono-label text-[10px] ${active ? "text-black/55" : "text-white/40"}`}>0{index + 1}</span><Icon size={18} className={active ? "text-black" : "text-[#f5a7c7]"} /></div><div className="mt-7 text-lg font-extrabold tracking-[-.04em]">{day.label}</div><div className={`mt-1 text-xs font-bold uppercase tracking-[.12em] ${active ? "text-black/55" : "text-white/45"}`}>{day.focus}</div><div className={`mt-5 font-mono-label text-[10px] uppercase ${active ? "text-black/60" : "text-white/40"}`}>{done}/{day.exercises.length} confirmados</div></button>;
            })}
          </div>

          <div className="mt-14 flex flex-col justify-between gap-3 border-b border-white/15 pb-5 md:flex-row md:items-end"><div><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{selectedDay.eyebrow}</span><h3 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-4xl">{selectedDay.label} — {selectedDay.focus}</h3></div><span className="font-mono-label text-[10px] uppercase tracking-[.15em] text-white/45">{dayCompleted} de {selectedDay.exercises.length} concluídos</span></div>

          <p className="mt-4 max-w-2xl text-xs leading-5 text-white/45">Se sentir dor, desconforto anormal ou não tiver segurança para executar este movimento, interrompa o exercício e procure orientação profissional.</p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedDay.exercises.map((exercise, index) => {
              const done = isExerciseDone(exercise.id);
              return <article key={exercise.id} className={`exercise-card enter-up group overflow-hidden rounded-2xl border transition-all duration-200 ${done ? "border-[#f5a7c7]/70 bg-[#f5a7c7]/10" : "border-white/10 bg-[#fffdf9] text-[#171717]"}`}>
                <button onClick={() => setSelectedExercise(exercise)} className="exercise-image-panel relative block aspect-[1.12/1] w-full overflow-hidden bg-[#f5f2ee] text-left" aria-label={`Ver como fazer ${exercise.name}`}>
                  <img src={exercise.image} alt={`Demonstração de ${exercise.name}`} className="exercise-image h-full w-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute left-3 top-3 rounded-full bg-[#fffdf9]/85 px-2.5 py-1 font-mono-label text-[9px] uppercase tracking-[.1em] text-[#171717] backdrop-blur">0{index + 1}</span>
                  <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-[#171717] text-[#fffdf9] opacity-0 transition-opacity group-hover:opacity-100"><Play size={14} fill="currentColor" /></span>
                </button>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3"><div><h4 className={`text-[15px] font-extrabold leading-5 tracking-[-.02em] ${done ? "text-[#fffdf9]" : ""}`}>{exercise.name}</h4><p className={`mt-1 font-mono-label text-[11px] uppercase tracking-[.1em] ${done ? "text-[#f5a7c7]" : "text-black/45"}`}>{exercise.sets} séries · repetições</p></div><button onClick={() => toggleExercise(exercise)} className={`pressable grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 ${done ? "border-[#f5a7c7] bg-[#f5a7c7] text-[#171717]" : "border-black/15 text-transparent hover:border-[#171717]"}`} aria-label={done ? `Desmarcar ${exercise.name}` : `Confirmar ${exercise.name}`}><Check size={20} strokeWidth={3} /></button></div>
                  <button onClick={() => setSelectedExercise(exercise)} className={`mt-4 flex items-center gap-1 text-xs font-bold ${done ? "text-white/55 hover:text-[#f5a7c7]" : "text-black/50 hover:text-[#171717]"}`}>Ver execução <ChevronRight size={14} /></button>
                </div>
              </article>;
            })}
          </div>
        </div>
      </section>
      {isWorkoutPage && <section className="border-y border-white/10 bg-[#111614] px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-[1320px]"><SmartwatchPanel enabled={isAuthenticated && Boolean(personalizationProfileQuery.data?.consentAt)} /></div></section>}

      {!isWorkoutPage && <>
      <PersonalizationPanel />

      <NotificationCenter />

      <section id="como-funciona" className="scroll-mt-20 soft-grid px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-10 md:grid-cols-[.8fr_1.2fr] md:items-start">
          <div><div className="font-mono-label mb-3 text-[10px] uppercase tracking-[.2em] text-[#e878aa]">/ simples assim</div><h2 className="max-w-md text-4xl font-extrabold leading-[.95] tracking-[-.06em] md:text-6xl">Constância antes de tudo.</h2><p className="mt-6 max-w-sm text-sm leading-6 text-black/60">O Ritmo Pro Woman transforma o treino em uma pequena vitória por vez. Você vê, faz e confirma.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            {[{ n: "01", title: "Escolha o dia", text: "Abra a aba do treino que combina com sua agenda." }, { n: "02", title: "Veja o movimento", text: "Toque no card para abrir a demonstração e a dica de execução." }, { n: "03", title: "Confirme", text: "Clique no check e acompanhe seu progresso ao longo da semana." }].map(step => <div key={step.n} className="rounded-2xl border border-[#e878aa] bg-[#f5a7c7] p-5"><span className="font-mono-label text-[11px] text-[#e878aa]">{step.n}</span><h3 className="mt-12 text-lg font-extrabold tracking-[-.03em]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{step.text}</p></div>)}
          </div>
        </div>
      </section>

      </>}

      <footer className="flex flex-col justify-between gap-4 border-t border-black/10 px-5 py-7 md:flex-row md:items-center md:px-10"><div className="flex items-center gap-3"><img src="/ritmo-woman-icon-192.png" alt="Logo Ritmo Pro Woman" className="h-8 w-8 rounded-lg object-cover" /><span className="font-mono-label text-[10px] uppercase tracking-[.15em] text-black/50">Ritmo Pro Woman / treino 4x semana</span></div><span className="font-mono-label text-[10px] uppercase tracking-[.12em] text-black/35">Feito para você continuar.</span></footer>

      {selectedExercise && <div className="fixed inset-0 z-50 grid place-items-center bg-[#171717]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedExercise.name}`} onClick={() => setSelectedExercise(null)}><div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-[#f5f2ee] shadow-2xl md:grid-cols-2" onClick={event => event.stopPropagation()}><button onClick={() => setSelectedExercise(null)} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-[#171717] text-[#fffdf9]" aria-label="Fechar"><X size={18} /></button><div className="bg-[#fffdf9] p-3 md:p-5"><img src={selectedExercise.image} alt={`Demonstração de ${selectedExercise.name}`} className="h-full max-h-[520px] w-full rounded-2xl object-cover" /></div><div className="flex flex-col justify-center p-7 md:p-10"><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#e878aa]">como fazer</span><h2 className="mt-3 text-3xl font-extrabold leading-[.95] tracking-[-.06em]">{selectedExercise.name}</h2><div className="mt-5 inline-flex w-fit rounded-full bg-[#f5a7c7] px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-[.1em]">{selectedExercise.sets}</div><p className="mt-7 text-sm leading-7 text-black/65">{selectedExercise.cue}</p><button onClick={() => { toggleExercise(selectedExercise); setSelectedExercise(null); }} className="pressable mt-8 flex items-center justify-center gap-2 rounded-full bg-[#171717] px-5 py-3.5 text-sm font-extrabold text-[#fffdf9]">{isExerciseDone(selectedExercise.id) ? "Desmarcar exercício" : "Confirmar exercício"} <CheckCircle2 size={17} /></button></div></div></div>}

      {showInstallTip && <div className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-black/10 bg-[#fffdf9] p-5 text-[#171717] shadow-2xl md:left-auto md:max-w-sm"><div className="flex items-start justify-between gap-4"><div><span className="font-mono-label text-[10px] uppercase tracking-[.15em] text-[#e878aa]">Ritmo Pro Woman no seu celular</span><h3 className="mt-2 text-lg font-extrabold">Instale como aplicativo</h3></div><button onClick={() => setShowInstallTip(false)} className="text-black/40 hover:text-black" aria-label="Fechar instruções"><X size={18} /></button></div><p className="mt-3 text-sm leading-6 text-black/60"><strong>iPhone/iPad:</strong> toque em Compartilhar no Safari e escolha <em>Adicionar à Tela de Início</em>.</p><p className="mt-2 text-sm leading-6 text-black/60"><strong>Android:</strong> abra o menu do Chrome e escolha <em>Instalar aplicativo</em> ou <em>Adicionar à tela inicial</em>.</p></div>}

      {loading && <div className="fixed bottom-4 right-4 z-40 rounded-full bg-[#171717] px-4 py-2 font-mono-label text-[10px] uppercase tracking-[.1em] text-[#f5a7c7]">carregando conta…</div>}
    </main>
  );
}
