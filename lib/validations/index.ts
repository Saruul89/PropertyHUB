import { z } from "zod";

// Property Schemas
export const propertySchema = z.object({
  name: z.string().min(1, "Барилгын нэр заавал бөглөх ёстой"),
  property_type: z.enum(["apartment", "office"]),
  address: z.string().min(1, "Хаяг заавал бөглөх ёстой"),
  description: z.string().optional(),
  total_floors: z.number().min(1, "Давхар 1-ээс дээш байх ёстой"),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// Unit Schemas
export const unitSchema = z.object({
  unit_number: z.string().min(1, "Өрөөний дугаар заавал бөглөх ёстой"),
  floor: z.number().optional(),
  area_sqm: z.number().positive("Талбай 0-ээс их байх ёстой").optional(),
  rooms: z.number().min(1, "Өрөөний тоо 1-ээс дээш байх ёстой").optional(),
  price_per_sqm: z.number().min(0, "m² үнэ 0-ээс дээш байх ёстой").optional(),
  status: z.enum(["vacant", "occupied", "maintenance", "reserved"]).optional(),
  notes: z.string().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

export const bulkUnitSchema = z
  .object({
    startFloor: z.number().min(1, "Эхлэх давхар 1-ээс дээш байх ёстой"),
    endFloor: z.number().min(1, "Дуусах давхар 1-ээс дээш байх ёстой"),
    unitsPerFloor: z
      .number()
      .min(1, "Давхар тутмын өрөөний тоо 1-ээс дээш байх ёстой"),
    prefix: z.string().optional(),
  })
  .refine((data) => data.endFloor >= data.startFloor, {
    message: "Дуусах давхар эхлэх давхараас их байх ёстой",
    path: ["endFloor"],
  });

export type BulkUnitFormData = z.infer<typeof bulkUnitSchema>;

// Tenant Schemas
export const tenantSchema = z.object({
  name: z.string().min(1, "Нэр заавал бөглөх ёстой"),
  phone: z.string().min(8, "Утасны дугаар 8 оронтой байх ёстой"),
  tenant_type: z.enum(["individual", "company"]),
  company_name: z.string().optional(),
  email: z
    .string()
    .email("Зөв имэйл хаяг оруулна уу")
    .optional()
    .or(z.literal("")),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  unit_id: z.string().optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// Floor Plan Schemas
export const floorSchema = z.object({
  floor_number: z.number().int("Давхар бүхэл тоо байх ёстой"),
  name: z.string().max(100, "Нэр 100 тэмдэгтээс бага байх ёстой").optional(),
  plan_width: z
    .number()
    .min(100, "Өргөн 100px-ээс их байх ёстой")
    .max(2000, "Өргөн 2000px-ээс бага байх ёстой")
    .default(800),
  plan_height: z
    .number()
    .min(100, "Өндөр 100px-ээс их байх ёстой")
    .max(2000, "Өндөр 2000px-ээс бага байх ёстой")
    .default(600),
  plan_image_url: z
    .string()
    .url("Зөв URL оруулна уу")
    .optional()
    .or(z.literal("")),
});

export type FloorFormData = z.infer<typeof floorSchema>;

export const unitPositionSchema = z.object({
  position_x: z.number().min(0, "X координат 0-ээс дээш байх ёстой"),
  position_y: z.number().min(0, "Y координат 0-ээс дээш байх ёстой"),
  width: z.number().min(20, "Өргөн 20px-ээс их байх ёстой"),
  height: z.number().min(20, "Өндөр 20px-ээс их байх ёстой"),
});

export type UnitPositionFormData = z.infer<typeof unitPositionSchema>;

// Lease Management Schemas
export const leaseTermsSchema = z.object({
  rent_increase_rate: z
    .number()
    .min(0, "0-ээс дээш")
    .max(100, "100-аас доош")
    .optional(),
  rent_increase_interval: z
    .number()
    .min(1, "1 сараас дээш")
    .max(60, "60 сараас доош")
    .optional(),
  notice_period_days: z
    .number()
    .min(0, "0 өдрөөс дээш")
    .max(365, "365 өдрөөс доош")
    .optional(),
  renewal_terms: z
    .string()
    .max(1000, "1000 тэмдэгтээс бага байх ёстой")
    .optional(),
  special_conditions: z
    .string()
    .max(2000, "2000 тэмдэгтээс бага байх ёстой")
    .optional(),
});

export type LeaseTermsFormData = z.infer<typeof leaseTermsSchema>;

export const leaseSchema = z.object({
  tenant_id: z.string().uuid("Оршин суугч сонгоно уу"),
  unit_id: z.string().uuid("Өрөө сонгоно уу"),
  start_date: z.string().min(1, "Гэрээ эхлэх огноо заавал бөглөх ёстой"),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0, "Сарын түрээс 0-ээс дээш байх ёстой"),
  deposit: z.number().min(0, "Барьцаа 0-ээс дээш байх ёстой").optional(),
  payment_due_day: z
    .number()
    .min(1, "1-ээс дээш")
    .max(28, "28-аас доош")
    .optional(),
  status: z.enum(["active", "expired", "terminated", "pending"]),
  terms: leaseTermsSchema.optional(),
  notes: z.string().max(1000, "1000 тэмдэгтээс бага байх ёстой").optional(),
});

export type LeaseFormData = z.infer<typeof leaseSchema>;

export const leaseRenewSchema = z.object({
  end_date: z.string().optional(),
  monthly_rent: z
    .number()
    .min(0, "Сарын түрээс 0-ээс дээш байх ёстой")
    .optional(),
  terms: leaseTermsSchema.optional(),
});

export type LeaseRenewFormData = z.infer<typeof leaseRenewSchema>;

// Document Upload Schema
export const documentUploadSchema = z.object({
  description: z.string().max(500, "500 тэмдэгтээс бага байх ёстой").optional(),
  lease_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

// Maintenance Schemas
export const maintenanceSchema = z.object({
  property_id: z.string().uuid("Барилга сонгоно уу"),
  unit_id: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, "Гарчиг заавал бөглөх ёстой")
    .max(255, "255 тэмдэгтээс бага байх ёстой"),
  description: z
    .string()
    .max(2000, "2000 тэмдэгтээс бага байх ёстой")
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  category: z.string().max(100, "100 тэмдэгтээс бага байх ёстой").optional(),
  scheduled_date: z.string().optional(),
  vendor_name: z.string().max(255, "255 тэмдэгтээс бага байх ёстой").optional(),
  vendor_phone: z.string().max(50, "50 тэмдэгтээс бага байх ёстой").optional(),
  estimated_cost: z.number().min(0, "0-ээс дээш байх ёстой").optional(),
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export const maintenanceCompleteSchema = z.object({
  completed_date: z.string().min(1, "Дууссан огноо заавал бөглөх ёстой"),
  actual_cost: z.number().min(0, "0-ээс дээш байх ёстой").optional(),
  notes: z.string().max(1000, "1000 тэмдэгтээс бага байх ёстой").optional(),
});

export type MaintenanceCompleteFormData = z.infer<
  typeof maintenanceCompleteSchema
>;
