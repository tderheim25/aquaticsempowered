export type InspectionChecklistItem = {
  key: string;
  label: string;
};

export type InspectionTemplate = {
  key: string;
  label: string;
  description: string;
  items: InspectionChecklistItem[];
};

export const INSPECTION_TEMPLATES: InspectionTemplate[] = [
  {
    key: "daily_open",
    label: "Daily opening",
    description: "Quick safety and readiness checks before opening.",
    items: [
      { key: "deck_clear", label: "Deck clear of hazards" },
      { key: "signage", label: "Safety signage visible" },
      { key: "rescue_equipment", label: "Rescue equipment accessible" },
      { key: "water_clarity", label: "Water clarity acceptable" },
      { key: "main_drain", label: "Main drain cover secure" },
    ],
  },
  {
    key: "weekly_safety",
    label: "Weekly safety",
    description: "Weekly facility and chemical storage review.",
    items: [
      { key: "chemical_storage", label: "Chemical storage labeled and secure" },
      { key: "sds_available", label: "SDS sheets available" },
      { key: "fence_gates", label: "Fence/gates functional" },
      { key: "emergency_info", label: "Emergency info posted" },
      { key: "logbook_current", label: "Logbook up to date" },
    ],
  },
];

export function getInspectionTemplate(key: string): InspectionTemplate | undefined {
  return INSPECTION_TEMPLATES.find((t) => t.key === key);
}
