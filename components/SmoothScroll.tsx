"use client";

import { useEffect } from "react";
import { cameraPose, publishSceneMotion } from "@/lib/scene-motion";

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 1000px), (max-height: 800px)");
    let dispose = () => {};
    let generation = 0;
    const setup = () => {
      const run = ++generation;
      dispose();
      if (reduced.matches) return;
      let activated = false;
      const events = ["scroll", "wheel", "pointerdown", "keydown"] as const;
      const activate = () => {
        if (activated) return;
        activated = true;
        events.forEach((event) => window.removeEventListener(event, activate));
        void initialize().catch(() => {});
      };
      const initialize = async () => {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] =
          await Promise.all([
            import("lenis"),
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);
        if (run !== generation) return;
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({
          duration: 1.05,
          easing: (t) => 1 - Math.pow(1 - t, 3.4),
          smoothWheel: true,
          syncTouch: false,
          touchMultiplier: 1,
          prevent: (node) =>
            !!node.closest("dialog, .gallery-window, .nav-links"),
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        document.documentElement.classList.add("lenis-active");
        // Each chapter changes the camera's position, orbit and focal length.
        // The animation owns these values; the two renderers consume the same rig.
        const journey = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: publishSceneMotion,
          scrollTrigger: {
            id: "portfolio-camera",
            trigger: "main",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.55,
            invalidateOnRefresh: true,
          },
        });
        journey
          .fromTo(
            cameraPose,
            { dolly: 0, orbit: 0, focus: 0 },
            { dolly: 0.22, orbit: -0.18, focus: 0.2, duration: 1.2 },
          )
          .to(cameraPose, {
            dolly: 0.42,
            orbit: 0.16,
            focus: 0.7,
            duration: 1.1,
          })
          .to(cameraPose, {
            dolly: 0.77,
            orbit: -0.1,
            focus: 0.35,
            duration: 3.5,
          })
          .to(cameraPose, { dolly: 1, orbit: 0.12, focus: 0.1, duration: 1.2 });
        const copy = document.querySelector<HTMLElement>(".intro-copy");
        const intro = document.querySelector<HTMLElement>(".intro-journey");
        const setReachable = () => {
          if (!copy) return;
          const faded =
            document.documentElement.dataset.largeType !== "true" &&
            Number(gsap.getProperty(copy, "opacity")) < 0.1;
          copy.inert = faded;
          copy.style.pointerEvents = faded ? "none" : "";
        };
        const hero =
          copy && intro && !compact.matches
            ? gsap
                .timeline({
                  scrollTrigger: {
                    id: "portfolio-intro",
                    trigger: intro,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true,
                  },
                  onUpdate: setReachable,
                })
                .to(copy, {
                  y: -48,
                  scale: 1.025,
                  opacity: 0,
                  ease: "none",
                  duration: 0.85,
                })
                .to({}, { duration: 0.15 })
            : null;
        const chrome = document.querySelector(".chrome-text");
        const sheen =
          chrome && intro
            ? gsap.to(chrome, {
                backgroundPosition: "100% 100%",
                ease: "none",
                scrollTrigger: {
                  trigger: intro,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
                },
              })
            : null;
        const onDialog = () =>
          document.querySelector("dialog[open]") ? lenis.stop() : lenis.start();
        const modalObserver = new MutationObserver(onDialog);
        document.querySelectorAll("dialog").forEach((modal) =>
          modalObserver.observe(modal, {
            attributes: true,
            attributeFilter: ["open"],
          }),
        );
        ScrollTrigger.refresh();
        dispose = () => {
          modalObserver.disconnect();
          gsap.ticker.remove(tick);
          lenis.destroy();
          journey.scrollTrigger?.kill();
          journey.kill();
          hero?.scrollTrigger?.kill();
          hero?.kill();
          sheen?.scrollTrigger?.kill();
          sheen?.kill();
          if (copy) {
            gsap.set(copy, { clearProps: "transform,opacity" });
            copy.inert = false;
            copy.style.removeProperty("pointer-events");
          }
          Object.assign(cameraPose, { dolly: 0, orbit: 0, focus: 0 });
          publishSceneMotion();
          document.documentElement.classList.remove("lenis-active");
        };
      };
      dispose = () =>
        events.forEach((event) => window.removeEventListener(event, activate));
      events.forEach((event) =>
        window.addEventListener(event, activate, { passive: true }),
      );
      // Restore the camera when opening an anchored or history-restored page.
      if (window.scrollY > 0) activate();
    };
    setup();
    reduced.addEventListener("change", setup);
    compact.addEventListener("change", setup);
    return () => {
      generation++;
      dispose();
      reduced.removeEventListener("change", setup);
      compact.removeEventListener("change", setup);
    };
  }, []);
  return null;
}
