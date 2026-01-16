"use client";

import { FloorElementType, ElementDirection } from "@/types";

type FloorElementIconProps = {
  type: FloorElementType;
  direction: ElementDirection;
  size?: number;
  className?: string;
};

const DIRECTION_ROTATION: Record<ElementDirection, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

export const FloorElementIcon = ({
  type,
  direction,
  size = 40,
  className = "",
}: FloorElementIconProps) => {
  const rotation = DIRECTION_ROTATION[direction];

  const renderIcon = () => {
    switch (type) {
      case "door":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Door frame */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="2"
              stroke="#8B4513"
              strokeWidth="2"
              fill="#DEB887"
            />
            {/* Door panel */}
            <rect x="10" y="10" width="20" height="20" fill="#CD853F" />
            {/* Door handle */}
            <circle cx="26" cy="20" r="2" fill="#FFD700" />
            {/* Direction arrow */}
            <path
              d="M20 2 L24 8 L16 8 Z"
              fill="#4CAF50"
              stroke="#2E7D32"
              strokeWidth="1"
            />
          </svg>
        );

      case "window":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Window frame */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="1"
              stroke="#5D4037"
              strokeWidth="2"
              fill="#E3F2FD"
            />
            {/* Vertical divider */}
            <line x1="20" y1="5" x2="20" y2="35" stroke="#5D4037" strokeWidth="2" />
            {/* Horizontal divider */}
            <line x1="5" y1="20" x2="35" y2="20" stroke="#5D4037" strokeWidth="2" />
            {/* Glass reflection */}
            <path d="M8 8 L12 12" stroke="#BBDEFB" strokeWidth="1" />
            <path d="M23 8 L27 12" stroke="#BBDEFB" strokeWidth="1" />
            {/* Direction indicator */}
            <path
              d="M20 2 L24 8 L16 8 Z"
              fill="#2196F3"
              stroke="#1565C0"
              strokeWidth="1"
            />
          </svg>
        );

      case "stairs":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Background */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="2"
              fill="#E0E0E0"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            {/* Stairs steps */}
            <rect x="8" y="28" width="24" height="4" fill="#757575" />
            <rect x="8" y="22" width="20" height="4" fill="#757575" />
            <rect x="8" y="16" width="16" height="4" fill="#757575" />
            <rect x="8" y="10" width="12" height="4" fill="#757575" />
            {/* Direction arrow */}
            <path
              d="M30 10 L34 16 L26 16 Z"
              fill="#FF9800"
              stroke="#E65100"
              strokeWidth="1"
            />
          </svg>
        );

      case "elevator":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Elevator shaft */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="2"
              fill="#424242"
              stroke="#212121"
              strokeWidth="2"
            />
            {/* Elevator doors */}
            <rect x="8" y="8" width="11" height="24" fill="#616161" />
            <rect x="21" y="8" width="11" height="24" fill="#616161" />
            {/* Door gap */}
            <line x1="19.5" y1="8" x2="19.5" y2="32" stroke="#212121" strokeWidth="1" />
            {/* Up/Down arrows */}
            <path d="M20 12 L23 16 L17 16 Z" fill="#4CAF50" />
            <path d="M20 28 L23 24 L17 24 Z" fill="#F44336" />
            {/* EV label */}
            <text
              x="20"
              y="22"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="6"
              fontWeight="bold"
            >
              EV
            </text>
          </svg>
        );

      case "compass":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Compass circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="#FAFAFA"
              stroke="#424242"
              strokeWidth="2"
            />
            {/* Inner circle */}
            <circle cx="20" cy="20" r="3" fill="#424242" />
            {/* North arrow (red) */}
            <path d="M20 4 L23 18 L20 15 L17 18 Z" fill="#E53935" />
            {/* South arrow (white/gray) */}
            <path d="M20 36 L23 22 L20 25 L17 22 Z" fill="#9E9E9E" />
            {/* East arrow */}
            <path d="M36 20 L22 17 L25 20 L22 23 Z" fill="#9E9E9E" />
            {/* West arrow */}
            <path d="M4 20 L18 17 L15 20 L18 23 Z" fill="#9E9E9E" />
            {/* Direction labels */}
            <text x="20" y="10" textAnchor="middle" fill="#E53935" fontSize="5" fontWeight="bold">N</text>
            <text x="20" y="34" textAnchor="middle" fill="#616161" fontSize="5" fontWeight="bold">S</text>
            <text x="32" y="22" textAnchor="middle" fill="#616161" fontSize="5" fontWeight="bold">E</text>
            <text x="8" y="22" textAnchor="middle" fill="#616161" fontSize="5" fontWeight="bold">W</text>
          </svg>
        );

      case "toilet":
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Background */}
            <rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="4"
              fill="#E3F2FD"
              stroke="#1976D2"
              strokeWidth="2"
            />
            {/* Toilet bowl (top view) */}
            <ellipse cx="20" cy="22" rx="10" ry="8" fill="#FFFFFF" stroke="#1976D2" strokeWidth="1.5" />
            {/* Inner bowl */}
            <ellipse cx="20" cy="23" rx="6" ry="5" fill="#E1F5FE" stroke="#42A5F5" strokeWidth="1" />
            {/* Tank */}
            <rect x="12" y="8" width="16" height="6" rx="2" fill="#FFFFFF" stroke="#1976D2" strokeWidth="1.5" />
            {/* Flush button */}
            <circle cx="20" cy="11" r="2" fill="#42A5F5" />
            {/* Direction indicator */}
            <path
              d="M20 2 L24 6 L16 6 Z"
              fill="#1976D2"
              stroke="#0D47A1"
              strokeWidth="0.5"
            />
          </svg>
        );

      default:
        return null;
    }
  };

  return <div className={className}>{renderIcon()}</div>;
};

export const ELEMENT_TYPE_LABELS: Record<FloorElementType, string> = {
  door: "Хаалга",
  window: "Цонх",
  stairs: "Шат",
  elevator: "Цахилгаан шат",
  compass: "Зүг чиг",
  toilet: "Ариун цэврийн өрөө",
};

export const DIRECTION_LABELS: Record<ElementDirection, string> = {
  north: "Хойд",
  south: "Өмнөд",
  east: "Зүүн",
  west: "Баруун",
};
