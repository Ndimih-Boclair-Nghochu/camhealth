import { Dimensions } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const BASE_WIDTH = 390; // iPhone 14 baseline

/** Moderate, clamped responsive scale so the UI adapts to phone size
 *  without distorting on very small or very large screens. */
export function s(n: number) {
  const scaled = (SCREEN_W / BASE_WIDTH) * n;
  return Math.round(Math.min(Math.max(scaled, n * 0.9), n * 1.18));
}
/** Font scale (kept a touch tighter than layout scale). */
export function fs(n: number) {
  const scaled = (SCREEN_W / BASE_WIDTH) * n;
  return Math.round(Math.min(Math.max(scaled, n * 0.95), n * 1.12));
}

export const screenWidth = SCREEN_W;

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
  line: "#e6ecf2",
  ok: "#1d7d4d",
  okBg: "#e3f4ea",
  warn: "#9a6b00",
  warnBg: "#fdf1dd",
  danger: "#c02c25",
  dangerBg: "#fbe6e5",
  white: "#ffffff",
};

export const spacing = {
  xxs: s(4),
  xs: s(8),
  sm: s(12),
  md: s(16),
  lg: s(20),
  xl: s(28),
  xxl: s(40),
};

export const radius = { sm: s(12), md: s(18), lg: s(24), xl: s(30), pill: 999 };

export const shadow = {
  card: {
    shadowColor: "#0f2942",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#0f2942",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};

export const type = {
  display: { fontSize: fs(28), fontWeight: "800" as const, color: colors.ink },
  h1: { fontSize: fs(24), fontWeight: "800" as const, color: colors.ink },
  h2: { fontSize: fs(18), fontWeight: "800" as const, color: colors.ink },
  h3: { fontSize: fs(15.5), fontWeight: "700" as const, color: colors.ink },
  body: { fontSize: fs(14.5), color: colors.ink },
  sub: { fontSize: fs(13), color: colors.sub },
  muted: { fontSize: fs(12), color: colors.muted },
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
