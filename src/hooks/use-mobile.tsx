import * as React from "react"

const MOBILE_BREAKPOINT = 768

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(isMobileDevice() || window.innerWidth < MOBILE_BREAKPOINT)
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkIsMobile)
    checkIsMobile()
    return () => mql.removeEventListener("change", checkIsMobile)
  }, [])

  return !!isMobile
}
