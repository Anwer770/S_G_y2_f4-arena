<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8f3e52d9-5d3a-43ad-9117-df1d7a32e9fd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 📚 التوثيق (Documentation)

| الملف | الغرض |
|---|---|
| [`PRD.md`](./PRD.md) | **المرجع المعتمد**: النطاق، 14 تبويباً، نموذج البيانات، قواعد الأعمال، معايير القبول |
| [`BUILD_PROMPT_SHORT.md`](./BUILD_PROMPT_SHORT.md) | عقد التشغيل اليومي للوكيل/المطوّر (~90 سطراً) |
| [`BUILD_PROMPT.md`](./BUILD_PROMPT.md) | برومت البناء من الصفر (كامل) |
| [`PROMPTS_LIBRARY.md`](./PROMPTS_LIBRARY.md) | برومتات: تطوير، 14 وحدة، مراجعة أمنية، اختبارات، بيانات |
| [`QA_CHECKLISTS.md`](./QA_CHECKLISTS.md) | بوابات الجودة ونتائجها المقيسة وقوائم ما قبل التسليم |
| [`PRD_v2.7_archive.md`](./PRD_v2.7_archive.md) | وثيقة المنتج القديمة (مؤرشفة) |
| [`PRD_PROMPT_MASTER.md`](./PRD_PROMPT_MASTER.md) | النسخة المجمّعة القديمة (مؤرشفة) |
| [`تقرير-الفحص.md`](./تقرير-الفحص.md) | تقرير الفحص التقني والثغرات الأصلية |

**قبل أي تسليم:** `npx tsc --noEmit && npm run build && npm run integrity && npm run regression`
