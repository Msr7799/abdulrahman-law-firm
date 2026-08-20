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

## v18 — Live agent trace + blocked SJC recovery

- The admin agent endpoint supports `application/x-ndjson` progress streaming. The client creates the assistant card immediately and receives node/debug updates while retrieval and Gemini generation are still running.
- Gemini final generation uses `generateContentStream`; only provider-returned **thought summaries** are exposed live. Raw/private chain-of-thought is never required or displayed.
- Live thought-summary UI updates are throttled to roughly 220ms / meaningful text growth to avoid excessive React renders while preserving the actual provider stream.
- Recoverable/optional nodes use `SKIPPED` (rendered green) instead of `ERROR`. Red is reserved for a real final failure, invalid evidence, contradiction, or other condition that should block legal reliance.
- `ahkam.sjc.bh` may refuse direct server fetches. If Tavily retrieves the exact same canonical official judgment URL embedded in the attachment, that result is promoted to `[O#]` with an explicit `recoveredVia=tavily-official-url-fallback` debug record.
- Canonical URL comparison sorts query parameters, so `?i=...&p=1` and `?p=1&i=...` are treated as the same SJC judgment.
- After exact SJC recovery, the agent does not re-fetch the same blocked page in `official_source_followup`; this removes the redundant ~30-second wait seen in CASE-03.
- Generic SJC/authority homepages are suppressed when an exact judgment page is already found.
- The final prompt receives only distinct supplemental Tavily evidence; an exact result promoted to `[O#]` is not simultaneously exposed to Gemini as the old `[W1]` citation.
- Model policy is re-evaluated after retrieval. If the exact governing judgment is available and the user did not request open-ended deep research, the final turn can step down from 3.6/high to 3.5/medium while preserving the stronger model for genuinely unresolved deep tasks.
- Historical-law verification explicitly distinguishes the rule actually in force on the case date from a later replacement/corresponding statute, and arbitration QA checks the difference between a non-grievable enforcement grant order and an appealable refusal judgment.

## v19 — Legal evidence hardening for labour settlements

- High-confidence Bahrain government legislation/judgment pages discovered by Tavily are promoted to `[O#]` when the URL itself is an official Bahrain legal source, the page is non-generic, and the extracted legal content passes relevance/content thresholds. The debug trace records `tavily-official-domain-extraction` so the retrieval channel is never hidden.
- This promotion occurs before `official_source_followup`, preventing a redundant 403/blocked re-fetch of an official page whose substantive text is already available from the exact official URL.
- Grouped citations now support Arabic and English separators, including `[O1، O2]`, `[O1, W1]`, `[O1/W1]`, and separate `[O1] [W1]` forms.
- Added `bahrain-labour-settlement-analysis`: labour settlements/releases must verify Article 5 when relevant and evidence is available, including the full temporal rule (during the contract or within three months after termination) and the distinction between rights actually covered and rights omitted by the release.
- For vague attachment commands such as `جاوب`, the Lite router is kept even when a direct official URL is visible, because a primary judgment URL does not identify every secondary statutory issue needed for research.
- Labour settlement routing enriches the single Tavily query with Article 5 / settlement / release terminology so the official Labour Law result can provide both the termination rule and the settlement rule without a separate Gemini call.

## v20 — Exact-case recovery + AML/lawyers evidence hardening

- When an attachment embeds an exact `ahkam.sjc.bh` judgment URL and direct Vercel fetch is blocked, Tavily now receives that URL as an **expected official source**, not as noisy query text. Exact canonical URL matches receive absolute priority.
- If the first Tavily search misses an expected SJC judgment, the same tool performs one targeted SJC-only retry using the appeal number/year parsed from the official URL. This does not consume a Gemini request.
- Official-source promotion now requires **source-topic alignment**, not merely a Bahrain government domain. Promotion requires the exact expected URL, a matching compound legal reference (case/law/decision number + year), or multiple distinctive topic terms. This prevents unrelated statutes such as the Court of Cassation establishment law from becoming `[O#]` in an AML/lawyers case.
- Added `bahrain-lawyers-aml-analysis`: verify ministerial competence, AML enabling legislation, Lawyers Law confidentiality, defence representation, equality, forced-labour arguments, and historical-vs-current regulation from supplied official evidence.
- The final legal prompt prohibits describing lawyer-client confidentiality as “absolute” unless the evidence literally supports it, and requires distinguishing defence/representation from regulated client transactions according to the governing source.
- Deep constitutional/administrative requests always receive one Flash-Lite claim-to-evidence verification pass. This catches cases where every sentence has a syntactically valid `[O#]` but the source is substantively about the wrong law/topic.
- AML quality verification explicitly checks Decision 64/2017, Decree-Law 4/2001, constitutional/professional-confidentiality holdings, equality and forced-labour reasoning, and flags historical regulations presented as current law.


## Empty-response recovery (v21)

إذا أنهى Gemini الجولة بـ `STOP` بعد إرسال ملخص التفكير ولكن بلا نص إجابة مرئي، لا يُعامل ذلك كفشل بحث أو كوتا. يقوم الوكيل بالآتي:

1. يعيد **صياغة الجواب النهائي فقط** على نفس الموديل ومن نفس الأدلة، بدون إعادة Router أو Tavily أو RAG.
2. يقلل التفكير المفتوح في محاولة الاسترجاع حتى يركز الموديل على إخراج الإجابة المرئية.
3. بعد `GEMINI_EMPTY_RESPONSE_MAX_ATTEMPTS` (الافتراضي 2) ينتقل إلى الـ fallback المجاني المسموح به في سياسة نفس الحمل.
4. يحتفظ بسجل المحاولات والموديلات في الديباق، ولا يخفي سبب الاسترجاع.

أخطاء 429/5xx تبقى خاضعة لسياسة pacing/backoff المعتادة ولا تستخدم fallback فورياً.
