import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import {
  createTheme,
  type CSSVariablesResolver,
  MantineProvider,
} from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";
import { catppuccin } from "./catppuccin.ts";

const resolver: CSSVariablesResolver = () => ({
  variables: { "--mantine-color-body": catppuccin.mocha.base },
  light: {},
  dark: {},
});

const theme = createTheme({
  fontFamily: "Space Grotesk, sans-serif",
  primaryShade: 2, // generateColors sets original colors at index 2
  colors: {
    pink: generateColors(catppuccin.mocha.pink),
    red: generateColors(catppuccin.mocha.red),
    yellow: generateColors(catppuccin.mocha.yellow),
    green: generateColors(catppuccin.mocha.green),
    teal: generateColors(catppuccin.mocha.teal),
    blue: generateColors(catppuccin.mocha.blue),
  },
  components: {
    Button: {
      defaultProps: {
        color: "blue",
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={resolver}
      defaultColorScheme="dark"
    >
      <App />
    </MantineProvider>
  </StrictMode>,
);
