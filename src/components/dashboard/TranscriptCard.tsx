import { Link } from "react-router-dom";
import { Clock, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Transcript {
  id: string;
  title: string;
  duration: string;
  date: string;
  status: "processing" | "ready";
  insights: number;
}

interface TranscriptCardProps {
  transcript: Transcript;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  const isProcessing = transcript.status === "processing";

  return (
    <div className="card-elevated p-6 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold truncate">{transcript.title}</h3>
            <StatusBadge status={transcript.status} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {transcript.duration}
            </span>
            <span>{transcript.date}</span>
            {!isProcessing && transcript.insights > 0 && (
              <span className="flex items-center gap-1.5 text-accent font-medium">
                <Sparkles className="w-4 h-4" />
                {transcript.insights} insights
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          ) : (
            <Button variant="default" asChild className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Link to={`/editor/${transcript.id}`}>
                View Posts
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="mt-4">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Extracting insights from your conversation...
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "processing" | "ready" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        status === "processing" && "bg-warning/10 text-warning",
        status === "ready" && "bg-success/10 text-success"
      )}
    >
      {status === "processing" ? "Processing" : "Ready"}
    </span>
  );
}
