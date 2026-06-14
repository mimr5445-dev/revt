import type { LibraryCatalog } from './types'

// المكتبة السحابية الافتراضية (تُجلب عبر /api/cloud/library)
export const CLOUD_LIBRARY: LibraryCatalog = {
  materials: [
    { id: 'concrete', name: 'خرسانة مسلحة', color: '#9aa3b2', density: 2400, costPerM3: 350 },
    { id: 'brick', name: 'طوب أحمر', color: '#b5651d', density: 1800, costPerM3: 220 },
    { id: 'block', name: 'بلوك أسمنتي', color: '#c7ccd6', density: 1400, costPerM3: 160 },
    { id: 'glass', name: 'زجاج', color: '#7fc7e6', density: 2500, costPerM3: 900 },
    { id: 'wood', name: 'خشب', color: '#a9743b', density: 700, costPerM3: 600 },
    { id: 'steel', name: 'فولاذ', color: '#8b94a3', density: 7850, costPerM3: 2600 },
    { id: 'plaster', name: 'لياسة / جبس', color: '#e8e2d4', density: 1200, costPerM3: 120 },
  ],
  wallTypes: [
    { id: 'wt-block20', name: 'جدار بلوك 20سم', thickness: 0.2, material: 'block' },
    { id: 'wt-block15', name: 'جدار بلوك 15سم', thickness: 0.15, material: 'block' },
    { id: 'wt-brick25', name: 'جدار طوب 25سم', thickness: 0.25, material: 'brick' },
    { id: 'wt-concrete30', name: 'جدار خرساني 30سم', thickness: 0.3, material: 'concrete' },
    { id: 'wt-partition10', name: 'قاطع 10سم', thickness: 0.1, material: 'plaster' },
  ],
  doorTypes: [
    { id: 'dt-single', name: 'باب مفرد 90×210', width: 0.9, height: 2.1 },
    { id: 'dt-double', name: 'باب مزدوج 160×210', width: 1.6, height: 2.1 },
    { id: 'dt-main', name: 'باب رئيسي 120×240', width: 1.2, height: 2.4 },
  ],
  windowTypes: [
    { id: 'wn-100', name: 'نافذة 100×120', width: 1.0, height: 1.2, sill: 0.9 },
    { id: 'wn-150', name: 'نافذة 150×120', width: 1.5, height: 1.2, sill: 0.9 },
    { id: 'wn-strip', name: 'نافذة شريطية 200×60', width: 2.0, height: 0.6, sill: 1.8 },
  ],
}
