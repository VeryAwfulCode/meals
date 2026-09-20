import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  MantineProvider,
  Text,
} from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";
import { catppuccin } from "./catppuccin.ts";
import { StoreProvider } from "./store.tsx";
import { DialogProvider } from "./components/DialogProvider.tsx";

const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: { "--mantine-color-body": catppuccin.latte.base },
  dark: { "--mantine-color-body": catppuccin.mocha.mantle },
});

const theme = createTheme({
  fontFamily: "Space Grotesk, sans-serif",
  primaryShade: 2,
  colors: {
    pink: generateColors(catppuccin.mocha.pink),
    red: generateColors(catppuccin.mocha.red),
    yellow: generateColors(catppuccin.mocha.yellow),
    green: generateColors(catppuccin.mocha.green),
    teal: generateColors(catppuccin.mocha.teal),
    blue: generateColors(catppuccin.mocha.blue),
    dark: [
      catppuccin.mocha.text,
      catppuccin.mocha.subtext1,
      catppuccin.mocha.overlay2,
      catppuccin.mocha.overlay1,
      catppuccin.mocha.surface2,
      catppuccin.mocha.surface1,
      catppuccin.mocha.surface0,
      catppuccin.mocha.base,
      catppuccin.mocha.mantle,
      catppuccin.mocha.crust,
    ] as MantineColorsTuple,
  },
  components: {
    Button: {
      defaultProps: {
        color: "blue",
      },
    },
    Text: Text.extend({
      styles: (_theme, props) =>
        props.variant === "wordmark"
          ? {
              root: {
                fontWeight: 700,
                fontSize: "var(--mantine-font-size-sm)",
                letterSpacing: "0.08em",
              },
            }
          : {},
    }),
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={resolver}
      defaultColorScheme="dark"
    >
      <DialogProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </DialogProvider>
    </MantineProvider>
  </StrictMode>,
);
