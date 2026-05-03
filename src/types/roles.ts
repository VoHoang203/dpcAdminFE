export type UserRole =
  | "dang_vien"
  | "qcut"
  | "chi_uy"
  | "pho_bi_thu"
  | "bi_thu"
  | "admin";

export const roleLabels: Record<UserRole, string> = {
  dang_vien: "Đảng viên",
  qcut: "QCUT",
  chi_uy: "Chi ủy",
  pho_bi_thu: "Phó Bí thư",
  bi_thu: "Bí thư",
  admin: "Admin",
};

export function getRoleLabel(role: UserRole) {
  return roleLabels[role];
}

/** Hiển thị nhãn vai trò khi mã có thể là ADMIN / admin / ... */
export function getRoleDisplayLabel(roleCode: string): string {
  const key = roleCode.toLowerCase();
  if (key === "admin") return roleLabels.admin;
  const matched = (Object.keys(roleLabels) as UserRole[]).find(
    (k) => k === key || k.replace(/_/g, "") === key.replace(/_/g, "")
  );
  return matched ? roleLabels[matched] : roleCode;
}
