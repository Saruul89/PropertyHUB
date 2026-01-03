"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, AlertCircle, Clock } from "lucide-react";

interface PropertyStatsProps {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
}

export function PropertyStats({
  totalUnits,
  occupiedUnits,
  vacantUnits,
  maintenanceUnits,
}: PropertyStatsProps) {
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const stats = [
    {
      label: "Нийт өрөө",
      value: totalUnits,
      icon: Home,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      label: "Эзэмшигчтэй",
      value: occupiedUnits,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Сул өрөө",
      value: vacantUnits,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Засвартай",
      value: maintenanceUnits,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
