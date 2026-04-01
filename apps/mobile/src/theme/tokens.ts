/**
 * Receipt Cycle — brand + professional finance scale (tighter type, white surfaces)
 * Primary teal matches web CSS --primary ≈ #0f766e
 */
export const colors = {
  primary: "#0f766e",
  primaryDark: "#0d5c56",
  teal600: "#0d9488",
  background: "#f8fafc",
  surface: "#ffffff",
  gray900: "#0f172a",
  gray800: "#1e293b",
  gray700: "#334155",
  gray600: "#475569",
  gray500: "#64748b",
  gray400: "#94a3b8",
  gray200: "#e2e8f0",
  gray100: "#f1f5f9",
  rose600: "#e11d48",
  green600: "#16a34a",
  blue600: "#2563eb",
  purple600: "#9333ea",
  amber600: "#d97706",
  emerald50: "#ecfdf5",
  teal50: "#f0fdfa",
};

export const gradients = {
  page: [colors.surface, "#f0fdf9", colors.teal50] as const,
  primaryBtn: [colors.primary, colors.teal600] as const,
  heroIcon: [colors.primary, colors.teal600] as const,
};

/** Compact type scale — reference finance apps (11–15 body, tight headers) */
export const type = {
  /** captions, meta */
  xs: 10,
  sm: 11,
  /** secondary labels */
  md: 12,
  /** body, list rows */
  body: 13,
  /** emphasized body */
  bodyStrong: 14,
  /** section titles */
  title: 15,
  /** screen titles */
  headline: 17,
  /** hero numbers only */
  display: 20,
};
