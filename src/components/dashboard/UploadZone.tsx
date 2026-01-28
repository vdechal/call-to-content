import { useState, useCallback } from "react";
import { Upload, FileAudio, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
];

interface UploadZoneProps {
  onUploadComplete?: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload an audio file (MP3, WAV, M4A, OGG, or WebM)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 100MB";
    }
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const error = validateFile(files[0]);
      if (error) {
        toast({ title: "Invalid file", description: error, variant: "destructive" });
        return;
      }
      setUploadedFile(files[0]);
    }
  }, [validateFile, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const error = validateFile(files[0]);
      if (error) {
        toast({ title: "Invalid file", description: error, variant: "destructive" });
        return;
      }
      setUploadedFile(files[0]);
    }
  }, [validateFile, toast]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setUploadProgress(0);
    setProcessingStatus(null);
  }, []);

  const handleUpload = async () => {
    if (!uploadedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus("Creating record...");

    try {
      // 1. Create recording record with status='uploading'
      const { data: recording, error: insertError } = await supabase
        .from("recordings")
        .insert({
          user_id: user.id,
          filename: uploadedFile.name,
          file_path: "", // Will update after upload
          file_size: uploadedFile.size,
          status: "uploading",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create recording: ${insertError.message}`);
      }

      // 2. Upload file to storage: {user_id}/{recording_id}/{filename}
      setProcessingStatus("Uploading audio...");
      const filePath = `${user.id}/${recording.id}/${uploadedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, uploadedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // Clean up the recording record
        await supabase.from("recordings").delete().eq("id", recording.id);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(50);

      // 3. Update recording with file_path
      const { error: updateError } = await supabase
        .from("recordings")
        .update({ file_path: filePath })
        .eq("id", recording.id);

      if (updateError) {
        throw new Error(`Failed to update recording: ${updateError.message}`);
      }

      setUploadProgress(60);
      setProcessingStatus("Starting transcription...");

      // 4. Trigger transcription edge function
      const { data: session } = await supabase.auth.getSession();
      const transcribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ recording_id: recording.id }),
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      setUploadProgress(80);
      setProcessingStatus("Extracting insights...");

      // 5. Trigger insight extraction
      const extractResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ recording_id: recording.id }),
        }
      );

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        console.error("Insight extraction error:", errorData);
        // Don't throw - transcription succeeded, insights can be retried
      }

      setUploadProgress(100);
      setProcessingStatus("Complete!");

      toast({
        title: "Upload complete",
        description: "Your recording has been processed and insights extracted.",
      });

      // Reset state after a brief delay
      setTimeout(() => {
        setUploadedFile(null);
        setUploadProgress(0);
        setProcessingStatus(null);
        setIsUploading(false);
        onUploadComplete?.();
      }, 1500);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setIsUploading(false);
      setProcessingStatus(null);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-accent bg-accent/5 scale-[1.02]"
          : "border-border bg-card hover:border-accent/50 hover:bg-card/80",
        uploadedFile && !isUploading && "border-success bg-success/5",
        isUploading && "border-accent bg-accent/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isUploading && (
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
      )}

      <div className="p-10 text-center">
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{processingStatus}</h3>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center">
              <FileAudio className="w-7 h-7 text-success" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                removeFile();
              }}
              className="ml-auto"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Upload className={cn(
                "w-8 h-8 transition-colors duration-200",
                isDragging ? "text-accent" : "text-muted-foreground"
              )} />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isDragging ? "Drop your call here" : "Upload your call recording"}
            </h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop an audio file, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP3, WAV, M4A, OGG, WebM • Max 100MB
            </p>
          </>
        )}
      </div>

      {uploadedFile && !isUploading && (
        <div className="px-10 pb-6">
          <Button 
            variant="accent" 
            className="w-full" 
            size="lg"
            onClick={handleUpload}
            disabled={!user}
          >
            Start Processing
          </Button>
        </div>
      )}
    </div>
  );
}
