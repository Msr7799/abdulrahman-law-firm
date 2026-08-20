# سياسة نماذج Gemini المجانية للوكيل

الاختيار يتم تلقائياً من نوع طلب المستخدم، وليس من قائمة واحدة مشتركة لكل الطلبات.

- `micro`: تلخيص/ترجمة/صياغة قصيرة -> `gemini-3.5-flash-lite` ثم `gemini-3.1-flash-lite`.
- `standard`: سؤال قانوني عادي أو صياغة قانونية -> `gemini-3.5-flash` ثم `gemini-3.5-flash-lite`.
- `complex`: عدة مسائل/مرفقات أو بحث أحكام -> `gemini-3.5-flash` ثم `gemini-3.6-flash`.
- `deep`: بحث عميق، ثغرات، قضية دستورية أو تحليل قضية معقدة -> `gemini-3.6-flash` ثم `gemini-3.5-flash`.

قواعد الـ fallback:

1. 429/RPM/TPM المؤقت: الانتظار + exponential backoff على نفس الموديل، من دون القفز لموديل آخر.
2. 404/model unavailable: الانتقال إلى الـ fallback المجاني المحدد للدور.
3. hard daily quota: يمكن الانتقال إلى fallback مجاني مختلف.
4. Pro غير مستخدم افتراضياً.

عقدة البحث التمهيدية تستخدم Flash-Lite فقط، ويتم تجاوزها تماماً في التلخيص والمهام الخفيفة أو عند العثور على رابط رسمي مباشرة.

## Case RAG الهجين

- `gemini-embedding-2` يستخدم للبحث الدلالي في قضايا المكتب، بأبعاد 768.
- يتم إرسال query + القضايا التي لا يوجد لها vector مخزن في cache ضمن **استدعاء Embedding واحد**.
- القضايا غير المعدلة يعاد استخدام vectors الخاصة بها على الـ warm Vercel instance.
- النتيجة النهائية تجمع semantic similarity مع البحث النصي القديم؛ وإذا فشل Embedding ترجع المنظومة تلقائياً إلى lexical RAG ولا تسقط الإجابة.
- Embeddings مستقلة عن استدعاءات توليد النص، ولا يتم استخدام Flash/Flash-Lite لصناعة vector.

## Legal Quality Gate

1. فحص حتمي مجاني لكل إجابة: صحة `[O#]/[W#]`، الروابط، استخدام المصدر الرسمي، وحدود الإجابة، ورصد الادعاءات القانونية غير المسندة.
2. لا يتم تشغيل موديل إضافي لكل إجابة.
3. `gemini-3.5-flash-lite` يعمل كـ semantic verifier فقط للطلبات `complex/deep` وعندما يفشل الفحص الحتمي فشلاً شديداً.
4. إذا فشل semantic verifier بسبب quota/provider error، لا يسقط الطلب؛ تبقى نتيجة الفحص الحتمي ظاهرة في Debug.
5. `aqa` غير مستخدم؛ التحقق مبني على evidence الذي جلبه الوكيل نفسه، وهذا أنسب للإجابات العربية والقانون البحريني.

## v16 — Attachment/tool safety

- PDF attachments and Gemini Code Execution are never sent in the same `generateContent` request. PDF analysis remains enabled, while Code Execution is disabled for that turn and the debug trace shows `tool_compatibility_guard`.
- Code Execution is enabled only when the user explicitly asks for calculations/code/data analysis and there is no incompatible PDF attachment.
- A short command that depends on an attachment (for example `جاوب`, `حلل`, `راجع`) forces one Flash-Lite routing pass when no official URL was recovered. This pass extracts the case/topic/articles and builds the legal search query; it does not answer the case.
- When the user prompt is too generic, the attachment filename is used as a deterministic research seed for Case RAG and Tavily instead of searching for `جاوب`.

## v17 Legal retrieval / QA hardening

- Attachment-aware order is now: official URL extraction -> optional Lite router -> official fetch -> Case RAG. Case RAG never embeds a bare command such as `جاوب` when a document can provide legal anchors.
- Demo/training cases are excluded from real Case RAG by default (`CASE_RAG_INCLUDE_DEMO=false`).
- Hybrid Case RAG uses a strict gate: exact case reference, or high semantic similarity, or supported semantic similarity plus multiple lexical legal anchors, with a legal-domain compatibility check.
- A complete, high-authority direct official judgment/legislation source can satisfy research without a redundant Tavily call. Tavily still runs when evidence is missing/short or the user explicitly asks for broader sources, comparisons, precedents, or news.
- Tavily hits are promoted to `[O#]` only when their URL is inside the direct Bahrain official allowlist; secondary pages remain `[W#]` and do not create a false official-fetch error.
- Normal legal analysis no longer surfaces loosely matched decorative logo/images. Images/logos are opt-in by user intent or news tasks.
- URL citation validation canonicalizes Markdown backticks, `www`, trailing punctuation and harmless slash differences before comparing against allowed evidence.
- Legal QA now separates hard failures from soft citation-format warnings and performs claim-to-evidence verification for unsupported or contradicted legal conclusions. A semantic pass can downgrade formatting-only issues to `PASS WITH NOTES`, but cannot override a real contradiction or invalid source.
- The final legal model is instructed not to label the entire analysis as `100%` / `قطعية`; verified court disposition and analytical confidence are stated separately.
