import { useState, useEffect, useCallback } from "react";

export const useScrollToTop = (threshold = 400) => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const scrolled = window.scrollY > threshold;
      if (scrolled !== showScroll) {
        setShowScroll(scrolled);
      }
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, [showScroll, threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { showScroll, scrollToTop };
};
