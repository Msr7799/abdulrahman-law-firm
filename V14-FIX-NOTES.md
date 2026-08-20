# v14 – PDF / Code Execution compatibility + attachment-first research

## Fixed

1. Gemini `codeExecution` is no longer enabled on every final request.
   - It is disabled when a PDF is attached because Gemini rejects `application/pdf` together with `codeExecution` in the same generateContent call.
   - It is also disabled for ordinary legal questions unless the user explicitly requests calculations/code/data analysis.
   - The PDF remains attached and available to Gemini for direct multimodal analysis.

2. Short attachment commands such as `جاوب`, `حلل`, `راجع`, `اشرح` now enable the Flash-Lite legal research preflight.
   - This is important when the user question itself has no useful search terms.
   - The preflight extracts article numbers, case references, official URLs visible in the PDF, legal topics, and a precise Tavily query.

3. If preflight is unavailable/fails, search/RAG no longer uses a useless query such as `جاوب جاوب`.
   - It derives a deterministic research seed from the attachment filename.

4. Case RAG debug now shows both the original user question and the actual retrieval query.

5. Added `tool_compatibility_guard` debug fold showing whether Code Execution was enabled or deliberately skipped and why.

## Expected CASE-01 flow

`جاوب` + `CASE-01-constitutional_parliamentary_investigation.pdf`

- Case RAG query fallback: `CASE 01 constitutional parliamentary investigation Bahrain law`
- Legal research router: enabled because the command is short and depends on an attachment
- Official source fetch: uses any URL/anchors recovered by the router
- Tavily: receives a legal query from the router instead of `جاوب جاوب`
- Final Gemini: receives the PDF, but **without** the incompatible `codeExecution` tool
