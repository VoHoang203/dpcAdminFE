"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  ShieldBan,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AccountFormDialog from "@/components/workspace/AccountFormDialog";
import BanConfirmDialog from "@/components/workspace/BanConfirmDialog";
import { adminUserService } from "@/services/adminUserService";

interface Account {
  id: string;
  username: string;
  email: string;
  roleName: string;
  status: "active" | "banned";
}

const ROLE_LABEL: Record<string, string> = {
  PARTY_MEMBER: "Đảng viên",
  OUTSTANDING_INDIVIDUAL: "Quần chúng ưu tú",
  COMMITTEE: "Chi ủy viên",
  DEPUTY_SECRETARY: "Phó Bí thư",
  SECRETARY: "Bí thư",
  ADMIN: "Admin",
};

const ROLE_OPTIONS = Object.entries(ROLE_LABEL);

const mockAccounts: Account[] = [
  {
    id: "1",
    username: "nguyenvanb",
    email: "nguyenvanb@email.com",
    roleName: "PARTY_MEMBER",
    status: "active",
  },
  {
    id: "2",
    username: "tranthic",
    email: "tranthic@email.com",
    roleName: "PARTY_MEMBER",
    status: "active",
  },
  {
    id: "3",
    username: "levand_qcut",
    email: "levand@email.com",
    roleName: "OUTSTANDING_INDIVIDUAL",
    status: "active",
  },
  {
    id: "4",
    username: "phamthie",
    email: "phamthie@email.com",
    roleName: "PARTY_MEMBER",
    status: "banned",
  },
  {
    id: "5",
    username: "hoangvanf",
    email: "hoangvanf@email.com",
    roleName: "COMMITTEE",
    status: "active",
  },
  {
    id: "6",
    username: "dangvang",
    email: "dangvang@email.com",
    roleName: "DEPUTY_SECRETARY",
    status: "active",
  },
  {
    id: "7",
    username: "buithih",
    email: "buithih@email.com",
    roleName: "SECRETARY",
    status: "active",
  },
  {
    id: "8",
    username: "vothii",
    email: "vothii@email.com",
    roleName: "PARTY_MEMBER",
    status: "active",
  },
  {
    id: "9",
    username: "ngothik",
    email: "ngothik@email.com",
    roleName: "PARTY_MEMBER",
    status: "banned",
  },
  {
    id: "10",
    username: "dothil",
    email: "dothil@email.com",
    roleName: "OUTSTANDING_INDIVIDUAL",
    status: "active",
  },
  {
    id: "11",
    username: "lythim",
    email: "lythim@email.com",
    roleName: "COMMITTEE",
    status: "active",
  },
  {
    id: "12",
    username: "tranvann",
    email: "tranvann@email.com",
    roleName: "PARTY_MEMBER",
    status: "active",
  },
];

const PAGE_SIZE = 3;

const AccountSkeleton = () => (
  <div className="space-y-0">
    {[...Array(PAGE_SIZE)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between border-b p-4 last:border-b-0"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="space-y-2 p-4 text-center">
          <Skeleton className="mx-auto h-8 w-12" />
          <Skeleton className="mx-auto h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const AccountManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = (await adminUserService.getUsers({
        page: 1,
        limit: 10,
      })) as {
        data?: {
          data?: { items?: unknown[] };
          items?: unknown[];
        };
      };
      const items =
        response?.data?.data?.items ??
        response?.data?.items ??
        response?.data ??
        [];

      const mapped: Account[] = Array.isArray(items)
        ? items.map((item) => {
            const account = item as {
              id?: string;
              userId?: string;
              _id?: string;
              username?: string;
              fullName?: string;
              name?: string;
              email?: string;
              phone?: string;
              role?: { name?: string; code?: string };
              roleName?: string;
              active?: boolean;
              createdAt?: string;
            };
            return {
              id:
                account.id ??
                account.userId ??
                account._id ??
                String(Math.random()),
              username: account.username ?? account.fullName ?? account.name ?? "—",
              email: account.email ?? "—",
              roleName:
                account.role?.name ??
                account.roleName ??
                account.role?.code ??
                "PARTY_MEMBER",
              status: account.active === false ? "banned" : "active",
            };
          })
        : [];

      setAccounts(mapped.length ? mapped : mockAccounts);
    } catch {
      setAccounts(mockAccounts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || a.roleName === roleFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCreate = () => {
    setFormMode("create");
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleEdit = (account: Account) => {
    setFormMode("edit");
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    username: string;
    email: string;
    roleName: string;
  }) => {
    if (formMode === "create") {
      await adminUserService.createAccount(data);
      await fetchAccounts();
      return;
    }

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === editingAccount?.id
          ? { ...account, ...data }
          : account
      )
    );
  };

  const handleBanClick = (account: Account) => {
    setBanTarget(account);
    setBanDialogOpen(true);
  };

  const handleBanConfirm = () => {
    if (!banTarget) return;
    const newStatus = banTarget.status === "banned" ? "active" : "banned";
    setAccounts((prev) =>
      prev.map((a) => (a.id === banTarget.id ? { ...a, status: newStatus } : a))
    );
    toast.success(
      newStatus === "banned"
        ? `Đã khóa tài khoản ${banTarget.username}`
        : `Đã mở khóa tài khoản ${banTarget.username}`
    );
    setBanDialogOpen(false);
    setBanTarget(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users className="h-6 w-6 text-primary" />
            Quản lý tài khoản
          </h1>
          <p className="text-muted-foreground">
            Quản lý username, email và vai trò
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Lọc theo vai trò" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {ROLE_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="banned">Bị khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filteredAccounts.length}</p>
              <p className="text-xs text-muted-foreground">Tổng tài khoản</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredAccounts.filter((a) => a.status === "active").length}
              </p>
              <p className="text-xs text-muted-foreground">Hoạt động</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {filteredAccounts.filter((a) => a.status === "banned").length}
              </p>
              <p className="text-xs text-muted-foreground">Bị khóa</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <AccountSkeleton />
          ) : paginatedAccounts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Không tìm thấy tài khoản phù hợp
            </div>
          ) : (
            paginatedAccounts.map((account, index) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-4 ${
                  index < paginatedAccounts.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {account.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.username}</p>
                      <Badge
                        variant="default"
                        className={
                          account.status === "active"
                            ? ""
                            : "bg-destructive text-destructive-foreground"
                        }
                      >
                        {account.status === "active" ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{account.email}</span>
                      <Badge variant="outline">
                        {ROLE_LABEL[account.roleName] || account.roleName}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(account)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={
                      account.status === "banned"
                        ? "text-green-600"
                        : "text-destructive"
                    }
                    onClick={() => handleBanClick(account)}
                  >
                    {account.status === "banned" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldBan className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>

        {!isLoading && filteredAccounts.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage}/{totalPages} · {filteredAccounts.length} tài khoản
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  size="icon"
                  variant={page === currentPage ? "default" : "outline"}
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={
          editingAccount
            ? {
                username: editingAccount.username,
                email: editingAccount.email,
                roleName: editingAccount.roleName,
              }
            : undefined
        }
        onSubmit={handleFormSubmit}
      />

      {banTarget && (
        <BanConfirmDialog
          open={banDialogOpen}
          onOpenChange={setBanDialogOpen}
          accountName={banTarget.username}
          isBanned={banTarget.status === "banned"}
          onConfirm={handleBanConfirm}
        />
      )}
    </div>
  );
};

export default AccountManagement;
