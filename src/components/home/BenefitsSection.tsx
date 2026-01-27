import { Eye, Clock, Heart } from "lucide-react";

const benefits = [
  {
    icon: Eye,
    title: "Visibility",
    description:
      "Transform every client conversation into content that positions you as a thought leader. Your insights deserve an audience.",
  },
  {
    icon: Clock,
    title: "Time-saving",
    description:
      "One call. Five posts. Zero writing blocks. Stop staring at blank pages—your best content is already in your head.",
  },
  {
    icon: Heart,
    title: "Authenticity",
    description:
      "Built from your words—no fluff, no filler. Every post sounds like you because it literally is you.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 bg-card border-y border-border/50">
      <div className="container px-6">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            Why agencies choose <span className="gradient-text">Catchy</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop trading hours for content. Start turning conversations into conversions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="card-elevated p-8 text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                <benefit.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
