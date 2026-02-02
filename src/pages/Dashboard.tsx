import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { TranscriptCard } from "@/components/dashboard/TranscriptCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileAudio, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useRecordings } from "@/hooks/useRecordings";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { recordings, isLoading, deleteRecording } = useRecordings();

  const readyRecordings = recordings.filter((r) => r.status === "ready");
  const processingRecordings = recordings.filter((r) => 
    r.status === "uploading" || r.status === "transcribing" || r.status === "analyzing"
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRecording(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container px-6">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black mb-3">Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Upload calls, extract insights, create content.
            </p>
          </div>

          {/* Upload Section */}
          <UploadZone />

          {/* Recordings Section */}
          <section className="mt-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Calls</h2>
                <TabsList className="bg-secondary">
                  <TabsTrigger value="all" className="gap-2">
                    <FileAudio className="w-4 h-4" />
                    All ({recordings.length})
                  </TabsTrigger>
                  <TabsTrigger value="processing" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Processing ({processingRecordings.length})
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready ({readyRecordings.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="mt-0">
                    <div className="grid gap-4">
                      {recordings.length > 0 ? (
                        recordings.map((recording) => (
                          <TranscriptCard
                            key={recording.id}
                            recording={recording}
                            onDelete={handleDelete}
                            isDeleting={deletingId === recording.id}
                          />
                        ))
                      ) : (
                        <EmptyState message="No calls uploaded yet. Upload your first call above!" />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="processing" className="mt-0">
                    <div className="grid gap-4">
                      {processingRecordings.length > 0 ? (
                        processingRecordings.map((recording) => (
                          <TranscriptCard
                            key={recording.id}
                            recording={recording}
                            onDelete={handleDelete}
                            isDeleting={deletingId === recording.id}
                          />
                        ))
                      ) : (
                        <EmptyState message="No calls are being processed" />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="ready" className="mt-0">
                    <div className="grid gap-4">
                      {readyRecordings.length > 0 ? (
                        readyRecordings.map((recording) => (
                          <TranscriptCard
                            key={recording.id}
                            recording={recording}
                            onDelete={handleDelete}
                            isDeleting={deletingId === recording.id}
                          />
                        ))
                      ) : (
                        <EmptyState message="No calls are ready yet" />
                      )}
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card-elevated p-12 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
