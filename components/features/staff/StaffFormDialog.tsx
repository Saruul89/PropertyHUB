"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { staffSchema, type StaffFormData } from "@/lib/validations";
import { type CompanyUser } from "@/types/database";

type StaffFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: CompanyUser | null;
  onSubmit: (data: StaffFormData) => Promise<void>;
  isLoading: boolean;
};

export const StaffFormDialog = ({
  open,
  onOpenChange,
  staff,
  onSubmit,
  isLoading,
}: StaffFormDialogProps) => {
  const isEdit = !!staff;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.user_name || "",
      email: staff?.user_email || "",
      phone: staff?.user_phone || "",
      is_active: staff?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: staff?.user_name || "",
        email: staff?.user_email || "",
        phone: staff?.user_phone || "",
        is_active: staff?.is_active ?? true,
      });
    }
  }, [open, staff, reset]);

  const isActive = watch("is_active");

  const handleFormSubmit = async (data: StaffFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ажилтан засах" : "Ажилтан нэмэх"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Нэр *</Label>
            <Input
              id="name"
              placeholder="Ажилтны нэр"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Имэйл хаяг *</Label>
            <Input
              id="email"
              type="email"
              placeholder="ajiltan@example.com"
              {...register("email")}
              disabled={isLoading || isEdit}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-gray-500">
                Имэйл хаягийг өөрчлөх боломжгүй
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Утасны дугаар</Label>
            <Input
              id="phone"
              placeholder="99001234"
              {...register("phone")}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Идэвхтэй эсэх</Label>
                <p className="text-xs text-gray-500">
                  Идэвхгүй ажилтан нэвтрэх боломжгүй
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
                disabled={isLoading}
              />
            </div>
          )}

          {!isEdit && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Ажилтан нэмсний дараа автоматаар үүссэн нууц үг харагдана.
                Та энэ нууц үгийг ажилтандаа мэдэгдэнэ үү.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Болих
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Хадгалж байна..." : isEdit ? "Хадгалах" : "Нэмэх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
