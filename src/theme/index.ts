import { createTheme } from "@mui/material/styles";

import { dataTableThemeOverrides } from "@/theme/dataTable";

const primary = "#003B6F";
const secondary = "#2EA5A0";

const bodyFontStack =
  'var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const displayFontStack =
  'var(--font-jakarta), var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: primary, contrastText: "#ffffff" },
    secondary: { main: secondary, contrastText: "#ffffff" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
  },
  typography: {
    fontFamily: bodyFontStack,
    h1: { fontFamily: displayFontStack, fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontFamily: displayFontStack, fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontFamily: displayFontStack, fontWeight: 700, letterSpacing: "-0.025em" },
    h4: { fontFamily: displayFontStack, fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontFamily: displayFontStack, fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontFamily: displayFontStack, fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontFamily: displayFontStack, fontWeight: 600 },
    subtitle2: { fontFamily: displayFontStack, fontWeight: 600 },
    overline: { letterSpacing: "0.12em", fontWeight: 700 },
    button: { fontFamily: displayFontStack, textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 20 },
        containedPrimary: { boxShadow: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", margin: "normal", autoComplete: "off" },
    },
    MuiInputBase: {
      defaultProps: { autoComplete: "off" },
    },
    MuiOutlinedInput: {
      defaultProps: { autoComplete: "off" },
      styleOverrides: {
        root: { borderRadius: 10 },
        input: { fontFamily: "inherit" },
        inputMultiline: { fontFamily: "inherit" },
      },
    },
    MuiFilledInput: {
      defaultProps: { autoComplete: "off" },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: ({ theme }) => ({
          "&.MuiInputLabel-shrink": {
            backgroundColor: theme.palette.background.paper,
            paddingInline: theme.spacing(0.75),
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontFamily: "inherit" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, boxShadow: "0 1px 3px rgba(15,23,42,0.08)" },
      },
    },
    ...dataTableThemeOverrides,
  },
});
