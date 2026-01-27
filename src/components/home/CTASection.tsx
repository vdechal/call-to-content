import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-primary" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-8">
            <Zap className="w-8 h-8 text-accent" />
          </div>
          
          <h2 className="text-primary-foreground mb-6">
            Ready to turn your calls into clients?
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
            Join agency owners who've stopped struggling with content and started 
            building authority—one conversation at a time.
          </p>

          <Button 
            variant="hero" 
            size="xl" 
            className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
            asChild
          >
            <Link to="/dashboard" className="group">
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-primary-foreground/60">
            No credit card required • Upload your first call in 60 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
