# تقرير مراجعة وتطوير لوحة الإدارة | Admin Dashboard Review & Changes

**تاريخ المراجعة:** 19 أغسطس 2026  
**المشروع:** Abdulrahman Law  
**النطاق:** لوحة الإدارة، التكاملات الحكومية البحرينية، خدمات وزارة العدل، جاهزية الدفع، العربية/الإنجليزية، والاستجابة للشاشات المختلفة.

---

## 1) الملخص التنفيذي | Executive Summary

تمت مراجعة هيكل المشروع ولوحة الإدارة الحالية، ثم إضافة طبقة تشغيلية جديدة داخل الأدمن باسم **التكاملات | Integrations**. الهدف ليس مجرد تجميع روابط، بل تمييز نوع كل اتصال بشكل صريح حتى لا يخلط الموظف أو المطور بين:

1. خدمة يمكن الوصول إليها برمجياً أو لديها API معلن.
2. رابط حكومي رسمي يمكن فتحه فقط.
3. خدمة تتطلب تسجيل تاجر أو اعتماداً أو تنسيقاً رسمياً قبل الربط.

The admin dashboard now includes an **Integrations** workspace that distinguishes public/programmatic access from official links and onboarding-required services. This prevents the system from implying that it can read or synchronize government data where no public API has been verified.

---

## 2) ماذا كان موجوداً قبل التعديل؟ | Existing State

لوحة الإدارة كانت تحتوي على أقسام جيدة ومفيدة:

- نظرة عامة / Overview.
- خارطة القضاء / Judicial roadmap.
- مكتبة النماذج / Government forms.
- إدارة القضايا / Case management.
- دليل المحامي / Legal directory.
- الوكيل القانوني / Legal agent.

كما أن المشروع يحتوي بالفعل على روابط عديدة لنماذج وزارة العدل وخدمات البوابة الوطنية، وهذا أساس قوي. المشكلة الرئيسية كانت أن **التكامل الحكومي والدفع لم يكونا ممثلين كطبقة مستقلة ذات حالة تكامل واضحة**.

---

## 3) البحث الرسمي الذي تم الاعتماد عليه | Official Research

### 3.1 هيئة المعلومات والحكومة الإلكترونية iGA

المصادر الرسمية تشير إلى أن استراتيجية الحكومة الإلكترونية البحرينية تتضمن تطوير **APIs وأدوات للمطورين** للتعامل الآمن مع قواعد البيانات الحكومية، بما يشمل بروتوكولات المصادقة ومنصات الدفع. هذا لا يعني أن كل خدمة حكومية، أو خدمات وزارة العدل تحديداً، متاحة كـAPI عام بدون اعتماد.

كما أن بوابة البيانات المفتوحة البحرينية توفر وصولاً برمجياً للبيانات العامة ويمكن استخدامها في الإحصاءات والبحث وإثراء لوحات المعلومات.

**Official sources:**
- Bahrain National Portal / iGA strategy: https://www.bahrain.bh/
- Information & eGovernment Authority: https://www.iga.gov.bh/en/
- Bahrain Open Data Portal: https://www.data.gov.bh/

### 3.2 الذكاء الاصطناعي في البحرين

أعلنت iGA في ديسمبر 2025 عن إطلاق Amazon Bedrock في البحرين بالشراكة مع AWS، وأوضحت أن الخدمة تدعم الجهات العامة والخاصة في تطوير حلول ذكاء اصطناعي توليدي آمنة، مع تركيز على جودة اللغة العربية وحماية البيانات والخصوصية.

هذا مفيد للمشروع من ناحية الاتجاه المستقبلي، لكنه **ليس تصريحاً تلقائياً لإرسال بيانات القضايا أو الأرقام الشخصية إلى أي نموذج AI**. يجب وجود موافقات تعاقدية وتقنية وسياسة واضحة لمعالجة البيانات.

