import type { UnitStatus } from "@/types";

export const UNIT_STATUS = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  RESERVED: "reserved",
} as const;

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  vacant: "Сул",
  occupied: "Эзэмшигчтэй",
  maintenance: "Засвартай",
  reserved: "Захиалсан",
};

export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  vacant: "bg-blue-100 text-blue-800",
  occupied: "bg-green-100 text-green-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  reserved: "bg-purple-100 text-purple-800",
};
