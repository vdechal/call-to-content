import { useState, useCallback } from "react";
import { Upload, FileAudio, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRecordings } from "@/hooks/useRecordings";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const traceId = crypto.randomUUID().slice(0, 8);

  const { upload, isUploading } = useRecordings();

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/mp4",
      "audio/webm",
      "audio/ogg",
    ];

    if (!allowedTypes.includes(file.type)) {
      console.log("❌🎧 [UPLOAD_ZONE] Invalid file type", {
        traceId,
        name: file.name,
        type: file.type,
      });
      return "Invalid file type. Please upload an MP3, WAV, M4A, WebM, or OGG file.";
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log("❌📦 [UPLOAD_ZONE] File too large", {
        traceId,
        name: file.name,
        size: file.size,
        max: MAX_FILE_SIZE,
      });
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }

    console.log("✅📁 [UPLOAD_ZONE] File validated", {
      traceId,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log("🧲 [UPLOAD_ZONE] Drag over", { traceId });
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log("🫥 [UPLOAD_ZONE] Drag leave", { traceId });
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log("📥 [UPLOAD_ZONE] Drop", { traceId });
    setIsDragging(false);
    setValidationError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log("📄 [UPLOAD_ZONE] Dropped file", {
        traceId,
        name: file.name,
        type: file.type,
        size: file.size,
      });
      const error = validateFile(file);
      if (error) {
        console.log("❌ [UPLOAD_ZONE] Validation error", { traceId, error });
        setValidationError(error);
        return;
      }
      console.log("✅ [UPLOAD_ZONE] File selected from drop", { traceId });
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValidationError(null);
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log("🖱️📄 [UPLOAD_ZONE] File selected", {
          traceId,
          name: file.name,
          type: file.type,
          size: file.size,
        });
        const error = validateFile(file);
        if (error) {
          console.log("❌ [UPLOAD_ZONE] Validation error", { traceId, error });
          setValidationError(error);
          return;
        }
        console.log("✅ [UPLOAD_ZONE] File set", { traceId });
        setSelectedFile(file);
      }
    },
    []
  );

  const removeFile = useCallback(() => {
    console.log("🧹 [UPLOAD_ZONE] Remove file", {
      traceId,
      hadFile: !!selectedFile,
      name: selectedFile?.name,
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setValidationError(null);
  }, [selectedFile, traceId]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      console.log("🚀 [UPLOAD_ZONE] Start processing", {
        traceId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      });
      setUploadProgress(0);
      await upload({
        file: selectedFile,
        onProgress: (progress) => {
          // Keep this log lightweight; progress can be very chatty.
          if (progress === 5 || progress === 15 || progress === 85 || progress === 100) {
            console.log("📈 [UPLOAD_ZONE] Progress", { traceId, progress });
          }
          setUploadProgress(progress);
        },
      });

      console.log("🎉 [UPLOAD_ZONE] Upload finished (transcription trigger requested)", {
        traceId,
      });
      // Reset after successful upload
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.log("💥 [UPLOAD_ZONE] Upload failed (mutation handles toast)", {
        traceId,
        error,
      });
      // Error is handled by the mutation
      setUploadProgress(0);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-accent bg-accent/5 scale-[1.02]"
          : "border-border bg-card hover:border-accent/50 hover:bg-card/80",
        selectedFile && !isUploading && "border-success bg-success/5",
        isUploading && "border-accent bg-accent/5",
        validationError && "border-destructive bg-destructive/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isUploading && !selectedFile && (
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
      )}

      <div className="p-10 text-center">
        {validationError ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-destructive">
                Invalid file
              </h3>
              <p className="text-muted-foreground mb-4">{validationError}</p>
              <Button variant="outline" onClick={() => setValidationError(null)}>
                Try again
              </Button>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <div className="w-full max-w-xs">
              <h3 className="text-xl font-bold mb-2">Uploading...</h3>
              <Progress value={uploadProgress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 15 && "Creating record..."}
                {uploadProgress >= 15 && uploadProgress < 80 && "Uploading file..."}
                {uploadProgress >= 80 && uploadProgress < 100 && "Finalizing..."}
                {uploadProgress === 100 && "Complete!"}
              </p>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center">
              <FileAudio className="w-7 h-7 text-success" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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
              <Upload
                className={cn(
                  "w-8 h-8 transition-colors duration-200",
                  isDragging ? "text-accent" : "text-muted-foreground"
                )}
              />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isDragging ? "Drop your call here" : "Upload your call recording"}
            </h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop an audio file, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP3, WAV, M4A, OGG, WebM • Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>

      {selectedFile && !isUploading && !validationError && (
        <div className="px-10 pb-6">
          <Button
            variant="accent"
            className="w-full"
            size="lg"
            onClick={handleUpload}
          >
            Start Processing
          </Button>
        </div>
      )}
    </div>
  );
}