**Official source:**
- iGA AWS Bahrain / Amazon Bedrock announcement: https://www.iga.gov.bh/en/

### 3.3 وزارة العدل والشؤون الإسلامية والأوقاف

وزارة العدل توفر مجموعة واسعة من الخدمات الإلكترونية على موقعها وعلى البوابة الوطنية، مثل الدعاوى والتنفيذ والتوكيلات والتراخيص والطلبات القضائية.

خلال البحث لم يتم التحقق من وجود **Public Developer API موثق ومتاح للعامة** يسمح للمكتب بقراءة ملفات القضايا أو مزامنة بيانات وزارة العدل مباشرة. لذلك تم تصميم الواجهة بحيث تعرض هذه الخدمات كـ**روابط حكومية رسمية** وليس كتكامل API وهمي.

**Official source:**
- Ministry of Justice eServices: https://www.moj.gov.bh/en/ministry-services/eservices

### 3.4 نظام تواصل Tawasul

تمت إضافة تواصل كقناة رسمية مناسبة للاستفسار عن:

- جهة الاتصال التقنية.
- توفر API لخدمة معينة.
- متطلبات الاعتماد أو الربط المؤسسي.

**Official source:**
- https://services.bahrain.bh/wps/portal/tawasul/Home_en

### 3.5 BENEFIT وBenefitPay وFawateer

تم التحقق من المصادر الرسمية التالية:

- **BENEFIT Payment Gateway:** يعالج المدفوعات الإلكترونية ببطاقات الخصم المحلية الصادرة في البحرين، ويتطلب حساب تاجر وربطاً معتمداً.
- **Credit cards:** موقع BENEFIT يوضح أن معالجة بطاقات الائتمان يجب تنسيقها مع جهات acquiring/payment gateway الخاصة ببطاقات الائتمان.
- **BenefitPay Merchant:** العميل يستطيع الدفع للتاجر عبر QR من تطبيق BenefitPay بعد تسجيل التاجر.
- **Fawateer:** منصة البحرين الوطنية لعرض ودفع الفواتير، وتربط البنوك والجهات المفوترة في منصة مركزية.
- **Digital Direct Debit:** أطلقت BENEFIT في فبراير 2026 خدمة خصم مباشر رقمية عبر Fawateer مبنية على API-based interface.

**Official sources:**
- https://benefit.bh/business/payment-gateway/
- https://benefit.bh/business/benefitpay-business/
- https://benefit.bh/business/fawateer/
- https://benefit.bh/application-forms/

---

## 4) التعديلات المنفذة فعلياً | Implemented Changes

### 4.1 إضافة قسم جديد: التكاملات | Integrations

**الملف الجديد:**
`src/components/admin/government-integration-hub.tsx`

تم إنشاء واجهة Responsive جديدة بالكامل تدعم العربية والإنجليزية، وتشمل:

- بحث فوري.
- فلترة حسب حالة التكامل.
- بطاقات responsive من عمود واحد إلى ثلاثة أعمدة.
- شارات حالة واضحة.
- روابط للمصادر الرسمية فقط.
- تحذير أمني واضح بشأن بيانات القضايا والأرقام الشخصية.

### 4.2 إنشاء سجل مركزي للتكاملات الحكومية والدفع

**الملف الجديد:**
`src/data/government-integrations.ts`

تمت إضافة البيانات التالية باللغتين:

- Ministry of Justice eServices.
- Bahrain Open Data Portal.
- eKey / Government Integration exploration.
- Tawasul.
- BENEFIT Payment Gateway.
- BenefitPay Merchant.
- Fawateer.

لكل عنصر:

- اسم عربي وإنجليزي.
- وصف عربي وإنجليزي.
- اسم الجهة.
- حالة التكامل.
- رابط رسمي.
- حالات الاستخدام الموصى بها.

### 4.3 حالات التكامل المستخدمة

تم اعتماد أربع حالات برمجية:

