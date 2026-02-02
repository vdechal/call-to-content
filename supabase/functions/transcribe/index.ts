import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperResponse {
  text: string;
  segments?: WhisperSegment[];
  duration?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
    console.error("Missing required environment variables");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let recordingId: string | null = null;

  try {
    // Parse request body
    const body = await req.json();
    recordingId = body.recording_id;

    if (!recordingId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing recording_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordingId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid recording_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing transcription request");

    // Fetch recording metadata
    const { data: recording, error: fetchError } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

    if (fetchError || !recording) {
      console.error("Recording not found");
      return new Response(
        JSON.stringify({ success: false, error: "Recording not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download audio file from storage
    console.log("Downloading audio file from storage");
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("recordings")
      .download(recording.file_path);

    if (downloadError || !fileData) {
      console.error("Failed to download audio file");
      await updateRecordingStatus(supabase, recordingId, "failed", "Failed to download audio file");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to download audio file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare FormData for Whisper API
    console.log("Sending audio to Whisper API");
    const formData = new FormData();
    formData.append("file", fileData, recording.filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    // Call Lovable AI Gateway for transcription
    const whisperResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", whisperResponse.status);
      await updateRecordingStatus(supabase, recordingId, "failed", "Transcription service error");
      return new Response(
        JSON.stringify({ success: false, error: "Transcription failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whisperData: WhisperResponse = await whisperResponse.json();
    console.log("Transcription complete, processing speaker diarization");

    // Get duration from Whisper response or calculate from segments
    let durationSeconds = whisperData.duration;
    if (!durationSeconds && whisperData.segments && whisperData.segments.length > 0) {
      durationSeconds = whisperData.segments[whisperData.segments.length - 1].end;
    }

    // Perform speaker diarization using AI chat
    const speakerSegments = await performSpeakerDiarization(
      lovableApiKey,
      whisperData.text,
      whisperData.segments || []
    );

    // Update recording with transcript and segments
    console.log("Updating recording with transcript");
    const { error: updateError } = await supabase
      .from("recordings")
      .update({
        transcript_text: whisperData.text,
        speaker_segments: speakerSegments,
        duration_seconds: Math.round(durationSeconds || 0),
        status: "analyzing",
        error_message: null,
      })
      .eq("id", recordingId);

    if (updateError) {
      console.error("Failed to update recording");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save transcript" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Transcription completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        recording_id: recordingId,
        duration_seconds: Math.round(durationSeconds || 0),
        segment_count: speakerSegments.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Transcription error occurred");
    
    // Update recording status to failed if we have a recording ID
    if (recordingId) {
      const supabaseForError = createClient(supabaseUrl!, supabaseServiceKey!);
      await updateRecordingStatus(supabaseForError, recordingId, "failed", "An unexpected error occurred");
    }

    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateRecordingStatus(
  supabase: any,
  recordingId: string,
  status: string,
  errorMessage?: string
) {
  try {
    await supabase
      .from("recordings")
      .update({
        status,
        error_message: errorMessage || null,
      })
      .eq("id", recordingId);
  } catch {
    console.error("Failed to update recording status");
  }
}

async function performSpeakerDiarization(
  apiKey: string,
  fullTranscript: string,
  segments: WhisperSegment[]
): Promise<SpeakerSegment[]> {
  // If no segments, return single speaker segment
  if (!segments || segments.length === 0) {
    return [
      {
        speaker: "Speaker 1",
        start: 0,
        end: 0,
        text: fullTranscript,
      },
    ];
  }

  try {
    // Prepare segments for analysis
    const segmentData = segments.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    const diarizationPrompt = `You are analyzing a conversation transcript to identify different speakers.

Here are the transcript segments with timestamps:
${JSON.stringify(segmentData, null, 2)}

Analyze the conversation and identify which segments belong to which speaker based on:
1. Turn-taking patterns (questions followed by answers)
2. Speaking style and vocabulary differences
3. Topic shifts and conversational flow
4. Interview/conversation dynamics (one person often asks more questions)

Return a JSON array where each item has:
- speaker: "Speaker 1", "Speaker 2", etc.
- start: start time in seconds
- end: end time in seconds  
- text: the transcript text

Combine consecutive segments from the same speaker into a single segment.
Return ONLY valid JSON, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: diarizationPrompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("Speaker diarization API error");
      // Fall back to alternating speakers
      return createFallbackSegments(segments);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in diarization response");
      return createFallbackSegments(segments);
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsedSegments = JSON.parse(jsonStr.trim());

    // Validate and normalize the response
    if (Array.isArray(parsedSegments) && parsedSegments.length > 0) {
      return parsedSegments.map((s: Record<string, unknown>) => ({
        speaker: String(s.speaker || "Speaker 1"),
        start: Number(s.start) || 0,
        end: Number(s.end) || 0,
        text: String(s.text || ""),
      }));
    }

    return createFallbackSegments(segments);
  } catch (error) {
    console.error("Speaker diarization failed, using fallback");
    return createFallbackSegments(segments);
  }
}

function createFallbackSegments(segments: WhisperSegment[]): SpeakerSegment[] {
  // Simple fallback: group consecutive segments and alternate speakers
  // This is a basic heuristic when AI diarization fails
  const result: SpeakerSegment[] = [];
  let currentSpeaker = 1;
  let currentSegment: SpeakerSegment | null = null;

  for (const segment of segments) {
    // Simple heuristic: new speaker after a pause > 2 seconds or question mark
    const isPause = currentSegment && (segment.start - currentSegment.end) > 2;
    const isQuestion = currentSegment?.text.trim().endsWith("?");

    if (isPause || isQuestion) {
      if (currentSegment) {
        result.push(currentSegment);
      }
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
      currentSegment = {
        speaker: `Speaker ${currentSpeaker}`,
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
      };
    } else if (currentSegment) {
      // Extend current segment
      currentSegment.end = segment.end;
      currentSegment.text += " " + segment.text.trim();
    } else {
      // First segment
      currentSegment = {
        speaker: `Speaker ${currentSpeaker}`,
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
      };
    }
  }

  if (currentSegment) {
    result.push(currentSegment);
  }

  return result.length > 0 ? result : [{
    speaker: "Speaker 1",
    start: 0,
    end: segments[segments.length - 1]?.end || 0,
    text: segments.map(s => s.text.trim()).join(" "),
  }];
}
