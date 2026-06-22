import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MuraTravel] Runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Une erreur s'est produite</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message ?? "Erreur inattendue"}
              </p>
            </div>
            <details className="text-left bg-muted rounded-md p-3">
              <summary className="text-xs text-muted-foreground cursor-pointer">Détails techniques</summary>
              <pre className="text-xs mt-2 overflow-auto text-destructive whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </details>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Recharger l'application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
