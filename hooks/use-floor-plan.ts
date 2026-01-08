import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Floor, Unit, Tenant, Lease, Property } from "@/types";

interface FloorWithUnits extends Floor {
  units: (Unit & { tenant?: Tenant | null; lease?: Lease | null })[];
}

// 物件リストを取得（フロアプラン用）
export function useFloorPlanProperties(companyId: string | undefined) {
  return useQuery({
    queryKey: ["floor-plan-properties", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  });
}

// 特定物件のフロアデータを取得
export function useFloorPlanData(propertyId: string | null) {
  return useQuery({
    queryKey: ["floor-plan-data", propertyId],
    queryFn: async () => {
      if (!propertyId) return { floors: [], property: null };

      const supabase = createClient();
      console.log('[useFloorPlanData] Fetching data for propertyId:', propertyId);

      // 並列でデータを取得
      const [propertyRes, floorsRes, unitsRes, leasesRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).single(),
        supabase
          .from("floors")
          .select("*")
          .eq("property_id", propertyId)
          .order("floor_number", { ascending: true }),
        supabase.from("units").select("*").eq("property_id", propertyId),
        supabase
          .from("leases")
          .select("*, tenant:tenants(*)")
          .eq("status", "active"),
      ]);

      if (propertyRes.error) throw propertyRes.error;

      const property = propertyRes.data as Property;
      const floorsData = floorsRes.data || [];
      const unitsData = unitsRes.data || [];
      const leasesData = leasesRes.data || [];

      console.log('[useFloorPlanData] floorsData:', floorsData);
      console.log('[useFloorPlanData] unitsData:', unitsData);
      console.log('[useFloorPlanData] unitsData count:', unitsData.length);

      // 各ユニットのfloor_idを確認
      unitsData.forEach((unit: Unit) => {
        console.log(`[useFloorPlanData] Unit ${unit.unit_number}: floor_id=${unit.floor_id}`);
      });

      // リースとテナントのマッピング
      const unitLeaseMap: Record<string, { tenant: Tenant; lease: Lease }> = {};
      leasesData.forEach((lease: Lease & { tenant: Tenant }) => {
        if (lease.unit_id) {
          unitLeaseMap[lease.unit_id] = { tenant: lease.tenant, lease };
        }
      });

      // フロアとユニットを結合
      // floor_id がない場合は unit_number の最初の桁からフロアを推測
      const floors: FloorWithUnits[] = floorsData.map((floor: Floor) => {
        const floorUnits = unitsData
          .filter((unit: Unit) => {
            // floor_id がある場合はそれで判定
            if (unit.floor_id) {
              return unit.floor_id === floor.id;
            }
            // floor_id がない場合は unit_number からフロアを推測
            // 例: "101", "102" -> 1F, "201", "202" -> 2F
            const firstDigit = parseInt(unit.unit_number.charAt(0), 10);
            return firstDigit === floor.floor_number;
          })
          .map((unit: Unit) => {
            const leaseInfo = unitLeaseMap[unit.id];
            return {
              ...unit,
              tenant: leaseInfo?.tenant || null,
              lease: leaseInfo?.lease || null,
            };
          });
        console.log(`[useFloorPlanData] Floor ${floor.id} (${floor.floor_number}F): ${floorUnits.length} units`);
        return {
          ...floor,
          units: floorUnits,
        };
      });

      // 未配置の部屋をチェック（どのフロアにも属さない部屋）
      const assignedUnitIds = new Set(floors.flatMap(f => f.units.map(u => u.id)));
      const unassignedUnits = unitsData.filter((unit: Unit) => !assignedUnitIds.has(unit.id));
      console.log('[useFloorPlanData] Unassigned units:', unassignedUnits.length);

      return { floors, property };
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
}

// エクスポート用の型
export type { FloorWithUnits };
