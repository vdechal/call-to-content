import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Recording = Tables<"recordings">;
export type RecordingInsert = TablesInsert<"recordings">;

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
];

export function useRecordings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recordingsQuery = useQuery({
    queryKey: ["recordings", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Recording[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(
          "Invalid file type. Please upload an MP3, WAV, M4A, WebM, or OGG file."
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
        );
      }

      // Generate unique recording ID
      const recordingId = crypto.randomUUID();
      const filePath = `${user.id}/${recordingId}/${file.name}`;

      // Step 1: Create recording record with 'uploading' status
      onProgress?.(5);
      const { data: recording, error: insertError } = await supabase
        .from("recordings")
        .insert({
          id: recordingId,
          user_id: user.id,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "uploading",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Step 2: Upload file to storage
      onProgress?.(15);
      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // Clean up the recording record if upload fails
        await supabase.from("recordings").delete().eq("id", recordingId);
        throw uploadError;
      }

      onProgress?.(80);

      // Step 3: Update recording status to 'uploaded' (ready for transcription)
      const { data: updatedRecording, error: updateError } = await supabase
        .from("recordings")
        .update({ status: "transcribing" })
        .eq("id", recordingId)
        .select()
        .single();

      if (updateError) throw updateError;

      onProgress?.(100);

      return updatedRecording as Recording;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings", user?.id] });
      toast({
        title: "Upload complete",
        description: "Your recording is now being transcribed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRecording = useMutation({
    mutationFn: async (recordingId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get the recording to find the file path
      const { data: recording, error: fetchError } = await supabase
        .from("recordings")
        .select("file_path")
        .eq("id", recordingId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (recording?.file_path) {
        await supabase.storage.from("recordings").remove([recording.file_path]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", recordingId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings", user?.id] });
      toast({
        title: "Recording deleted",
        description: "The recording has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    recordings: recordingsQuery.data ?? [],
    isLoading: recordingsQuery.isLoading,
    error: recordingsQuery.error,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteRecording: deleteRecording.mutateAsync,
    isDeleting: deleteRecording.isPending,
  };
}
