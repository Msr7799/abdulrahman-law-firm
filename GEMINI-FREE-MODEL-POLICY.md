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
