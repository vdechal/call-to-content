import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Mic, FileText, Sparkles } from "lucide-react";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-muted-foreground mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              AI-powered content from your calls
            </span>
          </div>

          {/* Main headline */}
          <h1 className="animate-fade-up-delay-1 mb-6">
            Turn calls into{" "}
            <span className="gradient-text">LinkedIn posts.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            You talk. We turn it into traction. Upload your client calls and get 
            LinkedIn posts that build authority—without the writing block.
          </p>

          {/* CTA */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard" className="group">
                Upload your first call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          {/* Visual flow indicator */}
          <div className="mt-20 animate-fade-up-delay-3">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <FlowStep icon={<Mic className="w-6 h-6" />} label="Record" />
              <FlowArrow />
              <FlowStep icon={<WaveformIcon />} label="Analyze" />
              <FlowArrow />
              <FlowStep icon={<FileText className="w-6 h-6" />} label="Publish" />
            </div>
          </div>
        </div>
      </div>
    </section>;
}
function FlowStep({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border/50 shadow-md flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>;
}
function FlowArrow() {
  return <div className="hidden sm:flex items-center">
      <div className="w-12 h-0.5 bg-border" />
      <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-border" />
    </div>;
}
function WaveformIcon() {
  return <div className="flex items-end gap-0.5 h-6">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="waveform-bar w-1 bg-accent rounded-full" style={{
      height: "40%"
    }} />)}
    </div>;
}