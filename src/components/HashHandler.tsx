import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element matching the URL hash (e.g. /#events) once it is
 * rendered — including when the page is first loaded with a hash, which the
 * browser alone can't do because the content renders after load. Re-corrects
 * a few times so late-loading content above doesn't leave the target off-screen.
 */
const HashHandler = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    let settled = 0;
    let timer: number | undefined;
    let el: HTMLElement | null = null;

    const jump = (smooth: boolean) => {
      el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    };

    const check = () => {
      if (!el || !document.contains(el)) return;
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top) > 60) jump(false);
      if (++settled < 4) timer = window.setTimeout(check, 700);
    };

    const tick = () => {
      el = document.getElementById(id);
      if (!el) {
        if (++tries < 20) timer = window.setTimeout(tick, 150);
        return;
      }
      jump(true);
      timer = window.setTimeout(check, 700);
    };

    timer = window.setTimeout(tick, 100);
    return () => window.clearTimeout(timer);
  }, [hash, pathname]);

  return null;
};

export default HashHandler;
