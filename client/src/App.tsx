
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AnalysisPage from "@/pages/Analysis";
import ProfilePage from "@/pages/Profile";
import NotificationsPage from "@/pages/Notifications";
import Home from "@/pages/Home";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function RootRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation("/treino"), [setLocation]);
  return null;
}

function Router() {
  return <Switch>
    <Route path="/" component={RootRedirect} />
    <Route path="/perfil" component={ProfilePage} />
    <Route path="/treino" component={Home} />
    <Route path="/analise" component={AnalysisPage} />
    <Route path="/notificacoes" component={NotificationsPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

