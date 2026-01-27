import { Upload, Brain, Edit3, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your call",
    description:
      "Drag and drop any audio file. We support all major formats from Zoom, Meet, or phone recordings.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI extracts insights",
    description:
      "Our smart system identifies quotable moments, pain points, breakthroughs, and proof points.",
  },
  {
    number: "03",
    icon: Edit3,
    title: "Polish your posts",
    description:
      "Review multiple draft options. Tweak the tone, make it punchier, or regenerate with one click.",
  },
  {
    number: "04",
    icon: Send,
    title: "Publish & grow",
    description:
      "Copy to LinkedIn, schedule for later, or export to your favorite tools. Your authority awaits.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="container px-6">
        <div className="text-center mb-16">
          <h2 className="mb-4">From call to content in minutes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple workflow that fits into your existing routine
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex items-start gap-6 group"
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl group-hover:bg-accent transition-colors duration-300">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute left-1/2 top-full w-0.5 h-8 bg-border -translate-x-1/2" />
                    )}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-accent" />
                    <h3>{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
