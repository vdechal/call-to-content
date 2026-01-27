import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { TranscriptCard } from "@/components/dashboard/TranscriptCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileAudio, Clock, CheckCircle2 } from "lucide-react";

// Mock data for demo
const mockTranscripts = [
  {
    id: "1",
    title: "Client Discovery Call - Acme Corp",
    duration: "45:23",
    date: "2 hours ago",
    status: "ready" as const,
    insights: 5,
  },
  {
    id: "2", 
    title: "Strategy Session - TechStart",
    duration: "32:15",
    date: "Yesterday",
    status: "processing" as const,
    insights: 0,
  },
  {
    id: "3",
    title: "Sales Call - Enterprise Lead",
    duration: "28:47",
    date: "3 days ago",
    status: "ready" as const,
    insights: 3,
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");

  const readyTranscripts = mockTranscripts.filter((t) => t.status === "ready");
  const processingTranscripts = mockTranscripts.filter((t) => t.status === "processing");

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

          {/* Transcripts Section */}
          <section className="mt-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Calls</h2>
                <TabsList className="bg-secondary">
                  <TabsTrigger value="all" className="gap-2">
                    <FileAudio className="w-4 h-4" />
                    All ({mockTranscripts.length})
                  </TabsTrigger>
                  <TabsTrigger value="processing" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Processing ({processingTranscripts.length})
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready ({readyTranscripts.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <div className="grid gap-4">
                  {mockTranscripts.map((transcript) => (
                    <TranscriptCard key={transcript.id} transcript={transcript} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="processing" className="mt-0">
                <div className="grid gap-4">
                  {processingTranscripts.length > 0 ? (
                    processingTranscripts.map((transcript) => (
                      <TranscriptCard key={transcript.id} transcript={transcript} />
                    ))
                  ) : (
                    <EmptyState message="No calls are being processed" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ready" className="mt-0">
                <div className="grid gap-4">
                  {readyTranscripts.length > 0 ? (
                    readyTranscripts.map((transcript) => (
                      <TranscriptCard key={transcript.id} transcript={transcript} />
                    ))
                  ) : (
                    <EmptyState message="No calls are ready yet" />
                  )}
                </div>
              </TabsContent>
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
