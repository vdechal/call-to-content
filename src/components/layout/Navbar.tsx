import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:bg-accent transition-colors duration-200">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tight">Catchy</span>
        </Link>

        <div className="flex items-center gap-6">
          {!isHome && (
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
          
          {isHome ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
