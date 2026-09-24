const DISCLAIMER_TEXT =
  "This assistant helps you find hospitals from our database. It does not diagnose conditions or provide treatment advice.";

export async function analyzeDescription(text) {
  try {
    const response = await fetch("http://localhost:5000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }

    return {
      specialty: null,
      reply:
        data.reply ||
        "I couldn't get a response from the AI assistant."
    };
  } catch (error) {
    console.error("AI assistant error:", error);

    return {
      specialty: null,
      reply:
        "Sorry, the AI assistant is temporarily unavailable. Please try again."
    };
  }
}

export function initAiAssistant({ onSearchSpecialty } = {}) {
  const form = document.getElementById("ai-chat-form");
  const input = document.getElementById("ai-chat-input");
  const messages = document.getElementById("ai-chat-messages");

  if (!form || !input || !messages) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) return;

    appendUserMessage(messages, text);

    input.value = "";
    input.disabled = true;

    const typingEl = appendTypingIndicator(messages);

    const result = await analyzeDescription(text);

    typingEl.remove();

    input.disabled = false;
    input.focus();

    appendAiMessage(messages, result.reply);
  });
}

function appendUserMessage(container, text) {
  const el = document.createElement("div");

  el.className = "chat-msg from-user";
  el.textContent = text;

  container.appendChild(el);

  scrollToBottom(container);
}

function appendTypingIndicator(container) {
  const el = document.createElement("div");

  el.className = "chat-msg from-ai typing";
  el.setAttribute("aria-label", "AI is thinking");

  el.innerHTML =
    "<span></span><span></span><span></span>";

  container.appendChild(el);

  scrollToBottom(container);

  return el;
}

function appendAiMessage(container, text) {
  const el = document.createElement("div");

  el.className = "chat-msg from-ai";

  el.textContent = text;

  container.appendChild(el);

  scrollToBottom(container);
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

export { DISCLAIMER_TEXT };