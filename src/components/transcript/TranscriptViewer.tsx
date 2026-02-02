import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Recording } from "@/hooks/useRecordings";
import type { Tables } from "@/integrations/supabase/types";

type Insight = Tables<"insights">;

interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface TranscriptViewerProps {
  recording: Recording;
  insights?: Insight[];
  onInsightClick?: (insight: Insight) => void;
  className?: string;
}

// Speaker color palette using semantic design tokens
const SPEAKER_COLORS = [
  { bg: "bg-info/10", text: "text-info", border: "border-info/20" },
  { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
];

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSpeakerColor(speaker: string, speakerMap: Map<string, number>) {
  if (!speakerMap.has(speaker)) {
    speakerMap.set(speaker, speakerMap.size);
  }
  const index = speakerMap.get(speaker)! % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[index];
}

export function TranscriptViewer({
  recording,
  insights = [],
  onInsightClick,
  className,
}: TranscriptViewerProps) {
  // Parse speaker segments from recording
  const segments = useMemo((): SpeakerSegment[] => {
    if (!recording.speaker_segments) return [];
    
    try {
      const parsed = recording.speaker_segments as unknown as SpeakerSegment[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [recording.speaker_segments]);

  // Create a map for consistent speaker colors
  const speakerMap = useMemo(() => new Map<string, number>(), []);

  // Map insights by their approximate start time for highlighting
  const insightsByTime = useMemo(() => {
    const map = new Map<number, Insight>();
    insights.forEach((insight) => {
      if (insight.start_time != null) {
        // Round to nearest 5 seconds for matching
        const key = Math.floor(Number(insight.start_time) / 5) * 5;
        map.set(key, insight);
      }
    });
    return map;
  }, [insights]);

  // Check if a segment contains an insight
  const getSegmentInsight = (segment: SpeakerSegment): Insight | undefined => {
    const segmentKey = Math.floor(segment.start / 5) * 5;
    return insightsByTime.get(segmentKey);
  };

  if (!recording.transcript_text && segments.length === 0) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        <p>No transcript available yet.</p>
      </div>
    );
  }

  // Fallback to plain transcript if no speaker segments
  if (segments.length === 0 && recording.transcript_text) {
    return (
      <ScrollArea className={cn("h-[500px]", className)}>
        <div className="p-4">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {recording.transcript_text}
          </p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className={cn("h-[500px]", className)}>
      <div className="space-y-4 p-4">
        {segments.map((segment, index) => {
          const color = getSpeakerColor(segment.speaker, speakerMap);
          const insight = getSegmentInsight(segment);
          const hasInsight = !!insight;

          return (
            <div
              key={index}
              className={cn(
                "group relative rounded-lg p-4 transition-all duration-200",
                hasInsight
                  ? "bg-accent/5 border-l-4 border-accent cursor-pointer hover:bg-accent/10"
                  : "hover:bg-secondary/50"
              )}
              onClick={() => hasInsight && insight && onInsightClick?.(insight)}
            >
              {/* Speaker header */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold",
                    color.bg,
                    color.text
                  )}
                >
                  <User className="w-3 h-3" />
                  {segment.speaker}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(segment.start)}
                </span>
                {hasInsight && insight && (
                  <InsightBadge type={insight.type} />
                )}
              </div>

              {/* Segment text */}
              <p className="text-foreground leading-relaxed pl-1">
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface InsightBadgeProps {
  type: Insight["type"];
}

function InsightBadge({ type }: InsightBadgeProps) {
  const config = {
    quote: { label: "Quote", className: "insight-quoteable" },
    pain_point: { label: "Pain Point", className: "insight-tension" },
    solution: { label: "Solution", className: "insight-solution" },
    proof: { label: "Proof", className: "insight-proof" },
  };

  const { label, className } = config[type];

  return (
    <span className={cn("insight-tag", className)}>
      {label}
    </span>
  );
}
