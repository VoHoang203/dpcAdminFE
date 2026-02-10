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

export const mockCurrentUser = {
  id: "mock-user",
  name: "Nguyễn Văn A",
  role: "admin" as UserRole,
};
