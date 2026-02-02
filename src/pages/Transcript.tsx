import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { TranscriptViewer } from "@/components/transcript/TranscriptViewer";
import { useRecording } from "@/hooks/useRecording";
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  Loader2,
  FileText,
  ArrowRight
} from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Transcript() {
  const { id } = useParams<{ id: string }>();
  const { recording, insights, isLoading, error } = useRecording(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container px-6">
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container px-6">
            <div className="text-center py-24">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-bold mb-2">Recording not found</h2>
              <p className="text-muted-foreground mb-6">
                {error?.message || "The recording you're looking for doesn't exist."}
              </p>
              <Button asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">
                  {recording.filename}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatDuration(recording.duration_seconds)}
                  </span>
                  {insights.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {insights.length} insights
                    </span>
                  )}
                </div>
              </div>

              {recording.status === "ready" && (
                <Button variant="accent" asChild>
                  <Link to={`/editor/${recording.id}`}>
                    View Posts
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Transcript Viewer */}
          <div className="card-elevated">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold">Full Transcript</h3>
              <p className="text-sm text-muted-foreground">
                Speaker-labeled conversation with highlighted insights
              </p>
            </div>
            
            <TranscriptViewer
              recording={recording}
              insights={insights}
              onInsightClick={(insight) => {
                console.log("Insight clicked:", insight.type, insight.text);
              }}
            />
          </div>

          {/* Insights summary */}
          {insights.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold mb-4">Extracted Insights</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["quote", "pain_point", "solution", "proof"].map((type) => {
                  const count = insights.filter((i) => i.type === type).length;
                  return (
                    <InsightSummaryCard
                      key={type}
                      type={type as "quote" | "pain_point" | "solution" | "proof"}
                      count={count}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface InsightSummaryCardProps {
  type: "quote" | "pain_point" | "solution" | "proof";
  count: number;
}

function InsightSummaryCard({ type, count }: InsightSummaryCardProps) {
  const config = {
    quote: { label: "Quotes", className: "insight-quoteable" },
    pain_point: { label: "Pain Points", className: "insight-tension" },
    solution: { label: "Solutions", className: "insight-solution" },
    proof: { label: "Proof Points", className: "insight-proof" },
  };

  const { label, className } = config[type];

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between">
        <span className={`insight-tag ${className}`}>{label}</span>
        <span className="text-2xl font-black">{count}</span>
      </div>
    </div>
  );
}
