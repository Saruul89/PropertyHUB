"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MeterReading, FeeType, Unit, Property } from "@/types";
import { Search, ChevronLeft, ChevronRight, Gauge } from "lucide-react";

export interface MeterReadingWithDetails extends MeterReading {
  fee_type?: FeeType;
  unit?: Unit & { property?: Property };
}

interface MeterReadingListProps {
  readings: MeterReadingWithDetails[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onSearch?: (query: string) => void;
}

export function MeterReadingList({
  readings,
  loading,
  totalCount,
  currentPage,
  itemsPerPage,
  onPageChange,
  onSearch,
}: MeterReadingListProps) {
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  const filteredReadings = search
    ? readings.filter(
        (reading) =>
          reading.unit?.unit_number
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          reading.unit?.property?.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          reading.fee_type?.name.toLowerCase().includes(search.toLowerCase())
      )
    : readings;

  if (loading) {
    return <div className="text-center text-gray-500">Ачааллаж байна...</div>;
  }

  return (
    <div>
      {/* Search */}
      {onSearch && (
        <div className="mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="өрөөний дугаар、物件名で検索..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      {filteredReadings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gauge className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">
              {search
                ? "該当するメーター記録がありません"
                : "メーター記録がありません"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  物件・部屋
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  料金タイプ
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  記録日
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  前回
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  今回
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  使用量
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  金額
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReadings.map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium">
                        {reading.unit?.property?.name}
                      </p>
                      <p className="text-gray-500">
                        {reading.unit?.unit_number}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {reading.fee_type?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(reading.reading_date).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {reading.previous_reading.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {reading.current_reading.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-blue-600">
                      {reading.consumption.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ₮{reading.total_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {totalCount}件中 {currentPage * itemsPerPage + 1} -{" "}
            {Math.min((currentPage + 1) * itemsPerPage, totalCount)}件を表示
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <span className="px-3 text-sm">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage >= totalPages - 1}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
