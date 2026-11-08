import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp, ChevronDown } from "lucide-react";

/** Native scrolling remains in control; only off-screen content is revealed. */
export function PageMotion({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let stop = () => {};
    function configure() {
      stop();
      element!
        .querySelectorAll(".scroll-reveal")
        .forEach((node) =>
          node.classList.remove("scroll-reveal", "is-visible"),
        );
      if (preference.matches) return;
      const seen = new WeakSet<Element>();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
        },
        { threshold: 0, rootMargin: "0px 0px -24px 0px" },
      );
      const scan = () => {
        element!
          .querySelectorAll(
            ".section-heading, .step, .benefit, .property-card, .landlord-banner, .prose > h2",
          )
          .forEach((node) => {
            if (seen.has(node)) return;
            seen.add(node);
            // Never hide content already visible, including restored scroll positions.
            if (node.getBoundingClientRect().top < innerHeight) return;
            node.classList.add("scroll-reveal");
            observer.observe(node);
          });
      };
      scan();
      // Lazy routes and fetched cards can arrive after the first render.
      const changes = new MutationObserver(scan);
      changes.observe(element!, { childList: true, subtree: true });
      stop = () => {
        observer.disconnect();
        changes.disconnect();
      };
    }
    configure();
    preference.addEventListener("change", configure);
    return () => {
      stop();
      preference.removeEventListener("change", configure);
    };
  }, [pathname]);
  return (
    <div key={pathname} className="route-stage" ref={root}>
      {children}
    </div>
  );
}

export function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className={`faq-item ${open ? "is-open" : ""}`}>
      <h3 className="faq-question">
        <button
          className="faq-trigger"
          id={`${id}-question`}
          aria-expanded={open}
          aria-controls={`${id}-answer`}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{question}</span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </h3>
      <div
        className="faq-answer"
        id={`${id}-answer`}
        role="region"
        aria-labelledby={`${id}-question`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="faq-answer-clip">
          <p>{answer}</p>
        </div>
      </div>
    </article>
  );
}

export function BackToTop() {
  const sentinel = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "400px 0px 0px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <span className="scroll-sentinel" ref={sentinel} aria-hidden="true" />
      <button
        className={`back-to-top ${visible ? "is-visible" : ""}`}
        aria-label="Back to top"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
          document.getElementById("main")?.focus({ preventScroll: true });
        }}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
