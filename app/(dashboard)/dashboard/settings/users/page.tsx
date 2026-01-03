"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import { Users, Plus, Shield, User } from "lucide-react";

interface CompanyUser {
  id: string;
  user_id: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  user_email?: string;
}

export default function UsersSettingsPage() {
  const { companyId } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchUsers();
    }
  }, [companyId]);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (data) {
      setUsers(data);
    }
    setLoading(false);
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

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Ажилтан нэмэх, засах функц одоогоор хөгжүүлэлтийн шатандаа байна. Удахгүй шинэчлэлтээр нэмэгдэх болно.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ажилтны жагсаалт
          </CardTitle>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Ажилтан нэмэх (бэлтгэгдэж байна)
          </Button>
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
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.user_email ||
                            `Хэрэглэгч ${user.user_id.slice(0, 8)}...`}
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
                      </div>
                      <p className="text-sm text-gray-500">
                        Бүртгүүлсэн:{" "}
                        {new Date(user.created_at).toLocaleDateString("mn-MN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
