import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const photoQuery = trpc.account.profilePhoto.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const upload = trpc.account.uploadProfilePhoto.useMutation({
    onSuccess: async () => {
      setPreview(null);
      await Promise.all([photoQuery.refetch(), utils.account.profilePhoto.invalidate()]);
      toast.success("Foto de perfil salva na sua conta.");
    },
    onError: error => toast.error(error.message || "Não foi possível salvar a foto."),
  });
  const remove = trpc.account.deleteProfilePhoto.useMutation({
    onSuccess: async () => {
      setPreview(null);
      await Promise.all([photoQuery.refetch(), utils.account.profilePhoto.invalidate()]);
      toast.success("Foto de perfil removida.");
    },
    onError: () => toast.error("Não foi possível remover a foto agora."),
  });
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const displayName = user?.name?.trim() || "Atleta";
  const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  const chooseFile = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type) || file.size > 6_000_000) {
      toast.error("Escolha uma imagem JPG, PNG ou WebP de até 6 MB.");
      return;
    }
    try { setPreview(await readImage(file)); } catch { toast.error("Não foi possível ler esta imagem."); }
  };

  const save = () => { if (preview) upload.mutate({ dataUrl: preview }); };
  const busy = upload.isPending || remove.isPending;

  if (loading) return <div className="min-h-screen bg-[#f5f2ee] text-[#171717]"><AppHeader /><div className="grid min-h-[60vh] place-items-center font-mono-label text-xs uppercase tracking-[.15em] text-black/50">Carregando perfil…</div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-[#f5f2ee] text-[#171717]"><AppHeader /><main className="mx-auto max-w-[700px] px-5 py-20 text-center md:px-10"><UserRound className="mx-auto text-[#e878aa]" size={42} /><h1 className="mt-5 text-4xl font-extrabold tracking-[-.06em]">Entre para abrir seu perfil.</h1><p className="mt-4 text-sm leading-7 text-black/60">Use a conta existente do Ritmo Pro Woman para salvar sua foto e acessá-la em qualquer dispositivo.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full bg-[#171717] text-[#fffdf9]">Entrar na conta</Button></main></div>;

  return <div className="min-h-screen bg-[#f5f2ee] text-[#171717]">
    <AppHeader />
    <main className="mx-auto max-w-[1100px] px-5 py-10 md:px-10 md:py-16">
      <div className="mb-8"><span className="font-mono-label text-[10px] uppercase tracking-[.2em] text-[#e878aa]">/ conta e identidade</span><h1 className="mt-3 text-4xl font-extrabold tracking-[-.06em] md:text-6xl">Seu perfil.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-black/60">Personalize sua conta e escolha a imagem que aparece no menu do Ritmo Pro Woman.</p></div>
      <section className="grid gap-6 rounded-3xl bg-[#171717] p-6 text-[#fffdf9] shadow-[8px_8px_0_#f5a7c7] md:grid-cols-[.8fr_1.2fr] md:p-10">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center"><Avatar className="h-40 w-40 border-4 border-[#f5a7c7] shadow-[0_0_0_10px_rgba(245,167,199,.12)]"><AvatarImage src={preview ?? photoQuery.data?.url ?? undefined} alt={`Foto de perfil de ${displayName}`} /><AvatarFallback className="bg-[#f5a7c7] text-4xl font-extrabold text-[#171717]">{initials || <UserRound size={44} />}</AvatarFallback></Avatar><h2 className="mt-6 text-2xl font-extrabold">{displayName}</h2><p className="mt-2 text-xs text-white/50">{photoQuery.data || preview ? "Sua foto aparece no cabeçalho e no menu." : "Avatar padrão · adicione uma foto quando quiser."}</p></div>
        <div className="flex flex-col justify-center"><span className="font-mono-label text-[10px] uppercase tracking-[.18em] text-[#f5a7c7]">foto de perfil</span><h2 className="mt-3 text-2xl font-extrabold">{photoQuery.data || preview ? "Alterar sua foto" : "Adicionar foto"}</h2><p className="mt-3 max-w-lg text-sm leading-7 text-white/60">Escolha uma imagem da galeria ou abra a câmera quando o seu dispositivo disponibilizar essa opção. Você vê a prévia antes de salvar e pode remover ou trocar depois.</p>
          <div className="mt-6 flex flex-wrap gap-3"><input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => chooseFile(event.target.files?.[0])} /><input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={event => chooseFile(event.target.files?.[0])} /><Button type="button" onClick={() => galleryRef.current?.click()} variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"><ImagePlus size={16} /> Galeria</Button><Button type="button" onClick={() => cameraRef.current?.click()} variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"><Camera size={16} /> Tirar foto</Button></div>
          {preview && <div className="mt-6 rounded-2xl border border-[#f5a7c7]/40 bg-[#f5a7c7]/10 p-4"><p className="text-xs font-bold text-[#f5a7c7]">Pré-visualização pronta</p><p className="mt-1 text-xs text-white/60">Clique em salvar para vincular esta foto permanentemente à sua conta.</p><Button type="button" onClick={save} disabled={busy} className="mt-4 rounded-full bg-[#f5a7c7] text-[#171717] hover:bg-[#f7b6d1]">{upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Salvar foto</Button></div>}
          {(photoQuery.data || preview) && <Button type="button" onClick={() => { if (preview) setPreview(null); else remove.mutate(); }} disabled={busy} variant="ghost" className="mt-5 w-fit gap-2 px-0 text-white/55 hover:bg-transparent hover:text-[#f5a7c7]">{remove.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} {preview ? "Cancelar pré-visualização" : "Remover foto salva"}</Button>}
        </div>
      </section>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#72c7a0]/30 bg-[#72c7a0]/10 p-5 text-sm leading-6 text-black/65"><UserRound size={18} className="mt-1 shrink-0 text-[#4a9a76]" /><p><strong className="text-[#171717]">Privacidade da conta.</strong> A foto é guardada no armazenamento privado do projeto e vinculada apenas ao seu utilizador autenticado.</p></div>
    </main>
  </div>;
}
