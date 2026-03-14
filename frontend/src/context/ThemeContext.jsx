import { createContext, useContext, useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Persist preference across reloads
    return localStorage.getItem("theme") === "dark";
  });
  const toggleRef = useRef(null);

  const toggle = async (val) => {
    if (
      !toggleRef.current ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsDark(val);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setIsDark(val);
      });
    }).ready;

    const { top, left } = toggleRef.current.getBoundingClientRect();
    const x = left;
    const y = top;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, toggleRef }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
