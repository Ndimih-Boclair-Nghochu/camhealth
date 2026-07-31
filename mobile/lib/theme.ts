export const colors = {
  navy: "#0f2942",
  navy2: "#173a5e",
  teal: "#1d6f6b",
  tealBright: "#22b8ad",
  accent: "#14b8a6",
  bg: "#eef3f7",
  card: "#ffffff",
  ink: "#16202c",
  sub: "#48566a",
  muted: "#8a97a6",
  line: "#e5ebf1",
  ok: "#1d7d4d",
  okBg: "#e3f4ea",
  warn: "#9a6b00",
  warnBg: "#fdf1dd",
  danger: "#c02c25",
  dangerBg: "#fbe6e5",
  white: "#ffffff",
};

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };

export const shadow = {
  card: {
    shadowColor: "#12314f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#12314f",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};

export const type = {
  h1: { fontSize: 26, fontWeight: "800" as const, color: colors.ink },
  h2: { fontSize: 18, fontWeight: "700" as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  sub: { fontSize: 13, color: colors.sub },
  muted: { fontSize: 12, color: colors.muted },
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
