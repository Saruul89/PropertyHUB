"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit2, Trash2, Shield, UserCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import type { SystemAdmin, AdminRole } from "@/types/admin";

const roleLabels: Record<AdminRole, string> = {
  super: "Супер админ",
  admin: "Админ",
  support: "Туслах",
};

const roleBadgeColors: Record<AdminRole, string> = {
  super: "bg-red-100 text-red-800",
  admin: "bg-blue-100 text-blue-800",
  support: "bg-gray-100 text-gray-800",
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<SystemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SystemAdmin | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "admin" as AdminRole,
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "admin" as AdminRole,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        toast.error("Админ авахад алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.name || !formData.password) {
      toast.error("Бүх талбарыг бөглөнө үү");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Админ амжилттай үүсгэлээ");
        setIsCreateDialogOpen(false);
        setFormData({ email: "", name: "", password: "", role: "admin" });
        fetchAdmins();
      } else {
        toast.error(data.error || "Үүсгэхэд алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Админ амжилттай шинэчлэгдлээ");
        setIsEditDialogOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Шинэчлэхэд алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Админ амжилттай устгагдлаа");
        setIsDeleteDialogOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        toast.error(data.error || "Устгахад алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (admin: SystemAdmin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name || "",
      role: admin.role,
      is_active: admin.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (admin: SystemAdmin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const getRoleIcon = (role: AdminRole) => {
    switch (role) {
      case "super":
        return <Shield className="h-4 w-4" />;
      case "admin":
        return <UserCheck className="h-4 w-4" />;
      case "support":
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Админ хэрэглэгчид</h1>
          <p className="text-gray-600">Системийн админ нэмэх, засах, устгах</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Админ нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ админ үүсгэх</DialogTitle>
              <DialogDescription>
                Шинэ системийн админ нэмэх
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Имэйл хаяг</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Нэр</Label>
                <Input
                  id="name"
                  placeholder="Батбаяр"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Нууц үг</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Эрх</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AdminRole) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super">
                      Супер админ - Бүх үйлдэл хийх боломжтой
                    </SelectItem>
                    <SelectItem value="admin">
                      Админ - Компани, захиалга удирдах
                    </SelectItem>
                    <SelectItem value="support">Туслах - Зөвхөн харах</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Цуцлах
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Үүсгэж байна..." : "Үүсгэх"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Эрхийн түвшин</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className={roleBadgeColors.super}>
                <Shield className="mr-1 h-3 w-3" />
                Супер админ
              </Badge>
              <span className="text-sm text-gray-600">
                Бүх үйлдэл, бусад админыг удирдах боломжтой
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={roleBadgeColors.admin}>
                <UserCheck className="mr-1 h-3 w-3" />
                Админ
              </Badge>
              <span className="text-sm text-gray-600">
                Компани, захиалга удирдах, админ нэмэх боломжгүй
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={roleBadgeColors.support}>
                <Eye className="mr-1 h-3 w-3" />
                Туслах
              </Badge>
              <span className="text-sm text-gray-600">Зөвхөн харах, засах боломжгүй</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Админ жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Ачааллаж байна...
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Админ бүртгэгдээгүй байна
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Имэйл</TableHead>
                  <TableHead>Эрх</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Үүсгэсэн огноо</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.name || "-"}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[admin.role]}>
                        {getRoleIcon(admin.role)}
                        <span className="ml-1">{roleLabels[admin.role]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          Идэвхтэй
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Идэвхгүй</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString("mn-MN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDeleteDialog(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Админ засах</DialogTitle>
            <DialogDescription>{selectedAdmin?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Нэр</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Эрх</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: AdminRole) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super">Сүпер админ</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                  <SelectItem value="support">Туслах</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Төлөв</Label>
              <Select
                value={editFormData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    is_active: value === "active",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Идэвхтэй</SelectItem>
                  <SelectItem value="inactive">Идэвхгүй</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Цуцлах
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Админ устгах</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdmin?.name || selectedAdmin?.email} -г устгах уу?
              Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? "Устгаж байна..." : "Устгах"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