- `available`: وصول برمجي أو مصدر بيانات متاح.
- `official-link`: رابط حكومي رسمي بدون ادعاء API.
- `requires-onboarding`: يحتاج تسجيل/اتفاق/اعتماد قبل التكامل.
- `research`: محفوظ للتكاملات التي لم يكتمل التحقق منها.

هذه البنية مهمة لاحقاً لأن أي خدمة جديدة يمكن إضافتها بدون إعادة تصميم الواجهة.

### 4.4 تحديث تبويبات لوحة الإدارة

**الملف المعدل:**
`src/components/admin/admin-dashboard.tsx`

تم:

- إضافة تبويب Integrations.
- إضافة أيقونة مناسبة.
- ربطه بالـURL parameter الحالي `adminTab`.
- تعديل شبكة التبويبات لتصبح أكثر ملاءمة للموبايل والتابلت والديسكتوب:
  - عمودان على الشاشات الصغيرة جداً.
  - أربعة أعمدة ابتداءً من 460px.
  - سبعة أعمدة على الشاشات الكبيرة.

### 4.5 تحديث نظرة عامة الأدمن

**الملف المعدل:**
`src/components/admin/dashboard-overview.tsx`

تم:

- إضافة Integrations ضمن دليل مساحة العمل.
- زيادة عدد أقسام التشغيل من 5 إلى 6.
- تعديل توزيع البطاقات ليتدرج من 1 إلى 2 ثم 3 ثم 6 أعمدة حسب الشاشة.

### 4.6 تحديث بيانات دليل مساحة العمل

**الملف المعدل:**
`src/data/judicial-roadmap.ts`

تمت إضافة بطاقة **التكاملات الحكومية** باللغتين ووصف واضح لما يجب أن يستخدم القسم من أجله.

---

## 5) تقييم واقعي للوضع الحالي | Realistic Assessment

### نقاط القوة

- المشروع منظم بشكل جيد إلى Components/Data/Lib.
- دعم locale موجود أصلاً ومناسب لإضافة ميزات ثنائية اللغة.
- مكتبة النماذج الحالية واسعة ومفيدة جداً للمكتب.
- يوجد فصل بين القضايا والدليل والوكيل القانوني.
- Firebase rules الحالية أكثر تحفظاً من قواعد مفتوحة للعامة، وهذه نقطة جيدة.

### نقاط يجب تطويرها في المرحلة التالية

#### أ) إدارة العملاء Clients/Matters

حالياً التركيز على القضية نفسها. الأفضل مستقبلاً إضافة كيان `clients` و`matters` لفصل العميل عن القضية بحيث يمكن للعميل أن يمتلك أكثر من قضية أو استشارة أو فاتورة.

#### ب) الفواتير والأتعاب

إضافة:

- `invoices`.
- `invoiceItems`.
- `payments`.
- حالات: draft / issued / partially_paid / paid / void / refunded.
- BHD minor units لتجنب أخطاء الأرقام العشرية.

#### ج) Audit Log أوسع

يوجد تصميم Audit Log في Firestore rules، لكن يفضل أن يشمل لاحقاً:

- مشاهدة قضية حساسة.
- تنزيل مستند.
- إنشاء فاتورة.
- بدء عملية دفع.
- نجاح/فشل/استرجاع الدفع.
- تعديل بيانات العميل.

#### د) صلاحيات Role-Based Access Control

بدل الاعتماد طويل المدى على allowlist بريد فقط، يفضل الانتقال إلى Custom Claims/Roles:

- owner
- admin
- lawyer
- paralegal
- finance
- read-only

#### هـ) حماية البيانات والذكاء الاصطناعي

قبل تمكين رفع ملفات القضايا إلى AI:

- تحديد مكان استضافة النموذج.
- اتفاق معالجة بيانات.
- Data minimization.
- Redaction للأرقام الشخصية والبيانات الحساسة عند عدم الحاجة.
- تشفير الملفات أثناء النقل والتخزين.
- سياسة retention واضحة.
- Audit لكل طلب AI.

