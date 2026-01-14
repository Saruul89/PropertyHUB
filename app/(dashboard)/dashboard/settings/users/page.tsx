"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { useAuth } from "@/hooks";
import {
  useCompanyUsers,
  useCreateCompanyUser,
  useUpdateCompanyUser,
  useDeleteCompanyUser,
} from "@/hooks/queries";
import {
  Users,
  Plus,
  Shield,
  User,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StaffFormDialog, StaffSuccessDialog } from "@/components/features/staff";
import { type CompanyUser } from "@/types/database";
import type { StaffFormData } from "@/lib/validations";

export default function UsersSettingsPage() {
  const { companyId, role } = useAuth();
  const { data: users = [], isLoading: loading } = useCompanyUsers(companyId);
  const createUser = useCreateCompanyUser();
  const updateUser = useUpdateCompanyUser();
  const deleteUser = useDeleteCompanyUser();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<CompanyUser | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<CompanyUser | null>(null);
  const [newStaffData, setNewStaffData] = useState<{
    name: string;
    email: string;
    initialPassword: string;
  } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = role === "company_admin";
  const isSubmitting = createUser.isPending || updateUser.isPending || deleteUser.isPending;

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setIsFormOpen(true);
  };

  const handleEditStaff = (staff: CompanyUser) => {
    setSelectedStaff(staff);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (staff: CompanyUser) => {
    setStaffToDelete(staff);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (data: StaffFormData) => {
    try {
      if (selectedStaff) {
        await updateUser.mutateAsync({ id: selectedStaff.id, data });
        setIsFormOpen(false);
      } else {
        const result = await createUser.mutateAsync(data);
        setNewStaffData({
          name: data.name,
          email: data.email,
          initialPassword: result.initialPassword,
        });
        setIsFormOpen(false);
        setIsSuccessOpen(true);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Алдаа гарлаа");
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteUser.mutateAsync(staffToDelete.id);
      setIsDeleteOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Устгахад алдаа гарлаа");
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyPassword = async (password: string, userId: string) => {
    await navigator.clipboard.writeText(password);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="Ажилтны удирдлага" showBack />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ажилтны жагсаалт
          </CardTitle>
          {isAdmin && (
            <Button onClick={handleAddStaff}>
              <Plus className="h-4 w-4 mr-2" />
              Ажилтан нэмэх
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Бүртгэлтэй ажилтан байхгүй байна
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user.role === "admin" ? "bg-blue-100" : "bg-gray-200"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <Shield className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.user_name || `Хэрэглэгч ${user.user_id.slice(0, 8)}...`}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            user.role === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role === "admin" ? "Админ" : "Ажилтан"}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{user.user_email}</p>
                      {user.user_phone && (
                        <p className="text-sm text-gray-400">{user.user_phone}</p>
                      )}
                      {user.initial_password && isAdmin && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">Анхны нууц үг:</span>
                          <code className="text-xs bg-white px-2 py-0.5 rounded border">
                            {showPasswords[user.id] ? user.initial_password : "••••••••"}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords[user.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => copyPassword(user.initial_password!, user.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedId === user.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditStaff(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Эрхийн хураангуй</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Үйлдэл</th>
                  <th className="text-center py-2 px-3">Админ</th>
                  <th className="text-center py-2 px-3">Ажилтан</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3">Барилга, өрөө, оршин суугчийн удирдлага</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Нэхэмжлэл, тоолуур оруулах</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Тайлан харах</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Ажилтан нэмэх, устгах</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                  <td className="text-center py-2 px-3 text-red-600">✗</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Компанийн тохиргоо өөрчлөх</td>
                  <td className="text-center py-2 px-3 text-green-600">✓</td>
                  <td className="text-center py-2 px-3 text-red-600">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Form Dialog */}
      <StaffFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        staff={selectedStaff}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Success Dialog */}
      {newStaffData && (
        <StaffSuccessDialog
          open={isSuccessOpen}
          onOpenChange={setIsSuccessOpen}
          staffName={newStaffData.name}
          email={newStaffData.email}
          initialPassword={newStaffData.initialPassword}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ажилтан устгах</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{staffToDelete?.user_name}</strong> ажилтныг устгахдаа итгэлтэй
              байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
