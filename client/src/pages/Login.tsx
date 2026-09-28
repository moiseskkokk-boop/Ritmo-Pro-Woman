import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.auth.login.useMutation({ onSuccess: () => setLocation("/") });
  const register = trpc.auth.register.useMutation({ onSuccess: () => setLocation("/") });
  const mutation = mode === "login" ? login : register;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name, email, password });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-5">
      <section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm">
        <div className="mb-7">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">RITMO PRO MAN</p>
          <h1 className="mt-2 text-3xl font-semibold">{mode === "login" ? "Entrar na sua conta" : "Criar sua conta"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesso independente, sem depender de serviços externos de autenticação.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block text-sm">Nome<input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3 outline-none" /></label>
          )}
          <label className="block text-sm">E-mail<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3 outline-none" /></label>
          <label className="block text-sm">Senha<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3 outline-none" /></label>
          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message.includes("EMAIL_ALREADY_EXISTS") ? "Este e-mail já está cadastrado." : mode === "login" ? "E-mail ou senha inválidos." : "Não foi possível criar a conta."}</p>}
          <button disabled={mutation.isPending} className="w-full rounded-xl bg-foreground px-4 py-3 font-medium text-background disabled:opacity-60">
            {mutation.isPending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-5 w-full text-sm underline">
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}
        </button>
      </section>
    </main>
  );
}
