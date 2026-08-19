# خطة تنفيذ دفع أتعاب المحاماة في البحرين | Bahrain Legal Fees Payment Plan

**تاريخ الخطة:** 19 أغسطس 2026  
**الحالة:** خطة تنفيذ مستقبلية، لم يتم ربط بوابة دفع حقيقية داخل المشروع بعد.

---

## 1) الهدف | Objective

إنشاء نظام دفع آمن لأتعاب المحاماة يسمح للعميل بدفع فاتورة محددة عبر أحد المسارات الرسمية والمتاحة في البحرين، مع عدم تخزين بيانات البطاقة داخل خوادم موقع المكتب.

Build a secure legal-fee payment workflow where a client pays a specific invoice through Bahrain-supported payment rails without the law firm website storing raw card data.

---

## 2) الخيارات الرسمية التي تم التحقق منها | Verified Official Options

### الخيار A — BENEFIT Payment Gateway

مناسب للدفع الإلكتروني عبر بطاقات الخصم المحلية الصادرة في البحرين.

**متطلبات قبل البرمجة:**

1. تسجيل المكتب كتاجر Payment Gateway Merchant لدى BENEFIT.
2. استلام merchant credentials والوثائق التقنية من BENEFIT.
3. الحصول على بيئة اختبار/Sandbox إن كانت متاحة للحساب المعتمد.
4. معرفة صيغة callback/webhook/return URL الرسمية.
5. التأكد من متطلبات signature/hash والتحقق من الرسالة.

**Official source:**
https://benefit.bh/business/payment-gateway/

### الخيار B — BenefitPay Merchant QR

مناسب للعميل الذي يريد الدفع من تطبيق BenefitPay.

بعد تسجيل المكتب كتاجر، يمكن استخدام QR الخاص بالتاجر أو QR/طلب دفع حسب الإمكانيات التي تعتمدها BENEFIT للحساب.

**مهم:** لا يتم اختراع URI مثل `benefitpay://...` أو deep link غير موثق. يجب استخدام QR أو app-to-app/deep-link فقط بالشكل الذي تسلمه BENEFIT أو مزود التكامل رسمياً.

**Official source:**
https://benefit.bh/business/benefitpay-business/

### الخيار C — بطاقات Visa / Mastercard

موقع BENEFIT يوضح أن معالجة بطاقات الائتمان تتم عبر **credit card payment gateway acquirers**. لذلك يلزم اختيار بنك/مزود acquiring مرخص ومناسب للمكتب، ثم استخدام Hosted Checkout أو tokenized gateway.

قبل التعاقد، يتم التحقق من ترخيص المزود من دليل مصرف البحرين المركزي.

**CBB licensing directory:**
https://www.cbb.gov.bh/licensing-directory/

### الخيار D — Fawateer

Fawateer هي منصة البحرين الوطنية لعرض ودفع الفواتير وتربط البنوك والجهات المفوترة.

مناسبة إذا أراد المكتب لاحقاً:

- إصدار فواتير رسمية برقم مرجع.
- تسوية ومطابقة مركزية.
- قناة دفع متكررة للعملاء.
- استكشاف Direct Debit.

**Official source:**
https://benefit.bh/business/fawateer/

---

## 3) التوصية العملية | Recommended Rollout

### المرحلة 1 — Invoice + Payment Link

ابدأ بنظام فواتير داخل الموقع مستقل عن مزود الدفع.

كل فاتورة تحتوي:

- `invoiceId`
- `invoiceNumber`
- `clientId`
- `matterId` أو `caseId` إذا كانت مرتبطة بقضية.
- وصف الأتعاب بالعربية والإنجليزية.
- `amountMinor` كعدد صحيح بالفلس/الوحدة الصغرى حسب ما يعتمد المزود.
- `currency = BHD`
- `status`
- `issuedAt`
- `dueAt`
- `createdBy`

### المرحلة 2 — Hosted Checkout

الأفضل أمنياً استخدام صفحة دفع مستضافة من المزود أو redirect flow بدل جمع بيانات البطاقة داخل الموقع.

التدفق:

