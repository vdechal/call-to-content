import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACTION_PROMPT = `You are an expert content strategist analyzing a client call transcript.
Identify and extract the following types of insights:

1. QUOTE - Memorable, quotable statements that show expertise or unique perspective
2. PAIN_POINT - Client frustrations, challenges, or problems mentioned
3. SOLUTION - Strategies, methods, or approaches discussed that solved problems
4. PROOF - Results, metrics, case studies, or social proof mentioned

For each insight, provide:
- type: quote | pain_point | solution | proof
- text: The exact or paraphrased content (1-3 sentences, compelling and self-contained)
- speaker: Which speaker said this (use "Speaker 1", "Speaker 2", etc. or infer from context)
- confidence: Your confidence this is a valuable insight (0.0-1.0)

Extract 5-15 high-quality insights that would make excellent LinkedIn content.
Focus on unique perspectives, concrete numbers, emotional moments, and actionable advice.`;

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

    // Fetch recording with transcript
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

    if (!recording.transcript_text) {
      return new Response(JSON.stringify({ error: "No transcript available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI to extract insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await supabase
        .from("recordings")
        .update({ status: "failed", error_message: "AI API key not configured" })
        .eq("id", recording_id);
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracting insights for recording:", recording_id);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: `Here is the transcript to analyze:\n\n${recording.transcript_text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_insights",
              description: "Extract valuable insights from the transcript",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string", 
                          enum: ["quote", "pain_point", "solution", "proof"] 
                        },
                        text: { type: "string" },
                        speaker: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["type", "text", "speaker", "confidence"],
                    },
                  },
                },
                required: ["insights"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      await supabase
        .from("recordings")
        .update({ status: "failed", error_message: "Insight extraction failed" })
        .eq("id", recording_id);
      return new Response(JSON.stringify({ error: "Insight extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    console.log("AI response received");

    // Parse tool call response
    let insights: any[] = [];
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }
    }

    console.log("Extracted insights:", insights.length);

    // Insert insights into database
    if (insights.length > 0) {
      const insightRecords = insights.map((insight: any) => ({
        recording_id,
        user_id: userId,
        type: insight.type,
        text: insight.text,
        speaker: insight.speaker,
        confidence: insight.confidence,
        is_starred: false,
      }));

      const { error: insertError } = await supabase
        .from("insights")
        .insert(insightRecords);

      if (insertError) {
        console.error("Insert insights error:", insertError);
      }
    }

    // Update recording status to ready
    await supabase
      .from("recordings")
      .update({ status: "ready" })
      .eq("id", recording_id);

    console.log("Insight extraction complete for recording:", recording_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recording_id,
        insight_count: insights.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extract insights function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
