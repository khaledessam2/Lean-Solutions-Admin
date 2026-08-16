/**
 * The field schemas that drive every form in the admin.
 *
 * The site stores its copy as a tree of plain objects, not as flat rows, so
 * rather than hand-writing a form per block the admin describes each block's
 * shape here and renders it recursively. Adding a field to the site means
 * adding a line here and a line in the site's `core/content.ts` — never a
 * database migration, because the block is a single jsonb column.
 *
 * Keep these in step with the site's `content.ts`: a field described here that
 * the site does not read is harmless, but a field the site reads and this file
 * omits will be dropped the next time the block is saved.
 */

export type Field =
  /** one string in both languages — `{ar, en}`, the site's `Text` */
  | { kind: 'text'; key: string; label: string; rows?: number; hint?: string }
  /** a plain single-language string: a path, a URL, a slug */
  | { kind: 'string'; key: string; label: string; hint?: string; nullable?: boolean }
  | { kind: 'number'; key: string; label: string; hint?: string }
  | { kind: 'boolean'; key: string; label: string; hint?: string }
  /** a path into the media bucket, with a picker and a preview */
  | { kind: 'media'; key: string; label: string; hint?: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  /** a repeatable list of bilingual strings — bullet points, paragraphs */
  | { kind: 'textList'; key: string; label: string; rows?: number; hint?: string }
  /** a fixed nested object */
  | { kind: 'group'; key: string; label: string; fields: Field[] }
  /** a repeatable list of objects; `title` names each row in the collapsed view */
  | {
      kind: 'list';
      key: string;
      label: string;
      fields: Field[];
      titleKey?: string;
      addLabel?: string;
    };

export interface BlockSchema {
  key: string;
  label: string;
  /** shown under the heading, to say where on the site this appears */
  where: string;
  fields: Field[];
}

// ---------------------------------------------------------------------------
// small pieces reused across blocks
// ---------------------------------------------------------------------------

const SEO: Field = {
  kind: 'group',
  key: 'seo',
  label: 'بيانات محركات البحث (SEO)',
  fields: [
    { kind: 'text', key: 'title', label: 'العنوان' },
    {
      kind: 'text',
      key: 'description',
      label: 'الوصف',
      rows: 3,
      hint: 'جوجل بيعرض أول ١٥٨ حرف تقريبًا',
    },
    { kind: 'media', key: 'image', label: 'صورة المشاركة', hint: 'اللي بتظهر لما تتبعت لينك الصفحة' },
  ],
};

const FILTERS = (label: string): Field => ({
  kind: 'list',
  key: 'filters',
  label,
  titleKey: 'label',
  addLabel: 'إضافة تصنيف',
  fields: [
    {
      kind: 'string',
      key: 'key',
      label: 'المعرّف',
      hint: 'لازم يطابق تصنيف الكروت: all أو elearning أو digital أو management',
    },
    { kind: 'text', key: 'label', label: 'الاسم الظاهر' },
  ],
});

const CATEGORY: Field = {
  kind: 'select',
  key: 'category',
  label: 'التصنيف',
  options: [
    { value: 'elearning', label: 'التعليم الإلكتروني' },
    { value: 'digital', label: 'التحول الرقمي' },
    { value: 'management', label: 'الاستشارات الإدارية' },
  ],
};

// ---------------------------------------------------------------------------
// the fixed page and section copy — one entry per `content_blocks` row
// ---------------------------------------------------------------------------

export const BLOCK_SCHEMAS: BlockSchema[] = [
  {
    key: 'header',
    label: 'الهيدر والقائمة',
    where: 'أعلى كل صفحة',
    fields: [
      {
        kind: 'list',
        key: 'links',
        label: 'روابط القائمة',
        titleKey: 'label',
        addLabel: 'إضافة رابط',
        fields: [
          { kind: 'text', key: 'label', label: 'الاسم' },
          { kind: 'string', key: 'path', label: 'المسار', hint: 'مثال: /about' },
        ],
      },
      { kind: 'text', key: 'cta', label: 'زر التواصل' },
      { kind: 'text', key: 'nav', label: 'وصف القائمة لقارئ الشاشة' },
      { kind: 'text', key: 'menu', label: 'وصف زر القائمة للموبايل' },
    ],
  },
  {
    key: 'footer',
    label: 'الفوتر',
    where: 'أسفل كل صفحة',
    fields: [
      { kind: 'text', key: 'about', label: 'نبذة الشركة', rows: 4 },
      { kind: 'text', key: 'rights', label: 'حقوق النشر' },
      { kind: 'text', key: 'privacy', label: 'سياسة الخصوصية' },
      { kind: 'text', key: 'terms', label: 'الشروط والأحكام' },
      {
        kind: 'list',
        key: 'columns',
        label: 'أعمدة الفوتر',
        titleKey: 'title',
        addLabel: 'إضافة عمود',
        fields: [
          { kind: 'text', key: 'title', label: 'عنوان العمود' },
          {
            kind: 'list',
            key: 'links',
            label: 'الروابط',
            titleKey: 'label',
            addLabel: 'إضافة رابط',
            fields: [{ kind: 'text', key: 'label', label: 'النص' }],
          },
        ],
      },
    ],
  },
  {
    key: 'common',
    label: 'كلمات مشتركة',
    where: 'مسار التنقل في كل الصفحات الداخلية',
    fields: [{ kind: 'text', key: 'home', label: 'كلمة الرئيسية' }],
  },

  {
    key: 'hero',
    label: 'السلايدر الرئيسي',
    where: 'أول ما تفتح الصفحة الرئيسية',
    fields: [
      { kind: 'text', key: 'consult', label: 'زر طلب الاستشارة' },
      { kind: 'text', key: 'explore', label: 'زر استكشاف الحلول' },
      { kind: 'text', key: 'prev', label: 'وصف زر السابق' },
      { kind: 'text', key: 'next', label: 'وصف زر التالي' },
      { kind: 'text', key: 'slides', label: 'وصف مجموعة الشرائح' },
      {
        kind: 'list',
        key: 'items',
        label: 'الشرائح',
        titleKey: 'title',
        addLabel: 'إضافة شريحة',
        fields: [
          { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
          { kind: 'textList', key: 'paragraphs', label: 'الفقرات', rows: 4 },
          {
            kind: 'group',
            key: 'art',
            label: 'الرسم المتحرك',
            fields: [
              { kind: 'media', key: 'src', label: 'ملف Lottie', hint: 'مثال: lottie/ai-core.json' },
              {
                kind: 'number',
                key: 'ratio',
                label: 'نسبة العرض للارتفاع',
                hint: 'مربع = 1، وعريض 16:9 = 1.7778',
              },
              { kind: 'text', key: 'label', label: 'الوصف لقارئ الشاشة' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: 'قسم من نحن',
    where: 'الصفحة الرئيسية، تحت السلايدر',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان' },
      { kind: 'text', key: 'lead', label: 'النص', rows: 4 },
      { kind: 'text', key: 'cta', label: 'زر اعرف المزيد' },
    ],
  },
  {
    key: 'pillars',
    label: 'الرؤية والرسالة والقيم',
    where: 'الصفحة الرئيسية وصفحة من نحن',
    fields: [
      { kind: 'text', key: 'imageAlt', label: 'وصف صورة الفريق' },
      {
        kind: 'list',
        key: 'cards',
        label: 'الكروت',
        titleKey: 'title',
        addLabel: 'إضافة كرت',
        fields: [
          { kind: 'string', key: 'key', label: 'المعرّف', hint: 'للاستخدام الداخلي فقط' },
          { kind: 'media', key: 'icon', label: 'الأيقونة' },
          { kind: 'text', key: 'title', label: 'العنوان' },
          { kind: 'text', key: 'text', label: 'النص', rows: 3 },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: 'قسم الخدمات',
    where: 'الصفحة الرئيسية — النصوص فقط، الخدمات نفسها في قسم الخدمات',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
      { kind: 'text', key: 'more', label: 'زر عرض المزيد' },
      { kind: 'text', key: 'read', label: 'زر اقرأ المزيد' },
      { kind: 'text', key: 'tabs', label: 'وصف التصنيفات لقارئ الشاشة' },
      { kind: 'text', key: 'prev', label: 'زر السابق' },
      { kind: 'text', key: 'next', label: 'زر التالي' },
      FILTERS('تصنيفات الخدمات'),
    ],
  },
  {
    key: 'projects',
    label: 'قسم المشاريع',
    where: 'الصفحة الرئيسية — النصوص فقط',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
      { kind: 'text', key: 'lead', label: 'النص', rows: 3 },
      { kind: 'text', key: 'more', label: 'زر عرض المزيد' },
      { kind: 'text', key: 'view', label: 'زر عرض المشروع' },
      { kind: 'text', key: 'prev', label: 'زر السابق' },
      { kind: 'text', key: 'next', label: 'زر التالي' },
    ],
  },
  {
    key: 'clients',
    label: 'العملاء والشعارات',
    where: 'الصفحة الرئيسية',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان' },
      { kind: 'text', key: 'lead', label: 'النص', rows: 3 },
      {
        kind: 'list',
        key: 'logos',
        label: 'الشعارات',
        titleKey: 'name',
        addLabel: 'إضافة عميل',
        fields: [
          { kind: 'text', key: 'name', label: 'اسم الجهة' },
          { kind: 'media', key: 'logo', label: 'الشعار', hint: 'أبيض على خلفية شفافة' },
        ],
      },
    ],
  },
  {
    key: 'contact',
    label: 'نموذج التواصل',
    where: 'الصفحة الرئيسية وكل الصفحات الداخلية',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان' },
      { kind: 'text', key: 'lead', label: 'النص', rows: 2 },
      { kind: 'text', key: 'name', label: 'حقل الاسم' },
      { kind: 'text', key: 'namePh', label: 'الاسم — النص الإرشادي' },
      { kind: 'text', key: 'nameErr', label: 'الاسم — رسالة الخطأ' },
      { kind: 'text', key: 'phone', label: 'حقل الهاتف' },
      { kind: 'text', key: 'phonePh', label: 'الهاتف — النص الإرشادي' },
      { kind: 'text', key: 'phoneErr', label: 'الهاتف — رسالة الخطأ' },
      { kind: 'text', key: 'email', label: 'حقل البريد' },
      { kind: 'text', key: 'emailPh', label: 'البريد — النص الإرشادي' },
      { kind: 'text', key: 'emailErr', label: 'البريد — رسالة الخطأ' },
      { kind: 'text', key: 'company', label: 'حقل الشركة' },
      { kind: 'text', key: 'companyPh', label: 'الشركة — النص الإرشادي' },
      { kind: 'text', key: 'companyErr', label: 'الشركة — رسالة الخطأ' },
      { kind: 'text', key: 'message', label: 'حقل الرسالة' },
      { kind: 'text', key: 'messagePh', label: 'الرسالة — النص الإرشادي' },
      { kind: 'text', key: 'submit', label: 'زر الإرسال' },
      { kind: 'text', key: 'ok', label: 'رسالة النجاح', rows: 2 },
      { kind: 'text', key: 'reach', label: 'عنوان بطاقة التواصل' },
      {
        kind: 'list',
        key: 'info',
        label: 'بيانات التواصل',
        titleKey: 'label',
        addLabel: 'إضافة بيان',
        fields: [
          {
            kind: 'string',
            key: 'key',
            label: 'الأيقونة',
            hint: 'phone أو pin أو mail أو clock',
          },
          { kind: 'text', key: 'label', label: 'العنوان' },
          { kind: 'text', key: 'value', label: 'القيمة' },
          {
            kind: 'string',
            key: 'href',
            label: 'الرابط',
            nullable: true,
            hint: 'مثال: tel:+966… أو mailto:… — سيبه فاضي لو مش رابط',
          },
        ],
      },
    ],
  },
  {
    key: 'home',
    label: 'سيو الصفحة الرئيسية',
    where: 'عنوان ووصف الصفحة الرئيسية في نتائج البحث',
    fields: [SEO],
  },

  {
    key: 'page.about',
    label: 'صفحة من نحن',
    where: '/about',
    fields: [
      SEO,
      { kind: 'text', key: 'heading', label: 'عنوان البانر' },
      {
        kind: 'group',
        key: 'intro',
        label: 'المقدمة',
        fields: [
          { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
          { kind: 'text', key: 'title', label: 'العنوان' },
          { kind: 'textList', key: 'paragraphs', label: 'الفقرات', rows: 5 },
          { kind: 'textList', key: 'modes', label: 'أنماط التدريب', rows: 3 },
        ],
      },
      {
        kind: 'list',
        key: 'blocks',
        label: 'الأقسام',
        titleKey: 'title',
        addLabel: 'إضافة قسم',
        fields: [
          { kind: 'text', key: 'title', label: 'العنوان' },
          { kind: 'text', key: 'text', label: 'النص', rows: 5 },
        ],
      },
      {
        kind: 'group',
        key: 'why',
        label: 'لماذا تختارنا',
        fields: [
          { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
          { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
          { kind: 'text', key: 'imageAlt', label: 'وصف الصورة' },
          { kind: 'textList', key: 'points', label: 'النقاط', rows: 2 },
        ],
      },
    ],
  },
  {
    key: 'page.services',
    label: 'صفحة الخدمات',
    where: '/services',
    fields: [
      SEO,
      { kind: 'text', key: 'heading', label: 'عنوان البانر' },
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
      { kind: 'text', key: 'lead', label: 'النص', rows: 3 },
      { kind: 'text', key: 'read', label: 'زر اقرأ المزيد' },
      { kind: 'text', key: 'tabs', label: 'وصف التصنيفات لقارئ الشاشة' },
      FILTERS('تصنيفات الصفحة'),
      {
        kind: 'group',
        key: 'steps',
        label: 'خطوات العمل',
        fields: [
          { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
          { kind: 'text', key: 'title', label: 'العنوان' },
          { kind: 'text', key: 'lead', label: 'النص', rows: 2 },
          { kind: 'text', key: 'imageAlt', label: 'وصف الصورة' },
          {
            kind: 'list',
            key: 'items',
            label: 'الخطوات',
            titleKey: 'title',
            addLabel: 'إضافة خطوة',
            fields: [
              { kind: 'text', key: 'title', label: 'العنوان' },
              { kind: 'text', key: 'text', label: 'النص', rows: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'page.projects',
    label: 'صفحة المشاريع',
    where: '/projects',
    fields: [
      SEO,
      { kind: 'text', key: 'heading', label: 'عنوان البانر' },
      { kind: 'text', key: 'eyebrow', label: 'العنوان الصغير' },
      { kind: 'text', key: 'title', label: 'العنوان', rows: 2 },
      { kind: 'text', key: 'lead', label: 'النص', rows: 3 },
      { kind: 'text', key: 'view', label: 'زر عرض المشروع' },
      { kind: 'text', key: 'tabs', label: 'وصف التصنيفات لقارئ الشاشة' },
      { kind: 'text', key: 'emptyTitle', label: 'عنوان التصنيف الفاضي' },
      { kind: 'text', key: 'emptyText', label: 'نص التصنيف الفاضي', rows: 3 },
      { kind: 'text', key: 'emptyAction', label: 'زر عرض كل المشاريع' },
      FILTERS('تصنيفات الصفحة'),
    ],
  },
  {
    key: 'page.contact',
    label: 'صفحة اتصل بنا',
    where: '/contact',
    fields: [
      SEO,
      { kind: 'text', key: 'heading', label: 'عنوان البانر' },
      { kind: 'text', key: 'mapTitle', label: 'وصف الخريطة' },
    ],
  },
  {
    key: 'page.detail',
    label: 'صفحات التفاصيل',
    where: 'كل صفحات الخدمات والمشاريع الفردية',
    fields: [
      { kind: 'text', key: 'servicesCrumb', label: 'مسار التنقل — الخدمات' },
      { kind: 'text', key: 'projectsCrumb', label: 'مسار التنقل — المشاريع' },
      { kind: 'text', key: 'notFoundTitle', label: 'عنوان صفحة غير موجودة' },
      { kind: 'text', key: 'notFoundText', label: 'نص صفحة غير موجودة', rows: 3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// the catalogue
// ---------------------------------------------------------------------------

/** the card as it shows in the listings */
export const SERVICE_FIELDS: Field[] = [
  { kind: 'string', key: 'slug', label: 'المعرّف في الرابط', hint: 'بيظهر في /services/…' },
  CATEGORY,
  { kind: 'media', key: 'icon', label: 'الأيقونة' },
  { kind: 'text', key: 'title', label: 'الاسم' },
  { kind: 'text', key: 'body', label: 'الوصف المختصر', rows: 6 },
  { kind: 'boolean', key: 'has_detail', label: 'ليها صفحة تفاصيل' },
  {
    kind: 'string',
    key: 'external_url',
    label: 'رابط خارجي',
    nullable: true,
    hint: 'لو محطوط، زرار الكرت هيروح للموقع ده',
  },
  { kind: 'boolean', key: 'published', label: 'ظاهرة في الموقع' },
];

export const SERVICE_DETAIL_FIELDS: Field[] = [
  { kind: 'text', key: 'title', label: 'عنوان الصفحة' },
  { kind: 'text', key: 'offerTitle', label: 'عنوان قائمة ما نقدمه' },
  { kind: 'textList', key: 'offers', label: 'ما نقدمه', rows: 2 },
  { kind: 'text', key: 'featuresTitle', label: 'عنوان المميزات' },
  { kind: 'textList', key: 'features', label: 'المميزات', rows: 2 },
  { kind: 'text', key: 'processTitle', label: 'عنوان قسم الخطوات' },
  { kind: 'text', key: 'processLead', label: 'نص قسم الخطوات', hint: 'سيبه فاضي لو مش محتاجه' },
  {
    kind: 'list',
    key: 'steps',
    label: 'الخطوات',
    titleKey: 'title',
    addLabel: 'إضافة خطوة',
    fields: [
      { kind: 'string', key: 'no', label: 'الرقم', hint: 'مثال: 01' },
      { kind: 'text', key: 'title', label: 'العنوان' },
      { kind: 'text', key: 'text', label: 'النص', rows: 3 },
    ],
  },
];

export const PROJECT_FIELDS: Field[] = [
  { kind: 'string', key: 'slug', label: 'المعرّف في الرابط', hint: 'بيظهر في /projects/…' },
  CATEGORY,
  { kind: 'media', key: 'image', label: 'صورة الكرت' },
  { kind: 'text', key: 'tag', label: 'الوسم' },
  { kind: 'text', key: 'title', label: 'الاسم' },
  { kind: 'text', key: 'body', label: 'الوصف المختصر', rows: 6 },
  { kind: 'boolean', key: 'published', label: 'ظاهر في الموقع' },
];

export const PROJECT_DETAIL_FIELDS: Field[] = [
  { kind: 'text', key: 'title', label: 'عنوان الصفحة' },
  { kind: 'media', key: 'image', label: 'صورة الغلاف' },
  { kind: 'text', key: 'aboutTitle', label: 'عنوان نبذة المشروع' },
  { kind: 'text', key: 'aboutText', label: 'نبذة المشروع', rows: 5 },
  { kind: 'textList', key: 'features', label: 'المميزات', rows: 2 },
  { kind: 'text', key: 'infoTitle', label: 'عنوان بطاقة المواصفات' },
  {
    kind: 'list',
    key: 'info',
    label: 'المواصفات',
    titleKey: 'label',
    addLabel: 'إضافة صف',
    fields: [
      { kind: 'text', key: 'label', label: 'البند' },
      { kind: 'text', key: 'value', label: 'القيمة' },
    ],
  },
  {
    kind: 'list',
    key: 'sections',
    label: 'أقسام إضافية',
    titleKey: 'title',
    addLabel: 'إضافة قسم',
    fields: [
      { kind: 'text', key: 'title', label: 'العنوان' },
      { kind: 'text', key: 'text', label: 'النص', rows: 4 },
      { kind: 'textList', key: 'bullets', label: 'النقاط', rows: 2 },
    ],
  },
];

/** the identity block — one row, edited on its own screen */
export const SETTINGS_FIELDS: Field[] = [
  { kind: 'text', key: 'name', label: 'اسم الشركة' },
  { kind: 'string', key: 'legal_name', label: 'الاسم القانوني' },
  {
    kind: 'string',
    key: 'origin',
    label: 'دومين الموقع',
    hint: 'من غير / في الآخر — بيدخل في كل روابط السيو',
  },
  { kind: 'media', key: 'logo', label: 'اللوجو' },
  { kind: 'media', key: 'og_image', label: 'صورة المشاركة الافتراضية' },
  { kind: 'media', key: 'service_cover', label: 'غلاف صفحات الخدمات' },
  { kind: 'string', key: 'phone', label: 'رقم الهاتف' },
  { kind: 'string', key: 'email', label: 'البريد الإلكتروني' },
  { kind: 'text', key: 'city', label: 'المدينة' },
  { kind: 'text', key: 'country', label: 'الدولة' },
  { kind: 'string', key: 'linkedin', label: 'رابط لينكدإن' },
  { kind: 'string', key: 'map_embed', label: 'رابط الخريطة', hint: 'رابط embed من جوجل مابس' },
];