```text
Client opens invoice
        ↓
Server validates invoice + amount
        ↓
Server creates payment attempt
        ↓
Provider returns hosted checkout URL/session
        ↓
Client is redirected to provider
        ↓
Payment is completed or cancelled
        ↓
Provider callback/webhook reaches server
        ↓
Server verifies signature + amount + reference
        ↓
Payment record updated
        ↓
Invoice becomes paid/partially paid
        ↓
Receipt generated
```

### المرحلة 3 — BenefitPay QR

أضف اختيار:

**الدفع عبر BenefitPay | Pay with BenefitPay**

لكن المصدر الفعلي للـQR يجب أن يكون:

- QR رسمي للتاجر، أو
- QR ديناميكي من API/SDK رسمي إن وفرته BENEFIT لحساب المكتب.

يجب عدم اعتبار فتح تطبيق BenefitPay وحده دليلاً على الدفع. حالة الفاتورة تتغير فقط بعد تأكيد رسمي أو reconciliation موثوق.

### المرحلة 4 — Fawateer

بعد ثبات الفواتير وزيادة حجم العمليات، يمكن تسجيل المكتب كـBiller لدى Fawateer ودراسة API/ملفات المطابقة المتاحة للحساب.

---

## 4) Data Model مقترح

### `invoices/{invoiceId}`

```ts
{
  invoiceNumber: string;
  clientId: string;
  matterId?: string;
  descriptionAr: string;
  descriptionEn: string;
  amountMinor: number;
  currency: "BHD";
  status: "draft" | "issued" | "partially_paid" | "paid" | "void" | "refunded";
  issuedAt: number;
  dueAt?: number;
  paidMinor: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}
```

### `paymentAttempts/{paymentId}`

```ts
{
  invoiceId: string;
  provider: "benefit-gateway" | "benefitpay" | "card-acquirer" | "fawateer";
  providerReference?: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: "BHD";
  status: "created" | "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
```

### `paymentEvents/{eventId}`

Append-only audit events:

```ts
{
  paymentId: string;
  eventType: string;
  providerReference?: string;
  verified: boolean;
  createdAt: number;
}
```

لا تخزن PAN/CVV/PIN أو بيانات بطاقة خام.

Never store raw PAN, CVV or PIN.

---

## 5) API Routes المقترحة

```text
POST /api/payments/create
POST /api/payments/benefit/callback
POST /api/payments/cards/callback
POST /api/payments/fawateer/callback
GET  /api/payments/status?invoice=...
GET  /api/invoices/:id
POST /api/invoices/:id/receipt
```

### `POST /api/payments/create`

المهام:

1. مصادقة المستخدم أو التحقق من secure invoice token.
2. جلب قيمة الفاتورة من السيرفر، وليس من قيمة يرسلها المتصفح.
3. رفض الفاتورة الملغاة أو المدفوعة بالكامل.
4. إنشاء `paymentAttempt`.
5. استخدام idempotency key.
6. إنشاء جلسة الدفع مع المزود.
7. إعادة redirect URL فقط.

### Callback/Webhook

لا تعتبر query string مثل `?success=true` دليلاً على نجاح الدفع.

يجب:

1. التحقق من signature حسب وثائق المزود.
2. مطابقة merchant ID.
3. مطابقة provider reference.
4. مطابقة المبلغ والعملة والفاتورة.
5. منع إعادة معالجة نفس الحدث.
6. تحديث الدفع والفاتورة داخل transaction/atomic operation.
7. تسجيل audit event.

---

## 6) تجربة المستخدم عربي/إنجليزي | Bilingual UX

### صفحة الفاتورة

تحتوي على:

- رقم الفاتورة / Invoice number.
- اسم العميل / Client.
- موضوع الأتعاب / Fee description.
- المبلغ / Amount.
- الحالة / Status.
- تاريخ الاستحقاق / Due date.

الأزرار:

- **الدفع ببطاقة | Pay by card**
- **الدفع عبر BenefitPay | Pay with BenefitPay**
- **تحميل الفاتورة | Download invoice**
- **تحميل الإيصال | Download receipt** بعد نجاح الدفع.

### Mobile

لأن BenefitPay غالباً يستخدم من الهاتف:

