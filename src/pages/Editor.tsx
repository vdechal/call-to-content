import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Quote,
  Lightbulb,
  Target,
  Trophy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockInsights = [
  {
    id: "1",
    type: "quote" as const,
    label: "Quoteable",
    content: `"The biggest mistake agencies make is trying to be everything to everyone. Pick your lane and own it completely."`,
    speaker: "Client",
    timestamp: "12:34",
  },
  {
    id: "2",
    type: "tension" as const,
    label: "Pain Point",
    content: "They were spending 15 hours a week on proposals that never converted. Classic case of proposal fatigue without qualification.",
    speaker: "You",
    timestamp: "18:45",
  },
  {
    id: "3",
    type: "solution" as const,
    label: "Solution",
    content: "We implemented a 3-step qualification process that cut their proposal time by 70% while increasing close rates.",
    speaker: "You",
    timestamp: "24:12",
  },
  {
    id: "4",
    type: "proof" as const,
    label: "Proof Point",
    content: "Within 90 days, they went from struggling to hit $20k months to consistently closing $50k+ in new business.",
    speaker: "Client",
    timestamp: "32:08",
  },
];

const mockPosts = [
  {
    id: "1",
    insightId: "1",
    content: `"The biggest mistake agencies make is trying to be everything to everyone."

I heard this from a client last week, and it hit different.

Here's the thing:
When you try to serve everyone, you end up serving no one well.

The agencies crushing it right now?
They've picked ONE thing and become undeniably great at it.

Not two things. Not "we're full-service."
ONE thing.

What's your one thing?

#AgencyLife #MarketingAgency #Positioning`,
    tone: "Punchy",
  },
  {
    id: "2",
    insightId: "2", 
    content: `15 hours a week on proposals.
Zero closes.

That was my client's reality before we worked together.

The problem wasn't their proposals.
It was who they were sending them to.

We built a 3-step qualification filter:
1. Budget confirmation upfront
2. Decision-maker on the call
3. Timeline within 30 days

Result?
→ 70% less time on proposals
→ 3x higher close rate

Stop polishing proposals for tire-kickers.

Start qualifying harder.

#Sales #AgencyGrowth #BusinessDevelopment`,
    tone: "Story-driven",
  },
];

export default function Editor() {
  const { id } = useParams();
  const [selectedInsight, setSelectedInsight] = useState(mockInsights[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, postId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedPosts = mockPosts.filter((p) => p.insightId === selectedInsight);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container px-6">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4 -ml-2">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              Client Discovery Call - Acme Corp
            </h1>
            <p className="text-muted-foreground">
              4 insights extracted • 45:23 duration
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Insights Panel */}
            <div className="lg:col-span-4">
              <div className="card-elevated p-4 sticky top-24">
                <h3 className="font-bold mb-4 px-2">Extracted Insights</h3>
                <div className="space-y-2">
                  {mockInsights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      isSelected={selectedInsight === insight.id}
                      onClick={() => setSelectedInsight(insight.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Panel */}
            <div className="lg:col-span-8">
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold">Generated Posts</h3>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {selectedPosts.length > 0 ? (
                  <Tabs defaultValue={selectedPosts[0].id}>
                    <TabsList className="mb-6">
                      {selectedPosts.map((post, index) => (
                        <TabsTrigger key={post.id} value={post.id}>
                          Draft {index + 1} • {post.tone}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {selectedPosts.map((post) => (
                      <TabsContent key={post.id} value={post.id}>
                        <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                          <pre className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
                            {post.content}
                          </pre>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Button
                            variant="accent"
                            onClick={() => handleCopy(post.content, post.id)}
                            className="gap-2"
                          >
                            {copiedId === post.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy to Clipboard
                              </>
                            )}
                          </Button>
                          <Button variant="outline">
                            Edit Post
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an insight to view generated posts</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface InsightCardProps {
  insight: {
    id: string;
    type: "quote" | "tension" | "solution" | "proof";
    label: string;
    content: string;
    speaker: string;
    timestamp: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

function InsightCard({ insight, isSelected, onClick }: InsightCardProps) {
  const icons = {
    quote: Quote,
    tension: Lightbulb,
    solution: Target,
    proof: Trophy,
  };

  const Icon = icons[insight.type];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all duration-200",
        isSelected
          ? "bg-primary text-primary-foreground shadow-md"
          : "hover:bg-secondary"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            isSelected ? "bg-primary-foreground/20" : "bg-accent/10"
          )}
        >
          <Icon className={cn(
            "w-4 h-4",
            isSelected ? "text-primary-foreground" : "text-accent"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isSelected ? "text-primary-foreground/80" : `insight-${insight.type === "tension" ? "tension" : insight.type === "quote" ? "quoteable" : insight.type === "solution" ? "solution" : "proof"}`
            )}>
              {insight.label}
            </span>
            <span className={cn(
              "text-xs",
              isSelected ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {insight.timestamp}
            </span>
          </div>
          <p className={cn(
            "text-sm line-clamp-2",
            isSelected ? "text-primary-foreground/90" : "text-foreground"
          )}>
            {insight.content}
          </p>
        </div>
      </div>
    </button>
  );
}
