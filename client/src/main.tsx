
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
document.documentElement.lang = "pt-BR";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// PWA: capture the browser install prompt so the site can install as an app.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    (window as Window & { __ritmoInstallPrompt?: Event }).__ritmoInstallPrompt =
      event;
    window.dispatchEvent(new Event("ritmo-install-available"));
  });
  window.addEventListener("appinstalled", () => {
    delete (window as Window & { __ritmoInstallPrompt?: Event })
      .__ritmoInstallPrompt;
    window.dispatchEvent(new Event("ritmo-app-installed"));
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => undefined);
  }
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

