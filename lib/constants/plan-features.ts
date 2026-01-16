import type {
  FeaturePreset,
  PlanConfig,
  SubscriptionPlan,
} from "@/types/admin";

// プラン別デフォルト機能設定
export const PLAN_FEATURE_PRESETS: Record<SubscriptionPlan, FeaturePreset> = {
  starter: {
    multi_property: false,
    floor_plan: false,
    meter_readings: false,
    variable_fees: false,
    custom_fee_types: true,
    lease_management: false,
    lease_documents: false,
    maintenance_basic: false,
    maintenance_vendor: false,
    tenant_portal: false,
    tenant_meter_submit: false,
    email_notifications: true,
    sms_notifications: false,
    reports_advanced: true,
    api_access: false,
  },
  basic: {
    multi_property: false,
    floor_plan: true,
    meter_readings: true,
    variable_fees: true,
    custom_fee_types: true,
    lease_management: true,
    lease_documents: false,
    maintenance_basic: false,
    maintenance_vendor: false,
    tenant_portal: false,
    tenant_meter_submit: false,
    email_notifications: true,
    sms_notifications: false,
    reports_advanced: true,
    api_access: false,
  },
  pro: {
    multi_property: true,
    floor_plan: true,
    meter_readings: true,
    variable_fees: true,
    custom_fee_types: true,
    lease_management: true,
    lease_documents: true,
    maintenance_basic: true,
    maintenance_vendor: true,
    tenant_portal: true,
    tenant_meter_submit: true,
    email_notifications: true,
    sms_notifications: true,
    reports_advanced: true,
    api_access: false,
  },
  enterprise: {
    multi_property: true,
    floor_plan: true,
    meter_readings: true,
    variable_fees: true,
    custom_fee_types: true,
    lease_management: true,
    lease_documents: true,
    maintenance_basic: true,
    maintenance_vendor: true,
    tenant_portal: true,
    tenant_meter_submit: true,
    email_notifications: true,
    sms_notifications: true,
    reports_advanced: true,
    api_access: true,
  },
};

// プラン別リミット設定
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanConfig> = {
  starter: { max_properties: 1, max_units: 50, price: 20 },
  basic: { max_properties: 1, max_units: 150, price: 50 },
  pro: { max_properties: 3, max_units: 500, price: 100 },
  enterprise: { max_properties: -1, max_units: -1, price: 0 },
};

// プラン名（表示用）
export const PLAN_NAMES: Record<
  SubscriptionPlan,
  { name: string; nameEn: string }
> = {
  starter: { name: "Starter", nameEn: "Жижиг" },
  basic: { name: "Basic", nameEn: "Үндсэн" },
  pro: { name: "Pro", nameEn: "Мэргэжлийн" },
  enterprise: { name: "Enterprise", nameEn: "Байгууллага" },
};

// 機能名（表示用）
export const FEATURE_LABELS: Record<keyof FeaturePreset, string> = {
  multi_property: "Олон барилга удирдлага",
  floor_plan: "Давхрын зураг",
  meter_readings: "Тоолуурын бүртгэл",
  variable_fees: "Хувьсах төлбөр",
  custom_fee_types: "Төлбөрийн төрөл тохируулах",
  lease_management: "Гэрээний удирдлага",
  lease_documents: "Гэрээний баримт бичиг",
  maintenance_basic: "Үндсэн засвар",
  maintenance_vendor: "Гүйцэтгэгч удирдлага",
  tenant_portal: "Түрээслэгчийн портал",
  tenant_meter_submit: "Тоолуур илгээх",
  email_notifications: "Имэйл мэдэгдэл",
  sms_notifications: "SMS мэдэгдэл",
  reports_advanced: "Дэлгэрэнгүй тайлан",
  api_access: "API холболт",
};

// すべてのプラン
export const ALL_PLANS: SubscriptionPlan[] = [
  "starter",
  "basic",
  "pro",
  "enterprise",
];

// 機能がどのプランから利用可能かを取得
export function getFeatureMinPlan(
  featureKey: keyof FeaturePreset
): SubscriptionPlan {
  for (const plan of ALL_PLANS) {
    if (PLAN_FEATURE_PRESETS[plan][featureKey]) {
      return plan;
    }
  }
  return "enterprise";
}
