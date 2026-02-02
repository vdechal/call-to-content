# Debugging Guide for Catchy

*Reference this document before attempting to fix any bug.*

---

## Quick Debugging Checklist

Before diving into fixes, run through this checklist:

```
1. ✅ Read console logs (frontend + backend)
2. ✅ Check network requests for failed calls
3. ✅ Verify secrets/env vars exist
4. ✅ Log external API response status + body
5. ✅ Test edge functions directly via curl tool
6. ✅ Check function logs in Cloud view
```

---

## Step-by-Step Debugging Process

### Step 1: Gather Information First

**DO NOT** start fixing until you understand the problem:

- Read browser console logs (`lov-read-console-logs`)
- Read network requests (`lov-read-network-requests`)
- Check edge function logs (`supabase--edge-function-logs`)
- Review session replay if available (`lov-read-session-replay`)

### Step 2: Add Structured Logging

When adding debug logs, follow this format:

```typescript
// Frontend - Use step numbers and emojis
console.log("🚀 [STEP 1] Starting upload process...");
console.log("✅ [STEP 1] Upload complete:", { fileId, size });
console.log("❌ [STEP 1] Upload failed:", error.message);

// Backend - Include traceId for correlation
const traceId = crypto.randomUUID().slice(0, 8);
console.log("📥 [EDGE STEP 2] Downloading file...", { traceId });
console.log("✅ [EDGE STEP 2] File downloaded, size:", fileData.size, { traceId });
```

### Step 3: Test Edge Functions in Isolation

Use the curl tool to test edge functions directly:

```typescript
// Test edge function without going through the UI
supabase--curl_edge_functions({
  path: "/transcribe",
  method: "POST",
  body: JSON.stringify({ recording_id: "test-uuid" })
})
```

### Step 4: Log External API Responses Fully

**CRITICAL**: Always log the full response from external APIs:

```typescript
const response = await fetch(externalApiUrl, options);

// ALWAYS log status AND body before throwing
if (!response.ok) {
  const errorText = await response.text();
  console.error("❌ API error:", response.status, "Body:", errorText);
  throw new Error(`API error: ${response.status} - ${errorText}`);
}
```

### Step 5: Verify the API Endpoint

Before using any external API:

1. Confirm the endpoint URL is correct
2. Verify the endpoint supports your use case (e.g., Whisper vs Chat)
3. Check required headers and authentication
4. Validate request body format (JSON vs FormData)

---

## Common Issues & Solutions

### Edge Function Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 500 error, no details | Missing error logging | Add `await response.text()` before throwing |
| CORS errors | Missing CORS headers | Add `corsHeaders` to all responses including errors |
| 400 "Missing prompt/messages" | Wrong API endpoint | Verify using correct endpoint for the task |
| File upload fails | Wrong FormData format | Use `File` object with explicit filename |

### Frontend Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Transcribing..." stuck | Edge function failed silently | Check function logs for errors |
| No error shown | Missing error handling | Add `.catch()` and toast notifications |
| Stale data | Query not invalidating | Call `queryClient.invalidateQueries()` |

### Database Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Insert fails | RLS policy blocking | Check policies allow the operation |
| Missing data | Query limit (default 1000) | Add explicit `.limit()` if needed |
| Status not updating | Wrong ID or missing auth | Log the ID being updated |

---

## Logging Standards

### Emoji Legend

| Emoji | Meaning |
|-------|---------|
| 🚀 | Starting a process |
| ✅ | Success |
| ❌ | Error/Failure |
| 📥 | Downloading/Receiving |
| 📤 | Uploading/Sending |
| 📝 | Database operation |
| 🔧 | Configuration/Setup |
| 🎯 | Triggering action |
| 💾 | Saving data |
| 🎉 | Process complete |
| 💥 | Unexpected error |

### TraceId Pattern

For cross-stack debugging, use a shared traceId:

```typescript
// Generate once at the start
const traceId = crypto.randomUUID().slice(0, 8);

// Include in all logs
console.log("Processing request", { traceId, step: 1 });

// Mask sensitive IDs in logs
const maskId = (id: string) => id ? `${id.slice(0, 8)}…` : null;
console.log("Recording:", maskId(recordingId));
```

---

## Pre-Fix Verification

Before making any code changes to fix a bug:

1. **Reproduce the issue** — Can you trigger it consistently?
2. **Identify the failing step** — Which numbered step fails in the logs?
3. **Read the actual error** — What does the error message say?
4. **Verify assumptions** — Is the API/endpoint doing what you think?
5. **Test in isolation** — Can you call the function directly?

---

## Post-Fix Verification

After making changes:

1. **Deploy edge functions** — Use `supabase--deploy_edge_functions`
2. **Test the full flow** — Don't just test the fixed step
3. **Check logs** — Verify all steps complete successfully
4. **Update tasks.md** — Mark the fix as complete

---

## Tools Reference

| Tool | When to Use |
|------|-------------|
| `lov-read-console-logs` | Check frontend errors |
| `lov-read-network-requests` | See failed API calls |
| `supabase--edge-function-logs` | Debug backend functions |
| `supabase--curl_edge_functions` | Test functions directly |
| `supabase--analytics-query` | Check DB/auth logs |
| `lov-read-session-replay` | See user's exact actions |

---

## Remember

> **The root cause is often simpler than expected.**
> 
> In the transcription bug, the issue was using the wrong API endpoint — not a complex code problem. Always verify your assumptions about what external services do before debugging your code.
