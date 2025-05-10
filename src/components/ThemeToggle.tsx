import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
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
      if (toggleRef.current && !toggleRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    // Add a slight delay before adding the event listener to prevent immediate collapse
    let timeoutId: NodeJS.Timeout;
    if (isExpanded) {
      timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div className="flex justify-end">
      <div 
        ref={toggleRef}
        className={cn(
          "flex items-center bg-pomo-muted/40 backdrop-blur-sm p-1 rounded-lg border border-pomo-muted/50 shadow-sm transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "w-[7.6rem]" : "w-[2.2rem]"
        )}
      >
        {/* All buttons in a consistently spaced row */}
        <div className={cn(
          "grid grid-cols-3 gap-1 w-full",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          {/* Light Theme Button */}
          <div className={cn(
            "transition-all duration-300 ease-in-out transform col-start-1",
            isExpanded 
              ? "translate-x-0 opacity-100 pointer-events-auto" 
              : "-translate-x-4 opacity-0 pointer-events-none"
          )}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleThemeChange("light")}
              className={cn(
                "h-7 w-7 rounded-md transition-all duration-200",
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
          <div className={cn(
            "transition-all duration-300 ease-in-out transform col-start-2",
            isExpanded 
              ? "translate-x-0 opacity-100 pointer-events-auto" 
              : "-translate-x-4 opacity-0 pointer-events-none"
          )}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleThemeChange("system")}
              className={cn(
                "h-7 w-7 rounded-md transition-all duration-200",
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
          <div className={cn(
            "transition-all duration-300 ease-in-out transform col-start-3",
            isExpanded 
              ? "translate-x-0 opacity-100 pointer-events-auto" 
              : "-translate-x-4 opacity-0 pointer-events-none"
          )}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleThemeChange("dark")}
              className={cn(
                "h-7 w-7 rounded-md transition-all duration-200",
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
        
        {/* Single button for collapsed state */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          isExpanded ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(true)}
            className={cn(
              "h-7 w-7 rounded-md transition-all duration-200 bg-pomo-background shadow-sm text-pomo-primary"
            )}
          >
            {getCurrentIcon()}
            <span className="sr-only">Toggle theme options</span>
          </Button>
        </div>
      </div>
    </div>
  );
}