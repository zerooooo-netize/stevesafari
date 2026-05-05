import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
 children: ReactNode;
}
interface State {
 hasError: boolean;
 error: Error | null;
}

class ErrorBoundary extends Component<Props, State>{
 state: State = { hasError: false, error: null };

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, info: ErrorInfo) {
 console.error("App crash:", error, info);
 }

 render() {
 if (this.state.hasError) {
 return (
<div className="min-h-screen flex items-center justify-center p-4 bg-background">
<div className="max-w-md text-center">
<AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
<h1 className="font-heading text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
<p className="text-sm text-muted-foreground mb-6">
 We hit an unexpected error. Please refresh - your data is safe.
</p>
<Button onClick={() =>window.location.reload()}>Reload page</Button>
</div>
</div>
 );
 }
 return this.props.children;
 }
}

export default ErrorBoundary;
