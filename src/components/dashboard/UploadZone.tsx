import { useState, useCallback } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
      setUploadedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-accent bg-accent/5 scale-[1.02]"
          : "border-border bg-card hover:border-accent/50 hover:bg-card/80",
        uploadedFile && "border-success bg-success/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="file-upload"
      />

      <div className="p-10 text-center">
        {uploadedFile ? (
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
              Supports MP3, WAV, M4A, OGG, WebM • Max 500MB
            </p>
          </>
        )}
      </div>

      {uploadedFile && (
        <div className="px-10 pb-6">
          <Button variant="accent" className="w-full" size="lg">
            Start Processing
          </Button>
        </div>
      )}
    </div>
  );
}
