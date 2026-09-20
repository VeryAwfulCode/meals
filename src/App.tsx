import { Alert, Center, Stack } from "@mantine/core";
import { useDisclosure, useInterval, useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { Clock } from "./components/Clock";
import { MealList } from "./components/MealList";
import { MyAppshell } from "./components/MyAppshell";
import { NextMealBanner } from "./components/NextMealBanner";
import { SettingsModal } from "./components/SettingsModal";
import { useStore } from "./store";
import { currentNextIdx } from "./utils";

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);

  const { times, rawTimes, doneMeals, computeError } = useStore();

  // Tick every 30s so nextIdx and countdown stay current without a store change
  const [, setTick] = useState(0);
  useInterval(() => setTick((t) => t + 1), 30000);
  const nextIdx = currentNextIdx(rawTimes, doneMeals);

  return (
    <MyAppshell onSettingsClick={openSettings}>
      <Stack gap="md">
        {computeError && (
          <Alert color="red" variant="light">
            {computeError}
          </Alert>
        )}

        {!computeError && <NextMealBanner nextIdx={nextIdx} />}

        <Center>
          <Clock
            times={times}
            nextIdx={nextIdx}
            size={isMobile ? 240 : 320}
          />
        </Center>

        <MealList nextIdx={nextIdx} />
      </Stack>

      <SettingsModal opened={settingsOpened} onClose={closeSettings} />
    </MyAppshell>
  );
}

export default App;
