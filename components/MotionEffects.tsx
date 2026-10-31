"use client";

import { useEffect, useRef } from "react";

/** Progressive enhancement: content remains visible without JavaScript. */
export default function MotionEffects() {
  const cursor = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (parseFloat(getComputedStyle(root).fontSize) > 20)
        root.dataset.largeType = "true";
      else delete root.dataset.largeType;
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      delete root.dataset.largeType;
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};

    const setup = () => {
      dispose();
      if (preference.matches) return;

      const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      );
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".section-heading, .experiment, .experience-row, .education-entry, .skill-row, .contact-row",
        ),
      );
      elements.forEach((element) => {
        // Never hide a visible element while hydration is taking place.
        if (element.getBoundingClientRect().top > window.innerHeight) {
          element.classList.add("reveal-pending");
        }
      });
      const revealFrames = new Map<HTMLElement, number>();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            const element = target as HTMLElement;
            element.inert = true;
            element.classList.remove("reveal-pending");
            element.classList.add("is-revealed");
            // Removing the pending class starts the fade. Keep controls inert
            // until the actual painted opacity is readable, not just until
            // the observer has fired (a race on enlarged text layouts).
            const unlock = () => {
              if (parseFloat(getComputedStyle(element).opacity) >= 0.5) {
                element.inert = false;
                revealFrames.delete(element);
              } else revealFrames.set(element, requestAnimationFrame(unlock));
            };
            unlock();
            observer.unobserve(element);
          });
        },
        { threshold: 0, rootMargin: "0px 0px -30px 0px" },
      );
      elements.forEach((element) => observer.observe(element));

      let frame = 0;
      let x = 0;
      let y = 0;
      let pointerVisible = false;
      let card: HTMLElement | null = null;
      let previousCard: HTMLElement | null = null;
      const resetCard = (element: HTMLElement | null) => {
        element?.style.removeProperty("--tilt-x");
        element?.style.removeProperty("--tilt-y");
        element?.classList.remove("pointer-over");
      };
      const render = () => {
        frame = 0;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        progress.current?.style.setProperty(
          "transform",
          `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`,
        );
        if (!finePointer.matches) return;
        if (cursor.current) {
          cursor.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          cursor.current.style.opacity = pointerVisible ? "1" : "0";
        }
        if (previousCard !== card) resetCard(previousCard);
        if (card) {
          const bounds = card.getBoundingClientRect();
          const localX = x - bounds.left;
          const localY = y - bounds.top;
          card.style.setProperty("--pointer-x", `${localX}px`);
          card.style.setProperty("--pointer-y", `${localY}px`);
          card.style.setProperty(
            "--tilt-x",
            `${(0.5 - localY / bounds.height) * 3}deg`,
          );
          card.style.setProperty(
            "--tilt-y",
            `${(localX / bounds.width - 0.5) * 3}deg`,
          );
          card.classList.add("pointer-over");
        }
        previousCard = card;
      };
      const requestFrame = () => {
        if (!frame) frame = requestAnimationFrame(render);
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType === "touch" || !finePointer.matches) return;
        x = event.clientX;
        y = event.clientY;
        pointerVisible = true;
        const target = event.target instanceof Element ? event.target : null;
        card =
          target?.closest<HTMLElement>(
            ".project-piece, .education-card, .experiment",
          ) ?? null;
        cursor.current?.classList.toggle(
          "over-action",
          !!target?.closest("a,button,summary"),
        );
        const magnetic = target?.closest<HTMLElement>(".hero .button");
        document
          .querySelectorAll<HTMLElement>(".hero .button")
          .forEach((button) => {
            const r = button.getBoundingClientRect();
            button.style.setProperty(
              "--magnet-x",
              button === magnetic
                ? `${Math.max(-4, Math.min(4, (x - r.left - r.width / 2) * 0.06))}px`
                : "0px",
            );
            button.style.setProperty(
              "--magnet-y",
              button === magnetic
                ? `${Math.max(-3, Math.min(3, (y - r.top - r.height / 2) * 0.08))}px`
                : "0px",
            );
          });
        requestFrame();
      };
      const leave = () => {
        pointerVisible = false;
        card = null;
        document
          .querySelectorAll<HTMLElement>(".hero .button")
          .forEach((button) => {
            button.style.removeProperty("--magnet-x");
            button.style.removeProperty("--magnet-y");
          });
        requestFrame();
      };
      const focus = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        const element = event.target.closest<HTMLElement>(".reveal-pending");
        if (element) {
          element.style.transition = "none";
          element.classList.remove("reveal-pending");
          void element.offsetWidth;
          element.style.removeProperty("transition");
        }
      };
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      window.addEventListener("blur", leave);
      window.addEventListener("scroll", requestFrame, { passive: true });
      window.addEventListener("resize", requestFrame, { passive: true });
      document.addEventListener("focusin", focus);
      document.addEventListener("visibilitychange", leave);
      requestFrame();

      dispose = () => {
        observer.disconnect();
        revealFrames.forEach((id) => cancelAnimationFrame(id));
        revealFrames.clear();
        elements.forEach((element) => {
          element.inert = false;
        });
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
        window.removeEventListener("blur", leave);
        window.removeEventListener("scroll", requestFrame);
        window.removeEventListener("resize", requestFrame);
        document.removeEventListener("focusin", focus);
        document.removeEventListener("visibilitychange", leave);
        resetCard(previousCard);
        elements.forEach((element) =>
          element.classList.remove("reveal-pending", "is-revealed"),
        );
        if (cursor.current) cursor.current.style.opacity = "0";
      };
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      dispose();
      preference.removeEventListener("change", setup);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" ref={progress} />
    </>
  );
}
