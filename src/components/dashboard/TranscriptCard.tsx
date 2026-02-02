import { Link } from "react-router-dom";
import { Clock, Sparkles, Loader2, ArrowRight, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recording } from "@/hooks/useRecordings";
import { formatDistanceToNow } from "date-fns";

interface TranscriptCardProps {
  recording: Recording;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusInfo(status: string | null) {
  switch (status) {
    case "uploading":
      return { label: "Uploading", color: "bg-info/10 text-info", isProcessing: true };
    case "transcribing":
      return { label: "Transcribing", color: "bg-warning/10 text-warning", isProcessing: true };
    case "analyzing":
      return { label: "Analyzing", color: "bg-warning/10 text-warning", isProcessing: true };
    case "ready":
      return { label: "Ready", color: "bg-success/10 text-success", isProcessing: false };
    case "failed":
      return { label: "Failed", color: "bg-destructive/10 text-destructive", isProcessing: false };
    default:
      return { label: "Unknown", color: "bg-muted/10 text-muted-foreground", isProcessing: false };
  }
}

export function TranscriptCard({ recording, onDelete, isDeleting }: TranscriptCardProps) {
  const statusInfo = getStatusInfo(recording.status);
  const createdAt = recording.created_at 
    ? formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })
    : "Unknown";

  return (
    <div className="card-elevated p-6 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold truncate">{recording.filename}</h3>
            <StatusBadge status={statusInfo} />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(recording.duration_seconds)}
            </span>
            <span>{createdAt}</span>
            {recording.status === "failed" && recording.error_message && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="w-4 h-4" />
                {recording.error_message}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusInfo.isProcessing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{statusInfo.label}...</span>
            </div>
          ) : recording.status === "ready" ? (
            <Button
              variant="default"
              asChild
              className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
            >
              <Link to={`/editor/${recording.id}`}>
                View Posts
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          ) : null}

          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(recording.id)}
              disabled={isDeleting}
              className="text-muted-foreground hover:text-destructive"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {statusInfo.isProcessing && (
        <div className="mt-4">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {recording.status === "uploading" && "Uploading your recording..."}
            {recording.status === "transcribing" && "Converting speech to text..."}
            {recording.status === "analyzing" && "Extracting insights from your conversation..."}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof getStatusInfo> }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        status.color
      )}
    >
      {status.label}
    </span>
  );
}
