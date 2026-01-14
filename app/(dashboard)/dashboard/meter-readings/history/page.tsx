"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth, useFeature } from "@/hooks";
import { MeterReading, FeeType, Unit, Property } from "@/types";
import {
  Gauge,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  History,
} from "lucide-react";

interface MeterReadingWithDetails extends MeterReading {
  fee_type?: FeeType;
  unit?: Unit & { property?: Property };
}

const ITEMS_PER_PAGE = 20;

export default function MeterReadingsHistoryPage() {
  const { companyId } = useAuth();
  const hasMeterReadings = useFeature("meter_readings");
  const [meterReadings, setMeterReadings] = useState<MeterReadingWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string>("");
  const [startMonth, setStartMonth] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 3);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch filter options
  useEffect(() => {
    if (companyId) {
      fetchFilterOptions();
    }
  }, [companyId]);

  // Fetch units when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnits(selectedPropertyId);
    } else {
      setUnits([]);
      setSelectedUnitId("");
    }
  }, [selectedPropertyId]);

  // Fetch meter readings when filters change
  useEffect(() => {
    if (companyId) {
      fetchMeterReadings();
    }
  }, [
    companyId,
    selectedPropertyId,
    selectedUnitId,
    selectedFeeTypeId,
    startMonth,
    endMonth,
    currentPage,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [
    selectedPropertyId,
    selectedUnitId,
    selectedFeeTypeId,
    startMonth,
    endMonth,
  ]);

  const fetchFilterOptions = async () => {
    const supabase = createClient();

    // Fetch properties
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (propertiesData) {
      setProperties(propertiesData);
    }

    // Fetch fee types (metered only)
    const { data: feeTypesData } = await supabase
      .from("fee_types")
      .select("*")
      .eq("company_id", companyId)
      .eq("calculation_type", "metered")
      .eq("is_active", true)
      .order("display_order");

    if (feeTypesData) {
      setFeeTypes(feeTypesData);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("unit_number");

    if (data) {
      setUnits(data);
    }
  };

  const buildQuery = useCallback(
    (supabase: ReturnType<typeof createClient>, forExport = false) => {
      const startDate = `${startMonth}-01`;
      const endDate = new Date(endMonth + "-01");
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().split("T")[0];

      let query = supabase
        .from("meter_readings")
        .select(
          `
                *,
                fee_types(*),
                units!inner(*, properties!inner(*))
            `,
          { count: "exact" }
        )
        .eq("units.properties.company_id", companyId)
        .gte("reading_date", startDate)
        .lt("reading_date", endDateStr)
        .order("reading_date", { ascending: false });

      if (selectedPropertyId) {
        query = query.eq("units.property_id", selectedPropertyId);
      }
      if (selectedUnitId) {
        query = query.eq("unit_id", selectedUnitId);
      }
      if (selectedFeeTypeId) {
        query = query.eq("fee_type_id", selectedFeeTypeId);
      }

      if (!forExport) {
        query = query.range(
          currentPage * ITEMS_PER_PAGE,
          (currentPage + 1) * ITEMS_PER_PAGE - 1
        );
      }

      return query;
    },
    [
      companyId,
      selectedPropertyId,
      selectedUnitId,
      selectedFeeTypeId,
      startMonth,
      endMonth,
      currentPage,
    ]
  );

  const fetchMeterReadings = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error, count } = await buildQuery(supabase);

    if (!error && data) {
      const readings = data.map((r: Record<string, unknown>) => ({
        ...r,
        fee_type: r.fee_types as FeeType | undefined,
        unit: r.units
          ? {
              ...(r.units as Unit),
              property: (r.units as Record<string, unknown>).properties as
                | Property
                | undefined,
            }
          : undefined,
      })) as MeterReadingWithDetails[];
      setMeterReadings(readings);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  const exportToCSV = async () => {
    setExporting(true);
    const supabase = createClient();

    const { data, error } = await buildQuery(supabase, true);

    if (!error && data) {
      const readings = data.map((r: Record<string, unknown>) => ({
        ...r,
        fee_type: r.fee_types as FeeType | undefined,
        unit: r.units
          ? {
              ...(r.units as Unit),
              property: (r.units as Record<string, unknown>).properties as
                | Property
                | undefined,
            }
          : undefined,
      })) as MeterReadingWithDetails[];

      // Create CSV content
      const headers = [
        "Огноо",
        "Барилгын нэр",
        "Өрөөний дугаар",
        "Төлбөрийн төрөл",
        "Өмнөх утга",
        "Одоогийн утга",
        "Хэрэглээ",
        "Дүн",
      ];
      const rows = readings.map((r) => [
        r.reading_date,
        r.unit?.property?.name || "",
        r.unit?.unit_number || "",
        r.fee_type?.name || "",
        r.previous_reading.toString(),
        r.current_reading.toString(),
        r.consumption.toString(),
        r.total_amount.toString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Add BOM for Excel compatibility
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meter-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!hasMeterReadings) {
    return (
      <>
        <Header title="Тоолуурын түүх" />
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Тоолуурын функц идэвхгүй байна</p>
              <p className="text-sm text-gray-500">
                Энэ функцийг идэвхжүүлэхийн тулд админтай холбогдоно уу
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Тоолуурын түүх" />
      <div className="p-4 md:p-6">
        {/* Back Link and Actions */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard/meter-readings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Тоолуур бүртгэл рүү буцах
            </Button>
          </Link>
          <Button
            onClick={exportToCSV}
            disabled={exporting || totalCount === 0}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Экспортлож байна..." : "CSV татах"}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Шүүлтүүр
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Барилга</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Бүгд</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Өрөө</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  disabled={!selectedPropertyId}
                >
                  <option value="">{selectedPropertyId ? "Бүгд" : "Эхлээд барилга сонгоно уу"}</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Төлбөрийн төрөл
                </label>
                <select
                  value={selectedFeeTypeId}
                  onChange={(e) => setSelectedFeeTypeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Бүгд</option>
                  {feeTypes.map((feeType) => (
                    <option key={feeType.id} value={feeType.id}>
                      {feeType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Эхлэх сар
                </label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Дуусах сар
                </label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          {totalCount} түүх олдлоо
        </div>

        {/* Meter Readings Table */}
        {loading ? (
          <div className="text-center text-gray-500">Ачааллаж байна...</div>
        ) : meterReadings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Тохирох түүх олдсонгүй</p>
              <p className="text-sm text-gray-500">
                Шүүлтүүрийн нөхцөлийг өөрчилнө үү
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Огноо
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Барилга・Өрөө
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                    Төлбөрийн төрөл
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Өмнөх
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Одоогийн
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Хэрэглээ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                    Дүн
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {meterReadings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm md:px-6">
                      {new Date(reading.reading_date).toLocaleDateString(
                        "mn-MN"
                      )}
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <div className="text-sm">
                        <p className="font-medium">
                          {reading.unit?.property?.name}
                        </p>
                        <p className="text-gray-500">
                          {reading.unit?.unit_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {reading.fee_type?.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm md:px-6">
                      {reading.previous_reading.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm md:px-6">
                      {reading.current_reading.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right md:px-6">
                      <span className="font-medium text-blue-600">
                        {reading.consumption.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium md:px-6">
                      ₮{reading.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-gray-500">
              Нийт {totalCount}-с {currentPage * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} харуулж байна
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Өмнөх
              </Button>
              <span className="px-3 text-sm">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
              >
                Дараах
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
