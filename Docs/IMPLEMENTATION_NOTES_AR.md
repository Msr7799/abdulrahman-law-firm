# نوتات عربية للتعديلات المنفذة

## ملفات جديدة

- `src/types/legal-news.ts`
  - Types موحدة للأخبار القانونية، التصنيف، درجة التحقق، والأهمية.

- `src/lib/legal-news/index.ts`
  - Collector مركزي للأخبار.
  - يحاول اكتشاف BNA RSS من صفحة RSS الرسمية أو يستخدم `BNA_RSS_URLS` إن تم ضبطها يدوياً.
  - يقرأ صفحة هيئة التشريع والرأي القانوني.
  - يستخدم Tavily فقط كـfallback إذا كان عدد النتائج المباشرة قليلاً.
  - Deduplication وترتيب حسب الأهمية والتاريخ.
  - لا يستخدم Gemini نهائياً.

- `src/app/api/legal-news/route.ts`
  - API داخلي للموقع والأدمن.
  - أمثلة:
    - `/api/legal-news?period=today&limit=8`
    - `/api/legal-news?period=week&limit=8`
    - `/api/legal-news?period=month&limit=12`
  - يرسل Cache headers لتقليل الطلبات على المصادر الخارجية.

- `src/components/news/legal-news-carousel.tsx`
  - Carousel متجاوب باستخدام `motion` الموجود أصلاً في المشروع.
  - خبر واحد في كل مرة.
  - Auto rotate كل 7 ثوانٍ، ويتوقف عند hover.
  - صورة المصدر إن توفرت، وإلا يظهر شعار البحرين كـfallback.

- `src/components/news/legal-news-section.tsx`
  - Server component يجلب الأخبار ويغذي الـCarousel.

- `src/app/[locale]/news/[id]/page.tsx`
  - قراءة التفاصيل داخل موقع المكتب.
  - لا ينسخ المقال الأصلي كاملاً.
  - يعرض المصدر والتاريخ وحالة التحقق ورابط المصدر الأصلي.

- `src/components/admin/legal-news-overview.tsx`
  - موجز الأخبار داخل Admin Overview.

## ملفات معدلة

- `src/app/[locale]/page.tsx`
  - إضافة قسم الأخبار مباشرة بعد Hero.

- `src/components/admin/dashboard-overview.tsx`
  - إضافة Legal Briefing بعد Hero الخاص بالأدمن.

- `src/components/admin/legal-agent.tsx`
  - إضافة Quick Question باسم «المستجدات القانونية».

- `src/app/api/admin/agent/route.ts`
  - عند اكتشاف سؤال أخبار قانونية يستخدم الـLegal News Feed الموحّد كـevidence.
  - لا ينفذ Tavily Search منفصل بلا داعٍ.
  - Gemini يبقى طلباً واحداً للإجابة.
  - تعديل fallback models لتتوافق مع ملف حدود Free Plan.

- `.env.example`
  - إضافة إعدادات مصادر الأخبار والكاش.

## لماذا هذا التصميم آمن على Gemini Free Plan؟

1. فتح الصفحة الرئيسية = صفر Gemini requests.
2. فتح Admin Overview = صفر Gemini requests.
3. تحريك Carousel = صفر requests.
4. فتح صفحة خبر = صفر Gemini requests.
5. Legal Agent = طلب Gemini واحد فقط كالمعتاد عند السؤال.
6. الأخبار تستخدم Cache ولا يعاد طلب المصدر لكل زائر.

## إعداد BNA

الوضع الافتراضي يحاول اكتشاف روابط feeds من:

```env
BNA_RSS_INDEX_URL=https://beta.bna.bh/rss
```

إذا عرفت روابط RSS المباشرة لاحقاً ضعها مفصولة بفاصلة:

```env
BNA_RSS_URLS=https://example/feed1.xml,https://example/feed2.xml
```

وهذا أفضل من تعديل الكود عند تغير رابط feed.

## ملاحظات تشغيل

- يجب ضبط `TAVILY_API_KEY` حتى يعمل fallback عندما لا ترجع المصادر الرسمية عدداً كافياً من النتائج.
- في حال عدم توفر صورة قانونية قابلة للعرض، الواجهة تستخدم صورة/شعار محلي ولا تكسر التصميم.
- لا يتم حفظ صور الصحف داخل Firebase تلقائياً.
- لم نضف مكتبات جديدة، لذلك لا توجد dependency إضافية فقط لهذه الميزة.

## تسلسل التنفيذ داخل الكود

### الصفحة الرئيسية

1. `src/app/[locale]/page.tsx` يستدعي `LegalNewsSection` بعد `Hero` مباشرة.
2. `LegalNewsSection` يستدعي `getLegalNews("week", 8)` على الخادم.
3. `getLegalNews` يمر عبر collector والكاش، لذلك الزيارة العامة لا تصل مباشرة إلى Gemini.
4. أعلى القسم يظهر ticker لأهم خبر، وبعده `LegalNewsCarousel`.
5. زر «قراءة التفاصيل» يفتح `/${locale}/news/${id}`.
6. صفحة التفاصيل تبحث عن نفس الـID من feed آخر 30 يوماً وتعرض الملخص والمصدر.

### Admin Overview

1. `DashboardOverview` يعرض `LegalNewsOverview` بعد بطاقة مساحة العمل.
2. المكوّن يقرأ `/api/legal-news?period=week&limit=8`.
3. API يرسل `s-maxage` و`stale-while-revalidate` حتى لا يصبح فتح الأدمن سبباً في إعادة جلب المصادر كل مرة.

### Legal Agent

1. Quick Question الجديدة ترسل سؤال آخر 7 أيام.
2. `isLegalNewsQuery()` يكتشف أن السؤال متعلق بالمستجدات.
3. Route الوكيل يستدعي `getLegalNews()` ويحوّل النتائج إلى Web Evidence `[W#]`.
4. لا ينفذ Tavily Search آخر مستقل للسؤال نفسه.
5. يتم إرسال evidence إلى Gemini في طلب الإجابة المعتاد فقط.
6. إذا سأل المستخدم سؤالاً آخر غير الأخبار يبقى Tavily pipeline القديم كما هو.

## سلوك الفشل Graceful Degradation

- إذا فشل BNA RSS ينتقل النظام إلى هيئة التشريع ثم Tavily fallback إن كان المفتاح موجوداً.
- إذا فشلت جميع المصادر لا يظهر قسم أخبار وهمي في الصفحة العامة.
- Admin Overview يعرض رسالة «لا توجد مستجدات متاحة» بدل كسر الصفحة.
- لا يتم إنشاء عنوان أو تاريخ تشريعي من Gemini، لأن Gemini غير مستخدم في ingestion العام.

## ما لم يتم تنفيذه الآن عمداً

- نسخ المقال الصحفي الكامل.
- حفظ صور الصحف تلقائياً في Firebase.
- تشغيل Gemini مع كل Cron أو زيارة صفحة.
- ربط eKey أو بيانات القضايا الحكومية الخاصة بدون API رسمي.
- RAG التشريعات الكامل وVector Store. هذه مرحلة لاحقة بعد تثبيت ingestion والمصادر.
