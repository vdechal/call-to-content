import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

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
          {user && (
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
          
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[150px] truncate">
                    {user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
