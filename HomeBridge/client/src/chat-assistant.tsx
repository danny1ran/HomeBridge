import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  House,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  link?: { to: string; label: string };
};
const greeting: ChatMessage = {
  role: "assistant",
  text: "Hi, I’m your HomeBridge guide 👋\nLooking for a place to call home? Try a sample conversation below.",
};
const suggestions = [
  "Find a home under $1,200",
  "Try a sample lease review",
  "How do I book a viewing?",
];
function demoReply(question: string): ChatMessage {
  const q = question.toLowerCase();
  if (/lease|contract|agreement|deposit/.test(q))
    return {
      role: "assistant",
      text: "Here’s a sample lease-review preview:\n\n• Rent and included utilities\n• Lease dates and renewal wording\n• Deposit and payment terms\n• Repairs and shared-space rules\n\nA future assistant could help organize questions about these sections. This demo hasn’t read or reviewed a contract and provides no legal assessment.",
      link: { to: "/safety", label: "Open rental safety guide" },
    };
  if (/view|book|tour|visit/.test(q))
    return {
      role: "assistant",
      text: "Let’s picture your first viewing. Open a home, choose virtual or in-person, then pick an available time.\n\nIn this unconnected demo, real reservations are disabled. You can still explore the property pages and viewing interface.",
      link: { to: "/browse", label: "Explore homes" },
    };
  if (/home|house|rent|budget|room|1200|1,200/.test(q))
    return {
      role: "assistant",
      text: "Let’s try a sample search: Peterborough, up to $1,200/month.\n\nYou can narrow it by room type and campus on the search page. These are fictional demo listings, not confirmed recommendations or availability.",
      link: {
        to: "/browse?city=North%20York&max=1200",
        label: "Try the sample search",
      },
    };
  return {
    role: "assistant",
    text: "I’m a scripted interface demo for now, so I can’t answer custom questions yet. Try a sample housing search, lease-review preview, or viewing walkthrough using the buttons below.",
  };
}
export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [open, messages, typing]);
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  function send(text: string) {
    const value = text.trim();
    if (!value || typing) return;
    setMessages((previous) => [
      ...previous,
      { role: "user", text: value.slice(0, 500) },
    ]);
    setDraft("");
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((previous) => [...previous, demoReply(value)]);
      setTyping(false);
      timer.current = null;
    }, 650);
  }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setTyping(false);
    setMessages([greeting]);
    setDraft("");
    input.current?.focus();
  }
  return (
    <div className="chat-widget">
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          id="homebridge-chat"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <header className="chat-header">
            <span className="chat-avatar">
              <House size={22} />
              <Sparkles size={11} />
            </span>
            <div>
              <h2 id="chat-title">HomeBridge guide</h2>
              <p>
                <span />
                Let’s find your next chapter
              </p>
            </div>
            <button
              aria-label="Restart demo chat"
              title="Restart demo chat"
              onClick={reset}
            >
              <RotateCcw size={16} />
            </button>
            <button aria-label="Close chat" onClick={close}>
              <X size={20} />
            </button>
          </header>
          <div className="chat-demo-note">
            <Sparkles size={13} />
            <span>Scripted demo · no AI or document analysis</span>
          </div>
          <div
            className="chat-messages"
            ref={log}
            role="log"
            aria-label="Demo conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <span className="chat-speaker">
                  {message.role === "assistant" ? "HomeBridge" : "You"}
                </span>
                <p>{message.text}</p>
                {message.link && (
                  <Link to={message.link.to} onClick={close}>
                    {message.link.label}
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            ))}
            {typing && (
              <div className="chat-typing" role="status">
                <span />
                <span />
                <span />
                <span className="sr-only">Preparing a demo reply</span>
              </div>
            )}
          </div>
          <div className="chat-suggestions" aria-label="Sample questions">
            {suggestions.map((question, index) => (
              <button
                key={question}
                disabled={typing}
                onClick={() => send(question)}
              >
                {index === 1 ? (
                  <FileText size={13} />
                ) : index === 0 ? (
                  <House size={13} />
                ) : (
                  <MessageCircle size={13} />
                )}{" "}
                {question}
              </button>
            ))}
          </div>
          <form
            className="chat-compose"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <label className="sr-only" htmlFor="chat-message-input">
              Message HomeBridge guide
            </label>
            <input
              ref={input}
              id="chat-message-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your next home…"
              maxLength={500}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!draft.trim() || typing}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>
          <p className="chat-privacy">
            Demo only. Messages stay in this tab and reset on reload.
          </p>
        </section>
      )}
      <button
        ref={launcher}
        className={`chat-launcher ${open ? "is-open" : ""}`}
        aria-label={open ? "Close HomeBridge guide" : "Open HomeBridge guide"}
        aria-expanded={open}
        aria-controls="homebridge-chat"
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X size={19} /> : <MessageCircle size={20} />}
        <span className="chat-launcher-label">Ask HomeBridge</span>
        {!open && (
          <span className="chat-launcher-badge" aria-hidden="true">
            <Sparkles size={10} />
          </span>
        )}
      </button>
    </div>
  );
}
