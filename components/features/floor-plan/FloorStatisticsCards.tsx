"use client";

import { Card } from "@/components/ui/card";
import { Home, Maximize2, DoorOpen, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusCounts = {
  vacant: number;
  occupied: number;
  maintenance: number;
  reserved: number;
};

type FloorStatisticsCardsProps = {
  totalUnits: number;
  totalArea: number;
  statusCounts: StatusCounts;
  className?: string;
};

type StatConfig = {
  key: string;
  label: string;
  icon: typeof Home;
  bgClass: string;
  textClass: string;
  borderClass: string;
  suffix?: string;
};

const STAT_CONFIG: StatConfig[] = [
  {
    key: "total",
    label: "Нийт өрөө",
    icon: Home,
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
  },
  {
    key: "area",
    label: "Нийт талбай",
    icon: Maximize2,
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-200",
    suffix: "m²",
  },
  {
    key: "vacant",
    label: "Сул өрөө",
    icon: DoorOpen,
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  {
    key: "occupied",
    label: "Эзэмшигчтэй",
    icon: Users,
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-200",
  },
  {
    key: "maintenance",
    label: "Засвартай",
    icon: Wrench,
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-200",
  },
];

export const FloorStatisticsCards = ({
  totalUnits,
  totalArea,
  statusCounts,
  className,
}: FloorStatisticsCardsProps) => {
  const getValue = (key: string): string => {
    switch (key) {
      case "total":
        return String(totalUnits);
      case "area":
        return totalArea.toFixed(1);
      case "vacant":
        return String(statusCounts.vacant);
      case "occupied":
        return String(statusCounts.occupied);
      case "maintenance":
        return String(statusCounts.maintenance);
      default:
        return "0";
    }
  };

  return (
    <div
      className={cn(
        "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        className
      )}
    >
      {STAT_CONFIG.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.key}
            className={cn(
              "p-3 transition-all duration-200 hover:shadow-sm border",
              stat.bgClass,
              stat.borderClass
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center bg-white/60"
                )}
              >
                <Icon className={cn("h-5 w-5", stat.textClass)} />
              </div>
              <div>
                <div className={cn("text-xl font-bold", stat.textClass)}>
                  {getValue(stat.key)}
                  {stat.suffix && (
                    <span className="text-sm font-normal ml-0.5">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