#### و) عدم Scraping الأنظمة الحكومية

لا أوصي بعمل scraping أو automation لتسجيل الدخول إلى خدمات وزارة العدل أو البوابة الوطنية بدون موافقة مكتوبة أو API رسمي. هذا هش تقنياً وقد يتعارض مع شروط الاستخدام أو متطلبات الأمان.

---

## 6) اقتراح شكل الأدمن المثالي لاحقاً | Recommended Future Admin Structure

1. **Overview** — KPIs، المواعيد، الجلسات القادمة، الفواتير غير المسددة.
2. **Clients** — العملاء وKYC والموافقات.
3. **Cases / Matters** — القضايا والملفات والمراحل.
4. **Calendar & Deadlines** — الجلسات ومواعيد الطعون والتنبيهات.
5. **Documents** — مستندات، إصدارات، تصنيف، صلاحيات.
6. **Government Integrations** — القسم الذي تمت إضافته الآن.
7. **Forms** — مكتبة النماذج الرسمية والمكتبية.
8. **Billing & Payments** — الفواتير والمدفوعات والتسويات.
9. **Directory** — الجهات والاتصالات الرسمية.
10. **Legal AI** — الوكيل القانوني مع مصادر وقيود وصول.
11. **Audit & Security** — سجل الدخول والتعديلات والعمليات الحساسة.

---

## 7) ملاحظات Responsive وArabic/English

التعديلات الجديدة تعتمد على:

- Logical CSS properties مثل `start`, `end`, `ps`, `pe` حتى تعمل RTL/LTR بدون نسخ CSS منفصل.
- Breakpoints مرنة.
- بطاقات لا تعتمد على عرض ثابت.
- عناصر الفلترة تسمح بالتمرير الأفقي على الشاشات الصغيرة.
- جميع النصوص الجديدة لها نسختان عربية وإنجليزية.

---

## 8) حالة الاختبار | Validation Status

تمت مراجعة الملفات المعدلة بنيوياً ومحاولة تشغيل build للمشروع. بيئة العمل الحالية لا تحتوي dependencies الخاصة بالمشروع، ومحاولة تنزيل `pnpm@10.33.0` عبر Corepack لم تنجح لأن بيئة التنفيذ لا تملك وصولاً إلى npm registry.

تم أيضاً إجراء فحص syntax للملفات TypeScript/TSX المعدلة باستخدام TypeScript transpilation وكانت جميع الملفات المعدلة سليمة نحوياً. ومع ذلك، لم أدّعِ نجاح production build بدون dependencies. على جهاز التطوير، يجب تنفيذ:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

ثم معالجة أي تحذير بيئي إن ظهر.

---

## 9) الملفات التي أضيفت أو عُدلت | Files Changed

### Added

- `src/components/admin/government-integration-hub.tsx`
- `src/data/government-integrations.ts`
- `docs/ADMIN_DASHBOARD_REVIEW_AND_CHANGES.md`
- `docs/PAYMENTS_IMPLEMENTATION_PLAN_BAHRAIN.md`

### Modified

- `src/components/admin/admin-dashboard.tsx`
- `src/components/admin/dashboard-overview.tsx`
- `src/data/judicial-roadmap.ts`

---

## 10) النتيجة | Result

المشروع الآن عنده أساس أفضل بكثير لتحويل الأدمن من مجرد لوحة داخلية إلى **Legal Operations Dashboard** مناسبة لمكتب محاماة بحريني، مع فصل واضح بين البيانات الداخلية والخدمات الحكومية ومزودي الدفع. التعديل الحالي متعمد أن يكون محافظاً: يعرض ما تم التحقق منه رسمياً ولا يخترع API أو deep link أو صلاحية حكومية غير مثبتة.

The system is now better positioned to evolve into a Bahrain-focused legal operations platform while keeping government and payment integrations explicit, auditable and honest about their actual availability.
