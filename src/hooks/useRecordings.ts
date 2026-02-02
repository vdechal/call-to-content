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
      console.log("🚀 [UPLOAD] Starting upload process...");
      console.log("📁 [UPLOAD] File details:", { name: file.name, type: file.type, size: file.size });
      
      if (!user) {
        console.error("❌ [UPLOAD] User not authenticated");
        throw new Error("Not authenticated");
      }
      console.log("✅ [UPLOAD] User authenticated:", user.id);

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.error("❌ [UPLOAD] Invalid file type:", file.type);
        throw new Error(
          "Invalid file type. Please upload an MP3, WAV, M4A, WebM, or OGG file."
        );
      }
      console.log("✅ [UPLOAD] File type valid:", file.type);

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.error("❌ [UPLOAD] File too large:", file.size);
        throw new Error(
          `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
        );
      }
      console.log("✅ [UPLOAD] File size valid:", file.size);

      // Generate unique recording ID
      const recordingId = crypto.randomUUID();
      const filePath = `${user.id}/${recordingId}/${file.name}`;
      console.log("🆔 [UPLOAD] Generated recording ID:", recordingId);
      console.log("📂 [UPLOAD] File path:", filePath);

      // Step 1: Create recording record with 'uploading' status
      console.log("📝 [STEP 1] Creating recording record in database...");
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

      if (insertError) {
        console.error("❌ [STEP 1] Failed to create recording record:", insertError);
        throw insertError;
      }
      console.log("✅ [STEP 1] Recording record created:", recording.id);

      // Step 2: Upload file to storage
      console.log("📤 [STEP 2] Uploading file to storage...");
      onProgress?.(15);
      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ [STEP 2] Storage upload failed:", uploadError);
        // Clean up the recording record if upload fails
        await supabase.from("recordings").delete().eq("id", recordingId);
        throw uploadError;
      }
      console.log("✅ [STEP 2] File uploaded to storage successfully");

      onProgress?.(85);

      // Step 3: Update recording status to 'transcribing'
      console.log("🔄 [STEP 3] Updating recording status to 'transcribing'...");
      const { error: updateError } = await supabase
        .from("recordings")
        .update({ status: "transcribing" })
        .eq("id", recordingId);

      if (updateError) {
        console.error("❌ [STEP 3] Failed to update status:", updateError);
        throw updateError;
      }
      console.log("✅ [STEP 3] Status updated to 'transcribing'");

      // Step 4: Trigger transcription edge function (fire and forget)
      console.log("🎯 [STEP 4] Triggering transcription edge function...");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const session = await supabase.auth.getSession();
      console.log("🔑 [STEP 4] Got session token:", !!session.data.session?.access_token);
      
      const transcribeUrl = `${supabaseUrl}/functions/v1/transcribe`;
      console.log("🌐 [STEP 4] Calling URL:", transcribeUrl);
      
      fetch(transcribeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ recording_id: recordingId }),
      })
        .then(async (response) => {
          const responseText = await response.text();
          if (response.ok) {
            console.log("✅ [STEP 4] Transcription function triggered successfully:", responseText);
          } else {
            console.error("❌ [STEP 4] Transcription function returned error:", response.status, responseText);
          }
        })
        .catch((err) => {
          console.error("❌ [STEP 4] Failed to trigger transcription:", err);
        });

      onProgress?.(100);
      console.log("🎉 [UPLOAD] Upload process complete!");

      // Fetch the updated recording to return
      console.log("📥 [UPLOAD] Fetching updated recording...");
      const { data: updatedRecording, error: fetchError } = await supabase
        .from("recordings")
        .select("*")
        .eq("id", recordingId)
        .single();

      if (fetchError) {
        console.error("❌ [UPLOAD] Failed to fetch updated recording:", fetchError);
        throw fetchError;
      }
      console.log("✅ [UPLOAD] Got updated recording:", updatedRecording.id);

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
