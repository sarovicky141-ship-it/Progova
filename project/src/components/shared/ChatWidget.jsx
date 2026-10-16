import { useEffect, useRef, useState } from "react";
import { MessageCircleMore, SendHorizontal, Sparkles, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch, isApiRequestInterrupted } from "../../lib/api";
import LoadingState from "./LoadingState";
import "./ChatWidget.css";

const welcomeMessage = {
  id: "welcome",
  sender: "assistant",
  text: "Hi! I'm the PROGOVA AI Assistant. How can I help you?",
};

const formatValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return "N/A";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 3).map((item) => formatValue(item)).join(", ");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).slice(0, 4);
    if (!entries.length) return "Available";
    return entries.map(([key, itemValue]) => `${key}: ${formatValue(itemValue)}`).join(" • ");
  }

  return "Available";
};

const formatDataForChat = (data) => {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    return data
      .slice(0, 4)
      .map((item, index) => {
        if (typeof item === "string") {
          return `${index + 1}. ${item}`;
        }

        if (item && typeof item === "object") {
          const summary = Object.entries(item)
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${formatValue(value)}`)
            .join(" | ");
          return `${index + 1}. ${summary}`;
        }

        return `${index + 1}. ${formatValue(item)}`;
      })
      .join("\n");
  }

  if (typeof data === "object") {
    const entries = Object.entries(data).slice(0, 4);
    if (!entries.length) {
      return null;
    }

    return entries
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join("\n");
  }

  return String(data);
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const requestController = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  useEffect(
    () => () => requestController.current?.abort(),
    []
  );

  if (!user) {
    return null;
  }

  const submitMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = draft.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmedMessage,
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setDraft("");
    setIsLoading(true);

    const controller = new AbortController();
    requestController.current = controller;
    let interrupted = false;

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmedMessage }),
        signal: controller.signal,
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Request failed");
      }

      const replyText = payload?.reply || "I could not generate a response.";
      const formattedData = formatDataForChat(payload?.data);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: formattedData ? `${replyText}\n\n${formattedData}` : replyText,
        },
      ]);
    } catch (error) {
      interrupted = isApiRequestInterrupted(error);
      if (!controller.signal.aborted && !interrupted) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            id: `error-${Date.now()}`,
            sender: "assistant",
            text: "Sorry, I couldn't process that request. Please try again.",
          },
        ]);
      }
    } finally {
      if (!controller.signal.aborted && !interrupted) setIsLoading(false);
      if (requestController.current === controller) {
        requestController.current = null;
      }
    }
  };

  return (
    <div className="chat-widget">
      <button
        type="button"
        className="chat-launcher"
        aria-label="Open PROGOVA AI Assistant"
        title="PROGOVA AI Assistant"
        onClick={() => setIsOpen((previousState) => !previousState)}
      >
        <MessageCircleMore size={20} />
      </button>

      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="PROGOVA AI Assistant chat window">
          <header className="chat-header">
            <div className="chat-title-wrap">
              <div className="chat-badge">
                <Sparkles size={14} />
              </div>
              <div>
                <h3>PROGOVA AI Assistant</h3>
                <p>Your campus support assistant</p>
              </div>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </header>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === "user" ? "is-user" : "is-assistant"}`}
              >
                <div className="chat-message-bubble">
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-message is-assistant">
                <div className="chat-message-bubble" aria-live="polite">
                  <LoadingState />
                </div>
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={submitMessage}>
            <label className="sr-only" htmlFor="progova-chat-input">Message</label>
            <textarea
              id="progova-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage(event);
                }
              }}
              rows={1}
              placeholder="Ask something..."
              disabled={isLoading}
            />
            <button type="submit" className="chat-submit" aria-label="Send message" disabled={isLoading || !draft.trim()}>
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
