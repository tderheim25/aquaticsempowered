import { createTheme } from "@mui/material/styles";

const primary = "#003B6F";
const secondary = "#2EA5A0";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: primary, contrastText: "#ffffff" },
    secondary: { main: secondary, contrastText: "#ffffff" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
  },
  typography: {
    fontFamily:
      'var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
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
      defaultProps: { variant: "outlined", margin: "normal" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
        input: { fontFamily: "inherit" },
        inputMultiline: { fontFamily: "inherit" },
      },
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
  },
});
