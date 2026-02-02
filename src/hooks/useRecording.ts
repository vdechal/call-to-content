import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Recording = Tables<"recordings">;
export type Insight = Tables<"insights">;

interface RecordingWithInsights {
  recording: Recording | null;
  insights: Insight[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch a single recording by ID with its associated insights
 */
export function useRecording(recordingId: string | undefined): RecordingWithInsights {
  const { user } = useAuth();

  const recordingQuery = useQuery({
    queryKey: ["recording", recordingId],
    queryFn: async () => {
      if (!recordingId || !user) return null;

      console.log("📥 [useRecording] Fetching recording:", recordingId);
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", recordingId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("❌ [useRecording] Failed to fetch recording:", error);
        throw error;
      }
      
      console.log("✅ [useRecording] Recording fetched:", data?.filename);
      return data as Recording;
    },
    enabled: !!recordingId && !!user,
  });

  const insightsQuery = useQuery({
    queryKey: ["insights", recordingId],
    queryFn: async () => {
      if (!recordingId || !user) return [];

      console.log("📥 [useRecording] Fetching insights for recording:", recordingId);
      const { data, error } = await supabase
        .from("insights")
        .select("*")
        .eq("recording_id", recordingId)
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("❌ [useRecording] Failed to fetch insights:", error);
        throw error;
      }

      console.log("✅ [useRecording] Fetched", data?.length, "insights");
      return data as Insight[];
    },
    enabled: !!recordingId && !!user,
  });

  return {
    recording: recordingQuery.data ?? null,
    insights: insightsQuery.data ?? [],
    isLoading: recordingQuery.isLoading || insightsQuery.isLoading,
    error: recordingQuery.error || insightsQuery.error,
  };
}
