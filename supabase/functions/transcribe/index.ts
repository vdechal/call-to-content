import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recording_id } = await req.json();
    if (!recording_id) {
      return new Response(
        JSON.stringify({ error: "recording_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Fetch recording
    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recording_id)
      .eq("user_id", userId)
      .single();

    if (recordingError || !recording) {
      console.error("Recording fetch error:", recordingError);
      return new Response(JSON.stringify({ error: "Recording not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to transcribing
    await supabase
      .from("recordings")
      .update({ status: "transcribing" })
      .eq("id", recording_id);

    // Download audio file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("recordings")
      .download(recording.file_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      await supabase
        .from("recordings")
        .update({ status: "failed", error_message: "Failed to download audio file" })
        .eq("id", recording_id);
      return new Response(JSON.stringify({ error: "Failed to download audio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OpenAI Whisper API
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      await supabase
        .from("recordings")
        .update({ status: "failed", error_message: "OpenAI API key not configured" })
        .eq("id", recording_id);
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare form data for Whisper
    const formData = new FormData();
    formData.append("file", fileData, recording.filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");

    console.log("Calling Whisper API for recording:", recording_id);

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", whisperResponse.status, errorText);
      await supabase
        .from("recordings")
        .update({ 
          status: "failed", 
          error_message: `Transcription failed: ${whisperResponse.status}` 
        })
        .eq("id", recording_id);
      return new Response(JSON.stringify({ error: "Transcription failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whisperResult = await whisperResponse.json();
    console.log("Whisper result received, segments:", whisperResult.segments?.length);

    // Format speaker segments from Whisper response
    // Note: Whisper doesn't do diarization, so we'll mark as "Speaker 1" for now
    // and use Lovable AI to identify speakers in the next phase
    const speakerSegments = (whisperResult.segments || []).map((seg: any, idx: number) => ({
      speaker: "Speaker 1", // Will be enhanced with diarization later
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    // Calculate duration
    const durationSeconds = Math.round(whisperResult.duration || 0);

    // Update recording with transcript
    const { error: updateError } = await supabase
      .from("recordings")
      .update({
        transcript_text: whisperResult.text,
        speaker_segments: speakerSegments,
        duration_seconds: durationSeconds,
        status: "analyzing",
      })
      .eq("id", recording_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save transcript" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Transcription complete for recording:", recording_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recording_id,
        duration_seconds: durationSeconds,
        segment_count: speakerSegments.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Transcribe function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
