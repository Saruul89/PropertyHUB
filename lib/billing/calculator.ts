interface CalculateFeeContext {
  unit?: { area_sqm?: number | null };
  meterReading?: { consumption: number; unit_price: number };
  unitFee?: {
    custom_amount?: number | null;
    custom_unit_price?: number | null;
  };
}

interface FeeTypeInput {
  calculation_type: "fixed" | "per_sqm" | "metered" | "custom" | string;
  default_amount?: number | null;
  default_unit_price?: number | null;
}

/**
 * 料金タイプに基づいて金額を計算
 */
export function calculateFeeAmount(
  feeType: FeeTypeInput,
  context: CalculateFeeContext
): number {
  const { unit, meterReading, unitFee } = context;

  switch (feeType.calculation_type) {
    case "fixed": {
      // カスタム金額があればそれを使用、なければデフォルト
      return unitFee?.custom_amount ?? feeType.default_amount ?? 0;
    }

    case "per_sqm": {
      // Талбайがない場合は0
      if (!unit?.area_sqm) return 0;
      const unitPrice =
        unitFee?.custom_unit_price ?? feeType.default_unit_price ?? 0;
      return unit.area_sqm * unitPrice;
    }

    case "metered": {
      // メーター読み取りがない場合は0
      if (!meterReading) return 0;
      return meterReading.consumption * meterReading.unit_price;
    }

    case "custom": {
      // カスタムは手動入力なので0で初期化
      return unitFee?.custom_amount ?? 0;
    }

    default:
      return 0;
  }
}

/**
 * 請求明細の合計金額を計算
 */
export function calculateBillingTotal(
  items: Array<{ amount: number }>
): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * 残高を計算
 */
export function calculateOutstanding(
  totalAmount: number,
  paidAmount: number
): number {
  return Math.max(0, totalAmount - paidAmount);
}

/**
 * 請求ステータスを判定
 */
export function determineBillingStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: Date,
  currentDate: Date = new Date()
): "pending" | "partial" | "paid" | "overdue" {
  if (paidAmount >= totalAmount) {
    return "paid";
  }

  const isPastDue = currentDate > dueDate;

  if (paidAmount > 0) {
    return isPastDue ? "overdue" : "partial";
  }

  return isPastDue ? "overdue" : "pending";
}

/**
 * メーター使用量を計算
 */
export function calculateMeterConsumption(
  currentReading: number,
  previousReading: number
): number {
  if (currentReading < previousReading) {
    throw new Error("Current reading cannot be less than previous reading");
  }
  return currentReading - previousReading;
}

/**
 * 入居率を計算（パーセント）
 */
export function calculateOccupancyRate(
  occupiedUnits: number,
  totalUnits: number
): number {
  if (totalUnits === 0) return 0;
  return Math.round((occupiedUnits / totalUnits) * 100);
}
