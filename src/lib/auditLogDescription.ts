const ENTITY_VI: Record<string, string> = {
  auth: "xác thực",
  handbooks: "sổ tay / handbook",
  meetings: "cuộc họp",
  party_members: "đảng viên",
  users: "người dùng",
  documents: "tài liệu",
  annual_assessments: "đánh giá hằng năm",
  party_fees: "đảng phí",
  commendations: "khen thưởng",
  disciplines: "kỷ luật",
};

function entityLabel(name: string) {
  return ENTITY_VI[name] ?? name;
}

function pickString(obj: unknown, key: string): string | null {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function apiVerbVi(verb: string): string {
  switch (verb) {
    case "GET":
      return "Truy vấn";
    case "POST":
      return "Gửi yêu cầu";
    case "PATCH":
      return "Cập nhật một phần";
    case "PUT":
      return "Cập nhật";
    case "DELETE":
      return "Xóa";
    default:
      return "Gọi API";
  }
}

/**
 * Chuyển payload nhật ký thành mô tả ngắn, dễ đọc (không hiển thị JSON thô).
 */
export function describeAuditLogEntry(entry: {
  actionType: string;
  entityName: string;
  entityId: string;
  details: Record<string, unknown>;
}): string {
  const { actionType, entityName, entityId, details } = entry;
  const d = details ?? {};

  const statusObj = d.status;
  if (
    statusObj &&
    typeof statusObj === "object" &&
    statusObj !== null &&
    "old" in statusObj &&
    "new" in statusObj
  ) {
    const { old, new: newVal } = statusObj as { old: unknown; new: unknown };
    const focus =
      actionType.includes("MEETING") || entityName === "meetings"
        ? "Cập nhật cuộc họp"
        : "Thay đổi trạng thái";
    return `${focus}: từ «${String(old)}» sang «${String(newVal)}».`;
  }

  if (actionType.startsWith("API_")) {
    const verb = actionType.replace("API_", "");
    const url = typeof d.url === "string" ? d.url : "";
    const statusCode = d.statusCode;
    const durationMs = d.durationMs;
    const body = d.body;

    let sentence = "";

    if (entityName === "auth") {
      if (url.includes("signin")) {
        const user = pickString(body, "username");
        sentence = user
          ? `Đăng nhập hệ thống (tài khoản: ${user}).`
          : "Đăng nhập hệ thống.";
      } else if (url.includes("refresh")) {
        sentence = "Làm mới phiên làm việc (token).";
      } else if (url.includes("signout") || url.includes("logout")) {
        sentence = "Đăng xuất hoặc kết thúc phiên.";
      } else {
        sentence = `Thao tác ${entityLabel("auth")}${url ? ` tại ${url}` : ""}.`;
      }
    } else if (entityName === "handbooks") {
      const title = pickString(body, "title");
      sentence = title
        ? `Cập nhật mục sổ tay «${title}».`
        : `Cập nhật ${entityLabel("handbooks")}.`;
    } else {
      const method = apiVerbVi(verb);
      const ent = entityLabel(entityName);
      sentence = `${method} ${ent}${url ? ` (${url})` : ""}.`;
    }

    const tail: string[] = [];
    if (statusCode !== undefined && statusCode !== null) {
      tail.push(`Phản hồi HTTP ${String(statusCode)}`);
    }
    if (typeof durationMs === "number" && Number.isFinite(durationMs)) {
      if (durationMs < 1000) {
        tail.push(`thời gian xử lý ${Math.round(durationMs)} ms`);
      } else {
        tail.push(`thời gian xử lý ${(durationMs / 1000).toFixed(1)} s`);
      }
    }
    if (tail.length) {
      sentence = `${sentence} ${tail.join(", ")}.`;
    } else if (!sentence.endsWith(".")) {
      sentence = `${sentence}.`;
    }
    return sentence;
  }

  if (Object.keys(d).length === 0) {
    return `Ghi nhận thao tác «${actionType}» trên ${entityLabel(entityName)}.`;
  }

  return `Thao tác «${actionType}» liên quan ${entityLabel(entityName)}${
    entityId && entityId !== "N/A" ? ` (đối tượng: ${entityId})` : ""
  }.`;
}
