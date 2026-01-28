import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Recording = Tables<"recordings">;

interface RecordingWithInsights extends Recording {
  insightCount: number;
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<RecordingWithInsights[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchRecordings = useCallback(async () => {
    if (!user) {
      setRecordings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch recordings
      const { data: recordingsData, error: recordingsError } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (recordingsError) throw recordingsError;

      // Fetch insight counts for each recording
      const recordingIds = recordingsData?.map((r) => r.id) || [];
      
      let insightCounts: Record<string, number> = {};
      
      if (recordingIds.length > 0) {
        const { data: insightsData, error: insightsError } = await supabase
          .from("insights")
          .select("recording_id")
          .in("recording_id", recordingIds);

        if (!insightsError && insightsData) {
          insightCounts = insightsData.reduce((acc, insight) => {
            acc[insight.recording_id] = (acc[insight.recording_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const recordingsWithInsights: RecordingWithInsights[] = (recordingsData || []).map((r) => ({
        ...r,
        insightCount: insightCounts[r.id] || 0,
      }));

      setRecordings(recordingsWithInsights);
      setError(null);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch recordings"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("recordings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recordings",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch on any change
          fetchRecordings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRecordings]);

  return { recordings, loading, error, refetch: fetchRecordings };
}
