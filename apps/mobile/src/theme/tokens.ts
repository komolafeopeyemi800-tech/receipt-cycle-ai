/**
 * Receipt Cycle — brand + professional finance scale (tighter type, white surfaces)
 * Primary teal matches web CSS --primary ≈ #0f766e
 */
export const colors = {
  primary: "#0f766e",
  primaryDark: "#0d5c56",
  teal600: "#0d9488",
  background: "#f8fdfb",
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
  surfaceSoft: "#f3fbfa",
  textPrimary: "#14213a",
  textSecondary: "#475569",
  textMuted: "#718096",
  success: "#07956f",
  danger: "#e11d48",
  warning: "#d97706",
  info: "#2563eb",
  border: "#dbe7ee",
  divider: "#e8eef2",
  mintSoft: "#e9faf5",
  blueSoft: "#e8f3ff",
  roseSoft: "#fff0f4",
  amberSoft: "#fff6e9",
  purpleSoft: "#f5edff",
};

/** Shared mobile scale for this worksheet and subsequent feature screens. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { small: 8, medium: 12, large: 16, extraLarge: 22, pill: 999 } as const;
export const controlHeight = { input: 46, button: 48, touch: 44 } as const;
export const uiType = {
  caption: 11,
  secondary: 12,
  body: 14,
  cardTitle: 14,
  sectionTitle: 16,
  screenTitle: 20,
  amount: 16,
  kpi: 21,
} as const;
export const shadows = {
  card: { shadowColor: "#0f172a", shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  floating: { shadowColor: "#0f766e", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
} as const;

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
