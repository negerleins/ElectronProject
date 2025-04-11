import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "../contexts/ThemeContext.jsx";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

function ThemeComponent() {
  const { setTheme, theme } = useTheme();
  const [selectedTheme, selectTheme] = useState(null);
  const [oldTheme, setOldTheme] = useState(null);

  const handleThemeChange = (newTheme) => {
    if (newTheme === theme) {
      selectTheme(null);
      return;
    }

    setOldTheme(theme);
    setTheme(newTheme);
    selectTheme(newTheme);
  };
  const handleThemeApply = () => {
    if (selectedTheme) {
      setTheme(selectedTheme);
      selectTheme(null);
      toast(`Theme changed to ${selectedTheme}`);
    }
  };
  const handleThemeCancel = () => {
    setTheme(oldTheme);
    selectTheme(null);
    toast(`Theme reverted to ${oldTheme}`);
  };

  function Dialog() {
    return (
      <AlertDialog open={!!selectedTheme}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply the {selectedTheme} theme?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleThemeCancel()}>
              Revert
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleThemeApply()}>
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <DropdownMenu>
      {selectedTheme && <Dialog />}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ThemeComponent };
