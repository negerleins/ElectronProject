import { useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import "./styles/app.css";
import { ThemeContext } from "./contexts/ThemeContext";

function App() {
  const { theme, setTheme } = useContext(ThemeContext);

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };

  const [count, setCount] = useState(0);

  useEffect(() => {
    window.electron.subscribeStatisttics((stats) =>
      console.log("Statistics:", stats)
    );
  }, []);

  return (
    <div className={`app ${theme}`}>
      <select value={theme} onChange={handleThemeChange}>
        <option value="light">Light Mode</option>
        <option value="dark">Dark Mode</option>
        <option value="system">System Preference</option>
      </select>
      <div className="flex flex-col items-center justify-center min-h-svh">
        <div className="card">
          <Button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </Button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  );
}

export default App;
