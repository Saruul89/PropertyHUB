import type { CompanyType } from "@/types";

export const PROPERTY_TYPE = {
  APARTMENT: "apartment",
  OFFICE: "office",
} as const;

export const PROPERTY_TYPE_LABELS: Record<CompanyType, string> = {
  apartment: "Орон сууц",
  office: "Оффис",
};

export const PROPERTY_TYPE_COLORS: Record<CompanyType, string> = {
  apartment: "bg-blue-600 text-white",
  office: "bg-purple-600 text-white",
};