- اجعل زر BenefitPay كبيراً وواضحاً.
- إن كان QR هو الطريقة المعتمدة، اعرض QR مع زر نسخ رقم الفاتورة/المرجع.
- على الديسكتوب يعرض QR بحجم مناسب.
- على الهاتف يستخدم flow الذي يعطيه المزود رسمياً، إن كان لديه app-to-app handoff.

---

## 7) الأمن | Security Requirements

- HTTPS فقط.
- Hosted Checkout whenever possible.
- No card data in Firebase/Firestore/Realtime Database/logs.
- Secrets server-side only.
- Webhook signature verification.
- Idempotency.
- Rate limiting.
- CSRF protection where applicable.
- Strict validation with Zod.
- Audit logs.
- Least-privilege Firebase rules.
- Separate finance/admin roles.
- Never log full personal number or payment credentials.
- Encrypt sensitive exported reports.

---

## 8) المحاسبة والتسوية | Reconciliation

لا يكفي أن تظهر العملية `succeeded` في واجهة العميل.

يجب وجود شاشة **Payment Reconciliation** داخل الأدمن تعرض:

- Invoice number.
- Internal payment ID.
- Provider reference.
- Amount.
- Provider.
- Status.
- Paid at.
- Reconciled yes/no.
- Refunded amount.

وفي نهاية اليوم يمكن مطابقة العمليات مع تقرير المزود أو Fawateer/بوابة الدفع.

---

## 9) Refunds والدفعات الجزئية

ينصح أن يدعم النظام من البداية مفهوم:

- Partial payment.
- Full payment.
- Partial refund.
- Full refund.

حتى لو لم يدعم المزود كل هذه العمليات في المرحلة الأولى، يكون الـdata model مستعداً لها.

لا يتم تنفيذ refund بمجرد تغيير status في قاعدة البيانات. الاسترجاع يجب أن يتم عن طريق API/portal المزود ثم تسجيل نتيجته.

---

## 10) المراحل التنفيذية | Implementation Phases

### Phase A — Internal billing foundation

- Clients.
- Matters/cases relation.
- Invoices.
- Payment attempts.
- Audit log.
- Invoice UI AR/EN responsive.

### Phase B — Merchant onboarding

- Apply for BENEFIT Payment Gateway merchant.
- Apply for BenefitPay merchant if QR is required.
- Select licensed card acquirer if Visa/Mastercard needed.
- Decide whether Fawateer is commercially justified.

### Phase C — Sandbox integration

- Provider SDK/API.
- Hosted checkout.
- Callback verification.
- Failure/cancel/timeout tests.
- Idempotency tests.
- Mobile tests.

### Phase D — Production

- Production credentials.
- Domain allowlist.
- Monitoring.
- Reconciliation.
- Incident procedure.
- Refund procedure.

---

## 11) معلومات يجب طلبها من BENEFIT/المزود قبل كتابة التكامل النهائي

1. API/SDK documentation.
2. Sandbox URL.
3. Production URL.
4. Merchant ID format.
5. Authentication method.
6. Signature/hash algorithm.
7. Callback/webhook specification.
8. Allowed return URLs.
9. Timeout rules.
10. Refund API.
11. Settlement reports.
12. Supported currencies.
13. Fees and commercial terms.
14. Dynamic QR specification, if available.
15. Official BenefitPay app-to-app/deep-link format, if available.

بدون هذه البيانات لا يفضل كتابة integration production لأن التخمين في المدفوعات طريقة ممتازة لصناعة مشاكل مالية من لا شيء.

---

## 12) القرار المقترح | Recommended Decision

**أفضل بداية للمكتب:**

1. بناء Invoice/Payments module داخلي أولاً.
2. التقديم على BENEFIT Payment Gateway.
3. تفعيل BenefitPay Merchant QR كخيار محلي واضح إذا كان مناسباً للتسوية.
4. اختيار acquirer مرخص لبطاقات Visa/Mastercard عند الحاجة.
5. دراسة Fawateer بعد نمو عدد الفواتير، وليس بالضرورة في أول إصدار.

This sequence keeps the architecture provider-neutral, secure, and suitable for Bahrain while avoiding fake payment confirmations or undocumented BenefitPay deep links.
