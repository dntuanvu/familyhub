import { StyleSheet } from "react-native";

export const colors = {
  bg: "#fff7ed",
  panel: "#ffffff",
  card: "#ffffff",
  fg: "#1f2937",
  muted: "#6b7280",
  accent: "#ec4899",
  happy: "#22c55e",
  sun: "#fbbf24",
  sky: "#0ea5e9",
  danger: "#ef4444",
  border: "#fde68a",
  chipBg: "#ffffff",
};

export const t = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h1: { color: colors.fg, fontSize: 28, fontWeight: "800", marginBottom: 10 },
  h2: { color: colors.fg, fontSize: 20, fontWeight: "800", marginBottom: 8, marginTop: 12 },

  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  kidCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },

  input: {
    backgroundColor: "#fff",
    color: colors.fg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  bigButton: {
    backgroundColor: colors.accent,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  bigButtonText: { color: "#fff", fontWeight: "800", fontSize: 20 },

  happy: { backgroundColor: colors.happy },
  danger: { backgroundColor: colors.danger },
  sun: { backgroundColor: colors.sun },

  ghost: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#e5e7eb" },
  ghostText: { color: colors.fg, fontWeight: "800", fontSize: 16 },

  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontWeight: "800", fontSize: 15, color: colors.fg },
  chipOnText: { color: "#fff" },

  text: { color: colors.fg, fontSize: 16, fontWeight: "600" },
  title: { color: colors.fg, fontSize: 20, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  big: { fontSize: 42, fontWeight: "800", color: colors.sun },

  starPill: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  starPillText: { color: "#b45309", fontWeight: "800", fontSize: 16 },

  progressTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.happy,
  },

  err: {
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    fontWeight: "700",
  },
});
