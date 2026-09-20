import { Center } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Clock } from "./components/Clock";

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Center>
        <Clock
          times={["08:00", "12:30", "18:00"]}
          nextIdx={1}
          size={isMobile ? "80%" : 350}
        />
      </Center>
    </>
  );
}

export default App;
