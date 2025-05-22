import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner, toast } from "sonner"

// Use Poppins as default font, match border, background, and shadow to design system
type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  // Map our theme format to the format expected by Sonner
  const sonnerTheme = theme === 'system' ? 'system' : theme;

  return (
    <Sonner
      theme={sonnerTheme as ToasterProps["theme"]}
      className="toaster group font-inter font-medium"
      toastOptions={{
        classNames: {
          toast:
            // Card style: rounded, border, bg, shadow, transition
            "text-[13.5px] group toast group-[.toaster]:bg-pomo-background group-[.toaster]:text-pomo-foreground group-[.toaster]:border-pomo-muted/30 group-[.toaster]:border group-[.toaster]:rounded-2xl group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/30 group-[.toaster]:transition-all group-[.toaster]:duration-300 group-[.toaster]:ease-in-out px-6 py-4",
          description: "group-[.toast]:text-pomo-secondary text-[12px] font-medium ",
          actionButton:
            // Primary button style
            "group-[.toast]:bg-pomo-primary/80 group-[.toast]:hover:bg-pomo-primary group-[.toast]:text-pomo-background group-[.toast]:rounded-lg group-[.toast]:transition-colors group-[.toast]:duration-300 px-4 py-2 font-semibold",
          cancelButton:
            // Ghost button style
            "group-[.toast]:bg-pomo-muted/40 group-[.toast]:text-pomo-secondary group-[.toast]:rounded-lg group-[.toast]:transition-colors group-[.toast]:duration-300 px-4 py-2 font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }