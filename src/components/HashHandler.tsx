import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element matching the URL hash (e.g. /#events) once it is
 * rendered — including when the page is first loaded with a hash, which the
 * browser alone can't do because the content renders after load.
 */
const HashHandler = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    let timer: number | undefined;
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (++tries < 20) timer = window.setTimeout(tick, 150);
    };
    timer = window.setTimeout(tick, 100);
    return () => window.clearTimeout(timer);
  }, [hash, pathname]);

  return null;
};

export default HashHandler;
