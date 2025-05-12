import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    if (theme === 'system') {
      // If system, switch to the opposite of current system preference
      setTheme(isDark ? 'light' : 'dark');
    } else {
      // If already on light/dark, switch to the other
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if T is pressed and no input elements are focused
      if (e.key.toLowerCase() === 't' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [theme]);

  // Get icon based on current theme
  const getCurrentIcon = () => {
    switch (theme) {
      case "light": return <Sun className="h-[0.9rem] w-[0.9rem]" />;
      case "dark": return <Moon className="h-[0.9rem] w-[0.9rem]" />;
      default: return <Monitor className="h-[0.9rem] w-[0.9rem]" />;
    }
  };
  
  // Handle theme selection
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    setIsExpanded(false);
  };
  
  // Close expanded state when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div className="flex justify-center">
      <div 
        ref={containerRef}
        className={cn(
          "bg-pomo-muted/40 backdrop-blur-sm rounded-lg border border-pomo-muted/50 shadow-sm transition-[width] duration-300 ease-in-out overflow-hidden",
          isExpanded ? "w-[7.6rem] p-1" : "w-9 p-1" // Adjusted for consistent padding and width
        )}
      >
        {/* Expanded state */}
        {isExpanded ? (
          <div className="grid grid-cols-3 gap-1 w-full">
            {/* Light Theme Button */}
            <div className="col-start-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleThemeChange("light")}
                className={cn(
                  "h-7 w-7 rounded-md",
                  theme === "light" 
                    ? "bg-pomo-background shadow-sm text-pomo-primary" 
                    : "hover:bg-pomo-muted/70 text-pomo-secondary hover:text-pomo-foreground"
                )}
              >
                <Sun className="h-[0.9rem] w-[0.9rem]" />
                <span className="sr-only">Light theme</span>
              </Button>
            </div>
            
            {/* System Theme Button */}
            <div className="col-start-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleThemeChange("system")}
                className={cn(
                  "h-7 w-7 rounded-md",
                  theme === "system" 
                    ? "bg-pomo-background shadow-sm text-pomo-primary" 
                    : "hover:bg-pomo-muted/70 text-pomo-secondary hover:text-pomo-foreground"
                )}
              >
                <Monitor className="h-[0.9rem] w-[0.9rem]" />
                <span className="sr-only">System theme</span>
              </Button>
            </div>
            
            {/* Dark Theme Button */}
            <div className="col-start-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleThemeChange("dark")}
                className={cn(
                  "h-7 w-7 rounded-md",
                  theme === "dark" 
                    ? "bg-pomo-background shadow-sm text-pomo-primary" 
                    : "hover:bg-pomo-muted/70 text-pomo-secondary hover:text-pomo-foreground"
                )}
              >
                <Moon className="h-[0.9rem] w-[0.9rem]" />
                <span className="sr-only">Dark theme</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-7 w-7 flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExpanded(true)}
              className="h-7 w-7 rounded-md text-pomo-primary"
            >
              {getCurrentIcon()}
              <span className="sr-only">Toggle theme options</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}