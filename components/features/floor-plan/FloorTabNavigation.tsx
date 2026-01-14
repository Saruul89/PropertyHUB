"use client";

import { useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Floor } from "@/types";

type FloorTabNavigationProps = {
  floors: Floor[];
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
  className?: string;
};

export const FloorTabNavigation = ({
  floors,
  selectedFloorId,
  onFloorSelect,
  className,
}: FloorTabNavigationProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);

  const scrollTabs = useCallback((direction: "left" | "right") => {
    scrollContainerRef.current?.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }, []);

  // Scroll selected tab into view when it changes
  useEffect(() => {
    if (selectedTabRef.current) {
      selectedTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedFloorId]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    floorId: string
  ) => {
    const currentIndex = floors.findIndex((f) => f.id === floorId);

    if (e.key === "ArrowRight" && currentIndex < floors.length - 1) {
      e.preventDefault();
      onFloorSelect(floors[currentIndex + 1].id);
    } else if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      onFloorSelect(floors[currentIndex - 1].id);
    }
  };

  if (floors.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={() => scrollTabs("left")}
        className="flex-shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scroll-smooth flex-1 pb-1 scrollbar-hide"
        role="tablist"
        aria-label="Floor selection"
      >
        {floors.map((floor) => {
          const isSelected = selectedFloorId === floor.id;
          return (
            <button
              key={floor.id}
              ref={isSelected ? selectedTabRef : null}
              onClick={() => onFloorSelect(floor.id)}
              onKeyDown={(e) => handleKeyDown(e, floor.id)}
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                "whitespace-nowrap flex-shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm border border-gray-200"
              )}
            >
              {floor.name || `${floor.floor_number}F`}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scrollTabs("right")}
        className="flex-shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};
