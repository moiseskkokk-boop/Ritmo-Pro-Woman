import { useEffect, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Check, ChevronDown, CircleAlert, FileImage, Languages, Loader2, LockKeyhole, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";

type Language = "pt" | "en" | "es";
type View = "front" | "side" | "back";
type WeeklyData = { objective: string; upperLoad: string; squatLoad: string; cardio: string; sleep: string; recovery: string; fatigue: string };
type Photo = { dataUrl: string; name: string; width: number; height: number; bytes: number; aspect: number };

const emptyWeeklyData: WeeklyData = { objective: "", upperLoad: "", squatLoad: "", cardio: "", sleep: "", recovery: "", fatigue: "" };
const weeklyOptions = {
  objective: ["Melhorar minha performance", "Manter minha condição física e saúde", "Melhorar performance e composição corporal"],
  upperLoad: ["6–8 kg", "8–12 kg", "12–17,5 kg", "Acima de 17,5 kg", "Ainda não treino com halteres"],
  squatLoad: ["5–10 kg por lado", "10–20 kg por lado", "20–30 kg por lado", "30–40 kg por lado", "40–50 kg por lado", "Acima de 50 kg por lado", "Ainda não faço agachamento com carga"],
  cardio: ["Não faço cardio", "20 minutos por dia", "30 minutos por dia", "1 hora por dia", "Mais de 1 hora por dia"],
  sleep: ["Menos de 7 horas", "8 horas", "9 horas", "10 horas", "Mais de 10 horas"],
  recovery: ["Tenho dificuldade para me recuperar", "Recupero razoavelmente", "Recupero bem", "Recupero muito bem"],
  fatigue: ["Muito cansado", "Cansado, mas recuperável", "Bem recuperado", "Sinto que poderia treinar mais"],
} as const;
const viewLabels = { front: "Frente", side: "Lateral", back: "Costas" } as const;
const consistencyLabels = {
  pt: { lighting: "Iluminação parecida", distance: "Distância parecida", posture: "Postura parecida", clothing: "Roupa semelhante", environment: "Ambiente semelhante" },
  en: { lighting: "Similar lighting", distance: "Similar distance", posture: "Similar posture", clothing: "Similar clothing", environment: "Similar environment" },
  es: { lighting: "Iluminación similar", distance: "Distancia similar", posture: "Postura similar", clothing: "Ropa similar", environment: "Entorno similar" },
} as const;

const copy = {
  pt: { eyebrow: "/ acompanhamento inteligente", title: "Seu próximo ciclo começa com dados.", description: "A avaliação semanal reúne treino, performance e recuperação para orientar o próximo ciclo — sempre como estimativa e não como diagnóstico.", login: "Entrar para começar", consentCta: "Liberar acompanhamento", consentTitle: "Antes de começar", consentButton: "Confirmar e continuar", consent: "O Ritmo Pro Woman utiliza as informações fornecidas por você, seus registros de treino, medidas e imagens enviadas para personalizar sua experiência.", consent2: "As análises visuais são estimativas e não substituem uma avaliação profissional.", consentCheck: "Li e compreendi as informações acima e confirmo que as informações fornecidas são verdadeiras e completas dentro do meu conhecimento.", privacyTitle: "Suas informações são privadas", privacyText: "Suas fotos, medidas, respostas, progresso e análises ficam vinculados somente à sua conta. Outras pessoas não têm acesso a esse conteúdo.", deleteTitle: "Limpar informações de tudo", deleteText: "Limpa tudo desta conta: fotos, avaliações, análises, medidas, respostas, notificações e progresso de treino.", deleteConfirm: "Tem certeza que deseja limpar todas as informações da sua conta, incluindo fotos e avaliações? Esta ação não pode ser desfeita.", deleteButton: "Limpar informações de tudo", deleted: "Todas as informações foram limpas.", deleteAssessmentsTitle: "Apagar avaliações semanais", deleteAssessmentsText: "Remove as avaliações, fotos e análises semanais, sem apagar seu cadastro ou progresso de treino.", deleteAssessmentsConfirm: "Tem certeza que deseja apagar todas as avaliações semanais, fotos e análises? Esta ação não pode ser desfeita.", deleteAssessmentsButton: "Apagar avaliações", assessmentsDeleted: "As avaliações semanais foram apagadas.", language: "Idioma", photos: "Fotos de referência", photoHelp: "Use iluminação, distância, postura, roupa e ambiente semelhantes sempre que possível.", photoConsistency: "Padronize as fotos para comparar melhor", choose: "Escolher foto", height: "Altura (cm)", weight: "Peso (kg)", photoProgress: "fotos", questionProgress: "respostas", notes: "Observações adicionais", notesPlaceholder: "Ex.: mantive as cargas, dormi bem, senti desconforto...", save: "Salvar avaliação semanal", analyze: "Analisar próximo ciclo", analyzing: "Analisando com cuidado...", history: "Avaliações semanais", visualEstimate: "Estimativa visual", confidence: "Confiança da análise", priorities: "Prioridades atuais", basis: "Base da análise", evolving: "Evolução observada", attention: "Pontos para observar", limitations: "Limitações", day5: "5º dia — Opcional · definido pela IA", day5On: "Definido temporariamente", day5Off: "Não definido", day5Reason: "Por que", noData: "Ainda não há dados suficientes.", noAnalysis: "Salve uma avaliação semanal completa para receber a primeira análise.", clearAssessment: "Limpar informações e começar novamente", clearConfirm: "Tem certeza que deseja apagar suas respostas e preencher a avaliação novamente?", weeklyAssessmentTitle: "Dados para personalização do próximo ciclo", weeklyAssessmentHelp: "Faça esta avaliação uma vez por semana. O 5º dia é adaptativo e será definido pela IA com base no conjunto dos indicadores.", optionSelect: "Selecione uma opção", weekLabel: "Semana atual", weeklySaved: "Avaliação semanal salva e pronta para o próximo ciclo.", safety: "Se sentir dor, desconforto anormal ou não tiver segurança para executar um movimento, interrompa o exercício e procure orientação profissional.", close: "Fechar", uploadError: "Escolha uma imagem JPG, PNG ou WebP de até 6 MB." },
  en: { eyebrow: "/ intelligent follow-up", title: "Your next cycle starts with data.", description: "The weekly assessment combines training, performance and recovery to guide the next cycle — always as an estimate, never a diagnosis.", login: "Sign in to start", consentCta: "Enable follow-up", consentTitle: "Before you start", consentButton: "Confirm and continue", consent: "Ritmo Pro Woman uses the information, workout records, measurements and images you provide to personalize your experience.", consent2: "Visual analyses are estimates and do not replace a professional assessment.", consentCheck: "I have read and understood the information above and confirm that the information I provide is true and complete to the best of my knowledge.", privacyTitle: "Your information is private", privacyText: "Your photos, measurements, answers, progress and analyses are linked only to your account. Other people cannot access this content.", deleteTitle: "Delete all information", deleteText: "Deletes photos, assessments, analyses, measurements, answers, notifications and workout progress from this account.", deleteConfirm: "Are you sure you want to delete all information from your account? This cannot be undone.", deleteButton: "Delete all information", deleted: "All information was deleted.", deleteAssessmentsTitle: "Delete weekly assessments", deleteAssessmentsText: "Removes weekly assessments, photos and analyses without deleting your account or workout progress.", deleteAssessmentsConfirm: "Are you sure you want to delete all weekly assessments, photos and analyses? This cannot be undone.", deleteAssessmentsButton: "Delete assessments", assessmentsDeleted: "Weekly assessments were deleted.", language: "Language", photos: "Reference photos", photoHelp: "Use similar lighting, distance, posture, clothing and environment whenever possible.", photoConsistency: "Keep photos consistent for better comparison", choose: "Choose photo", height: "Height (cm)", weight: "Weight (kg)", photoProgress: "photos", questionProgress: "answers", notes: "Additional notes", notesPlaceholder: "E.g. loads were stable, slept well, felt discomfort...", save: "Save weekly assessment", analyze: "Analyze next cycle", analyzing: "Analyzing carefully...", history: "Weekly assessments", visualEstimate: "Visual estimate", confidence: "Analysis confidence", priorities: "Current priorities", basis: "Analysis basis", evolving: "Observed progress", attention: "Points to observe", limitations: "Limitations", day5: "Fifth day — Optional · AI-defined", day5On: "Temporarily defined", day5Off: "Not defined", day5Reason: "Why", noData: "There is not enough data yet.", noAnalysis: "Save a complete weekly assessment to receive the first analysis.", clearAssessment: "Clear information and start again", clearConfirm: "Are you sure you want to delete your answers and complete the assessment again?", weeklyAssessmentTitle: "Data for next-cycle personalization", weeklyAssessmentHelp: "Complete this assessment once a week. The fifth day is adaptive and will be defined by AI using the complete set of indicators.", optionSelect: "Select an option", weekLabel: "Current week", weeklySaved: "Weekly assessment saved for the next cycle.", safety: "If you feel pain, unusual discomfort or lack confidence performing a movement, stop and seek professional guidance.", close: "Close", uploadError: "Choose a JPG, PNG or WebP image up to 6 MB." },
  es: { eyebrow: "/ seguimiento inteligente", title: "Tu próximo ciclo empieza con datos.", description: "La evaluación semanal combina entrenamiento, rendimiento y recuperación para orientar el próximo ciclo — siempre como estimación, nunca como diagnóstico.", login: "Entrar para empezar", consentCta: "Activar seguimiento", consentTitle: "Antes de empezar", consentButton: "Confirmar y continuar", consent: "Ritmo Pro Woman utiliza la información, los registros, las medidas y las imágenes que proporcionas para personalizar tu experiencia.", consent2: "Los análisis visuales son estimaciones y no sustituyen la evaluación de un profesional.", consentCheck: "He leído y comprendido la información anterior y confirmo que los datos proporcionados son verdaderos y completos según mi conocimiento.", privacyTitle: "Tu información es privada", privacyText: "Tus fotos, medidas, respuestas, progreso y análisis están vinculados solo a tu cuenta. Otras personas no pueden acceder a este contenido.", deleteTitle: "Borrar toda la información", deleteText: "Borra fotos, evaluaciones, análisis, medidas, respuestas, notificaciones y progreso de entrenamiento de esta cuenta.", deleteConfirm: "¿Estás segura de que quieres borrar toda la información de tu cuenta? Esta acción no se puede deshacer.", deleteButton: "Borrar toda la información", deleted: "Toda la información fue borrada.", deleteAssessmentsTitle: "Borrar evaluaciones semanales", deleteAssessmentsText: "Elimina las evaluaciones, fotos y análisis semanales sin borrar tu cuenta ni tu progreso de entrenamiento.", deleteAssessmentsConfirm: "¿Estás segura de que quieres borrar todas las evaluaciones, fotos y análisis semanales? Esta acción no se puede deshacer.", deleteAssessmentsButton: "Borrar evaluaciones", assessmentsDeleted: "Las evaluaciones semanales fueron borradas.", language: "Idioma", photos: "Fotos de referencia", photoHelp: "Usa iluminación, distancia, postura, ropa y ambiente similares siempre que sea posible.", photoConsistency: "Mantén las fotos consistentes para comparar mejor", choose: "Elegir foto", height: "Altura (cm)", weight: "Peso (kg)", photoProgress: "fotos", questionProgress: "respuestas", notes: "Notas adicionales", notesPlaceholder: "Ej.: mantuve las cargas, dormí bien, sentí molestias...", save: "Guardar evaluación semanal", analyze: "Analizar próximo ciclo", analyzing: "Analizando con cuidado...", history: "Evaluaciones semanales", visualEstimate: "Estimación visual", confidence: "Confianza del análisis", priorities: "Prioridades actuales", basis: "Base del análisis", evolving: "Evolución observada", attention: "Puntos a observar", limitations: "Limitaciones", day5: "Quinto día — Opcional · definido por IA", day5On: "Definido temporalmente", day5Off: "No definido", day5Reason: "Por qué", noData: "Todavía no hay datos suficientes.", noAnalysis: "Guarda una evaluación semanal completa para recibir el primer análisis.", clearAssessment: "Limpiar información y empezar de nuevo", clearConfirm: "¿Estás segura de que quieres borrar tus respuestas y completar la evaluación de nuevo?", weeklyAssessmentTitle: "Datos para personalizar el próximo ciclo", weeklyAssessmentHelp: "Completa esta evaluación una vez por semana. El quinto día es adaptativo y la IA lo definirá según el conjunto de indicadores.", optionSelect: "Selecciona una opción", weekLabel: "Semana actual", weeklySaved: "Evaluación semanal guardada para el próximo ciclo.", safety: "Si sientes dolor, molestias anormales o no tienes seguridad para ejecutar un movimiento, detente y busca orientación profesional.", close: "Cerrar", uploadError: "Elige una imagen JPG, PNG o WebP de hasta 6 MB." },
} as const;

function readFile(file: File) {
  return new Promise<Omit<Photo, "name">>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => resolve({ dataUrl, width: image.naturalWidth, height: image.naturalHeight, bytes: file.size, aspect: image.naturalWidth / image.naturalHeight });
      image.onerror = () => reject(new Error("image"));
      image.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

function currentWeekKey() {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export default function PersonalizationPanel() {
  const { isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const profileQuery = trpc.personalization.profile.useQuery(undefined, { enabled: isAuthenticated });
  const language = (profileQuery.data?.language as Language | undefined) ?? "pt";
  const t = copy[language];
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [photos, setPhotos] = useState<Partial<Record<View, Photo>>>({});
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState({ waist: "", glutes: "", thigh: "", calf: "" });
  const [trainingData, setTrainingData] = useState<WeeklyData>(emptyWeeklyData);
  const [consistency, setConsistency] = useState({ lighting: false, distance: false, posture: false, clothing: false, environment: false });
  const [savedAssessmentId, setSavedAssessmentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const saveProfile = trpc.personalization.saveProfile.useMutation({ onSuccess: () => { profileQuery.refetch(); if (showConsent) { toast.success("Acompanhamento liberado."); setShowConsent(false); } } });
  const uploadPhoto = trpc.personalization.uploadPhoto.useMutation();
  const createAssessment = trpc.personalization.createAssessment.useMutation();
  const assessmentsQuery = trpc.personalization.assessments.useQuery(undefined, { enabled: Boolean(profileQuery.data?.consentAt) });
  const latestQuery = trpc.personalization.latestAnalysis.useQuery(undefined, { enabled: Boolean(profileQuery.data?.consentAt) });
  const day5Query = trpc.personalization.activeDay5.useQuery(undefined, { enabled: Boolean(profileQuery.data?.consentAt) });
  const analyze = trpc.personalization.analyze.useMutation({ onSuccess: () => { latestQuery.refetch(); day5Query.refetch(); toast.success("Análise atualizada."); }, onError: () => toast.error("Não foi possível analisar agora.") });
  const deleteAssessments = trpc.personalization.deleteAssessments.useMutation();
  const deleteAllData = trpc.account.deleteAllData.useMutation();
  const profile = profileQuery.data;
  const canAccess = Boolean(isAuthenticated && profile?.consentAt);
  const complete = Boolean(photos.front && photos.side && photos.back);
  const weeklyComplete = Object.values(trainingData).every(Boolean);
  const photoCount = Object.keys(photos).length;
  const questionCount = Object.values(trainingData).filter(Boolean).length;
  const consistencyCount = Object.values(consistency).filter(Boolean).length;
  const selectedAssessment = useMemo(() => assessmentsQuery.data?.find(item => item.id === savedAssessmentId) ?? assessmentsQuery.data?.[0], [assessmentsQuery.data, savedAssessmentId]);
  const previousAssessment = useMemo(() => assessmentsQuery.data?.find(item => item.id !== selectedAssessment?.id), [assessmentsQuery.data, selectedAssessment?.id]);
  const latest = latestQuery.data?.result as { overview?: string; confidence?: number; estimatedAreas?: Array<{ area: string; status: string; evidence: string }>; evolving?: string[]; attention?: string[]; priorities?: string[]; limitations?: string[]; day5?: { active: boolean; reason: string } } | null | undefined;

  useEffect(() => { if (profile?.language && profile.language !== language) profileQuery.refetch(); }, [profile?.language, language, profileQuery]);
  useEffect(() => {
    if (profile?.heightCm && !height) setHeight(profile.heightCm);
    if (profile?.weightKg && !weight) setWeight(profile.weightKg);
  }, [profile?.heightCm, profile?.weightKg, height, weight]);

  const choosePhoto = async (view: View, file?: File) => {
    if (!file || !file.type.match(/^image\/(jpeg|jpg|png|webp)$/) || file.size > 6_000_000) return toast.error(t.uploadError);
    try { const data = await readFile(file); setPhotos(current => ({ ...current, [view]: { ...data, name: file.name } })); } catch { toast.error("Não foi possível ler esta imagem."); }
  };

  const saveAssessment = async () => {
    if (!complete || !weeklyComplete) return toast.error("Preencha as fotos e as 7 perguntas da avaliação semanal.");
    try {
      const uploaded = await Promise.all((Object.keys(viewLabels) as View[]).map(async view => [view, await uploadPhoto.mutateAsync({ view, dataUrl: photos[view]!.dataUrl })] as const));
      const keyMap = Object.fromEntries(uploaded.map(([view, result]) => [view, result.key])) as Record<View, string>;
      await saveProfile.mutateAsync({ heightCm: height || null, weightKg: weight || null });
      const result = await createAssessment.mutateAsync({ weekKey: currentWeekKey(), label: `Semana ${currentWeekKey()}`, assessmentDate: new Date().toISOString().slice(0, 10), frontKey: keyMap.front, sideKey: keyMap.side, backKey: keyMap.back, heightCm: height || null, weightKg: weight || null, trainingNotes: notes || null, measurements: Object.fromEntries(Object.entries(measurements).filter(([, value]) => value.trim())), quality: (Object.keys(viewLabels) as View[]).map(view => { const photo = photos[view]!; return { view, width: photo.width, height: photo.height, bytes: photo.bytes, aspect: photo.aspect, consistency }; }), trainingData });
      setSavedAssessmentId(result.id);
      await assessmentsQuery.refetch();
      toast.success(t.weeklySaved);
    } catch { toast.error("Não foi possível salvar a avaliação."); }
  };

  const clearWeeklyAssessment = () => {
    if (!window.confirm(t.clearConfirm)) return;
    setPhotos({});
    setHeight("");
    setWeight("");
    setNotes("");
    setMeasurements({ waist: "", glutes: "", thigh: "", calf: "" });
    setTrainingData(emptyWeeklyData);
    setConsistency({ lighting: false, distance: false, posture: false, clothing: false, environment: false });
    setSavedAssessmentId(null);
    toast.success(t.clearAssessment);
  };

  const runAnalysis = () => {
    const id = savedAssessmentId ?? assessmentsQuery.data?.[0]?.id;
    if (!id) return toast.error(t.noAnalysis);
    analyze.mutate({ assessmentId: id, language });
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await deleteAllData.mutateAsync();
      setPhotos({});
      setHeight("");
      setWeight("");
      setNotes("");
      setMeasurements({ waist: "", glutes: "", thigh: "", calf: "" });
      setTrainingData(emptyWeeklyData);
      setConsistency({ lighting: false, distance: false, posture: false, clothing: false, environment: false });
      setSavedAssessmentId(null);
      await Promise.all([
        utils.personalization.profile.invalidate(),
        utils.personalization.assessments.invalidate(),
        utils.personalization.latestAnalysis.invalidate(),
        utils.personalization.activeDay5.invalidate(),
        utils.personalization.wearableConnections.invalidate(),
        utils.personalization.weeklyActivity.invalidate(),
      ]);
      toast.success(t.deleted);
      await logout();
      window.location.replace(window.location.pathname);
    } catch {
      toast.error("Não foi possível apagar as informações agora.");
    }
  };

  const handleDeleteAssessments = async () => {
    if (!window.confirm(t.deleteAssessmentsConfirm)) return;
    try {
      await deleteAssessments.mutateAsync();
      setPhotos({});
      setSavedAssessmentId(null);
      await Promise.all([
        assessmentsQuery.refetch(),
        latestQuery.refetch(),
        day5Query.refetch(),
      ]);
      toast.success(t.assessmentsDeleted);
    } catch {
      toast.error("Não foi possível apagar as avaliações agora.");
    }
  };

  if (!isAuthenticated) return <section id="acompanhamento" className="scroll-mt-20 border-y border-white/10 bg-[#111614] px-5 py-16 text-white md:px-10 md:py-24"><div className="mx-auto max-w-[1320px] rounded-3xl border border-white/10 bg-white/[.04] p-7 md:p-12"><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{t.eyebrow}</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.05em] md:text-5xl">{t.title}</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">{t.description}</p><Button onClick={startLogin} className="mt-7 rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]"><LockKeyhole size={16} /> {t.login}</Button></div></section>;

  return <section id="acompanhamento" className="scroll-mt-20 border-y border-white/10 bg-[#111614] px-5 py-16 text-white md:px-10 md:py-24"><div className="mx-auto max-w-[1320px]"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{t.eyebrow}</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.05em] md:text-5xl">{t.title}</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">{t.description}</p></div><label className="flex items-center gap-2 text-xs font-bold text-white/60"><Languages size={16} className="text-[#f5a7c7]" />{t.language}<select value={language} onChange={event => saveProfile.mutate({ language: event.target.value as Language })} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-white"><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></label></div>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#72c7a0]/30 bg-[#72c7a0]/10 p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#72c7a0]" /><div><h3 className="text-sm font-extrabold text-white">{t.privacyTitle}</h3><p className="mt-1 text-xs leading-5 text-white/60">{t.privacyText}</p></div></div>
      {!canAccess ? <div className="mt-8 rounded-3xl border border-[#f5a7c7]/40 bg-[#f5a7c7]/10 p-6 md:p-8"><div className="flex items-start gap-4"><CircleAlert className="mt-1 shrink-0 text-[#f5a7c7]" /><div><h3 className="text-xl font-extrabold">{t.consentTitle}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t.consent}</p><p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">{t.consent2}</p><Button onClick={() => setShowConsent(true)} className="mt-6 rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]"><Check size={16} /> {t.consentCta}</Button></div></div></div> : <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">{t.photos}</span><h3 className="mt-2 text-2xl font-extrabold">{t.photos}</h3><p className="mt-3 text-sm leading-6 text-white/55">{t.photoHelp}</p></div><Camera className="text-[#f5a7c7]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{(Object.keys(viewLabels) as View[]).map(view => <label key={view} className="group relative flex aspect-[.85/1] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/20 text-center transition hover:border-[#f5a7c7]"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => choosePhoto(view, event.target.files?.[0])} />{photos[view] ? <img src={photos[view]!.dataUrl} alt={viewLabels[view]} className="absolute inset-0 h-full w-full object-cover" /> : <><Upload className="mb-3 text-[#f5a7c7]" size={22} /><span className="text-sm font-extrabold">{viewLabels[view]}</span><span className="mt-2 text-[10px] uppercase tracking-[.1em] text-white/40">{t.choose}</span></>}{photos[view] && <span className="absolute bottom-2 left-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{viewLabels[view]}</span>}</label>)}</div><div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold text-white/80">{t.photoConsistency}</span><span className="font-mono-label text-[10px] uppercase tracking-[.12em] text-[#f5a7c7]">{photoCount}/3 {t.photoProgress} · {questionCount}/7 {t.questionProgress}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{(Object.keys(consistency) as Array<keyof typeof consistency>).map(key => <label key={key} className="flex items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={consistency[key]} onChange={event => setConsistency(current => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-[#f5a7c7]" />{consistencyLabels[language][key]}</label>)}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f5a7c7] transition-all" style={{ width: `${Math.round(((photoCount + questionCount + consistencyCount) / 15) * 100)}%` }} /></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-xs font-bold text-white/60">{t.height}<input value={height} onChange={event => setHeight(event.target.value)} inputMode="decimal" placeholder="Ex.: 165" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#f5a7c7]" /></label><label className="text-xs font-bold text-white/60">{t.weight}<input value={weight} onChange={event => setWeight(event.target.value)} inputMode="decimal" placeholder="Ex.: 62" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#f5a7c7]" /></label><div><span className="text-xs font-bold text-white/60">Medidas (opcional)</span><div className="mt-2 grid grid-cols-2 gap-2">{(["waist", "glutes", "thigh", "calf"] as const).map(key => <input key={key} aria-label={key} placeholder={key === "waist" ? "Cintura" : key === "glutes" ? "Glúteos" : key === "thigh" ? "Coxa" : "Panturrilha"} value={measurements[key]} onChange={event => setMeasurements(current => ({ ...current, [key]: event.target.value }))} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[#f5a7c7]" />)}</div></div><label className="text-xs font-bold text-white/60 md:col-span-2">{t.notes}<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder={t.notesPlaceholder} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f5a7c7]" /></label></div><div className="mt-6 rounded-2xl border border-[#f5a7c7]/30 bg-[#f5a7c7]/10 p-5"><div className="flex items-start justify-between gap-4"><div><span className="font-mono-label text-[10px] uppercase tracking-[.12em] text-[#f5a7c7]">{t.weekLabel} · {currentWeekKey()}</span><h3 className="mt-2 text-xl font-extrabold">{t.weeklyAssessmentTitle}</h3><p className="mt-2 text-xs leading-6 text-white/60">{t.weeklyAssessmentHelp}</p></div><Sparkles className="shrink-0 text-[#f5a7c7]" /></div><div className="mt-5 grid gap-3">{([ ["objective", "Qual é o seu principal objetivo?", weeklyOptions.objective], ["upperLoad", "Nos exercícios de membros superiores, qual é aproximadamente a carga utilizada em cada halter?", weeklyOptions.upperLoad], ["squatLoad", "No agachamento, qual é aproximadamente a carga utilizada em cada lado da barra?", weeklyOptions.squatLoad], ["cardio", "Quanto cardio você costuma fazer por dia?", weeklyOptions.cardio], ["sleep", "Quantas horas você costuma dormir por noite?", weeklyOptions.sleep], ["recovery", "Como você avalia sua recuperação após os treinos?", weeklyOptions.recovery], ["fatigue", "Como você se sente ao final dos 4 dias de treino da semana?", weeklyOptions.fatigue] ] as const).map(([key, label, options], index) => <label key={key} className="text-xs font-bold text-white/70"><span className="mb-2 block text-sm leading-5 text-white"><span className="mr-2 text-[#f5a7c7]">{index + 1}.</span>{label}</span><select value={trainingData[key]} onChange={event => setTrainingData(current => ({ ...current, [key]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white outline-none focus:border-[#f5a7c7]"><option value="">{t.optionSelect}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Button disabled={!complete || !weeklyComplete || createAssessment.isPending || uploadPhoto.isPending} onClick={saveAssessment} className="rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]">{createAssessment.isPending || uploadPhoto.isPending ? <Loader2 className="animate-spin" size={16} /> : <FileImage size={16} />} {t.save}</Button><button type="button" onClick={clearWeeklyAssessment} className="text-xs font-bold text-[#f5a7c7] underline-offset-4 hover:underline">{t.clearAssessment}</button></div></div><div className="mt-6"><Button disabled={!selectedAssessment || analyze.isPending} onClick={runAnalysis} variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10">{analyze.isPending ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} {analyze.isPending ? t.analyzing : t.analyze}</Button></div></div><div className="space-y-5"><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 md:p-8"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">{t.history}</h3><span className="font-mono-label text-[10px] uppercase tracking-[.15em] text-white/40">{assessmentsQuery.data?.length ?? 0}</span></div>{assessmentsQuery.data?.length ? <div className="mt-5 space-y-3">{assessmentsQuery.data.map(assessment => <button key={assessment.id} onClick={() => setSavedAssessmentId(assessment.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selectedAssessment?.id === assessment.id ? "border-[#f5a7c7] bg-[#f5a7c7]/10" : "border-white/10 bg-black/10 hover:border-white/30"}`}><img src={assessment.frontUrl} alt="" className="h-14 w-12 rounded-lg object-cover" /><span className="min-w-0"><span className="block text-sm font-extrabold">{assessment.label}</span><span className="font-mono-label text-[10px] text-white/45">{assessment.assessmentDate}</span></span><ChevronDown className="ml-auto -rotate-90 text-white/30" size={16} /></button>)}</div> : <p className="mt-4 text-sm leading-6 text-white/50">{t.noAnalysis}</p>}<div className="mt-5 border-t border-white/10 pt-5"><p className="text-xs leading-5 text-white/45">{t.deleteAssessmentsText}</p><button type="button" disabled={deleteAssessments.isPending || !assessmentsQuery.data?.length} onClick={handleDeleteAssessments} className="mt-3 flex items-center gap-2 text-xs font-extrabold text-red-200 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> {t.deleteAssessmentsButton}</button></div></div>{selectedAssessment && <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 md:p-8"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">{selectedAssessment.label}</h3><span className="font-mono-label text-[10px] text-white/40">{selectedAssessment.assessmentDate}</span></div><p className="mt-2 text-xs uppercase tracking-[.12em] text-[#f5a7c7]">{t.visualEstimate}</p><div className="mt-4 grid grid-cols-3 gap-2"><img src={selectedAssessment.frontUrl} alt="Frente" className="aspect-[.8/1] w-full rounded-xl object-cover" /><img src={selectedAssessment.sideUrl} alt="Lateral" className="aspect-[.8/1] w-full rounded-xl object-cover" /><img src={selectedAssessment.backUrl} alt="Costas" className="aspect-[.8/1] w-full rounded-xl object-cover" /></div></div>}{day5Query.data && <div className="rounded-3xl border border-[#f5a7c7]/30 bg-[#f5a7c7]/10 p-6 md:p-8"><div className="flex items-start gap-3"><Sparkles className="mt-1 text-[#f5a7c7]" /><div><h3 className="text-xl font-extrabold">{t.day5}</h3><span className="mt-2 inline-block rounded-full border border-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-white/70">{day5Query.data.active ? t.day5On : t.day5Off}</span><p className="mt-4 text-sm leading-6 text-white/65"><strong>{t.day5Reason}:</strong> {day5Query.data.rationale}</p></div></div></div>}</div></div>}
      {latest && <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-[#f5a7c7]/30 bg-[#f5a7c7]/10 p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#f5a7c7]">{t.confidence}: {latest.confidence}%</p><h3 className="mt-3 text-2xl font-extrabold">{latest.overview}</h3><div className="mt-5 grid gap-3 sm:grid-cols-2">{latest.estimatedAreas?.map(area => <div key={area.area} className="rounded-2xl bg-black/10 p-4"><span className="text-sm font-extrabold">{area.area}</span><span className="mt-1 block text-[11px] font-bold uppercase tracking-[.1em] text-[#f5a7c7]">{area.status}</span><p className="mt-2 text-xs leading-5 text-white/55">{area.evidence}</p></div>)}</div></div><div className="space-y-5"><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><h3 className="font-extrabold">{t.priorities}</h3><ol className="mt-4 space-y-2">{latest.priorities?.map((item, index) => <li key={item} className="flex gap-3 text-sm"><span className="font-mono-label text-[#f5a7c7]">0{index + 1}</span><span className="font-bold">{item}</span></li>)}</ol></div><div className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><button onClick={() => setExpanded(value => !value)} className="flex w-full items-center justify-between text-left font-extrabold">{t.basis}<ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} size={17} /></button>{expanded && <div className="mt-4 space-y-4 text-sm"><div><span className="font-mono-label text-[10px] uppercase text-[#f5a7c7]">{t.evolving}</span><p className="mt-2 leading-6 text-white/65">{latest.evolving?.join(" · ") || t.noData}</p></div><div><span className="font-mono-label text-[10px] uppercase text-[#f5a7c7]">{t.attention}</span><p className="mt-2 leading-6 text-white/65">{latest.attention?.join(" · ") || t.noData}</p></div><div><span className="font-mono-label text-[10px] uppercase text-[#f5a7c7]">{t.limitations}</span><p className="mt-2 leading-6 text-white/65">{latest.limitations?.join(" · ") || t.noData}</p></div></div>}</div></div></div>}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-xs leading-5 text-white/45"><CircleAlert size={16} className="mt-0.5 shrink-0 text-[#f5a7c7]" />{t.safety}</div><div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-950/20 p-5 sm:flex-row sm:items-center"><div><h3 className="text-sm font-extrabold text-white">{t.deleteTitle}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-white/50">{t.deleteText}</p></div><Button type="button" disabled={deleteAllData.isPending} onClick={handleDeleteAllData} variant="outline" className="shrink-0 rounded-full border-red-300/30 bg-transparent text-red-200 hover:bg-red-400/10">{deleteAllData.isPending ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} {t.deleteButton}</Button></div></div></section>;
}
