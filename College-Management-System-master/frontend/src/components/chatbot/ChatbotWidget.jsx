import React, { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import axiosWrapper from "../../utils/AxiosWrapper";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Hi! I am your college assistant. Ask me about study tips, exams, projects, or productivity.",
    },
  ]);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, [messages, isBotTyping, isOpen]);

  const animateBotMessage = (fullText) =>
    new Promise((resolve) => {
      const botMessageId = `bot-${Date.now()}`;
      let index = 0;

      setMessages((prev) => [
        ...prev,
        { id: botMessageId, role: "assistant", content: "" },
      ]);
      setIsBotTyping(true);

      const timer = setInterval(() => {
        index += 1;
        const currentText = fullText.slice(0, index);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: currentText } : msg
          )
        );

        if (index >= fullText.length) {
          clearInterval(timer);
          setIsBotTyping(false);
          resolve();
        }
      }, 12);
    });

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading || isBotTyping) return;

    const userToken = localStorage.getItem("userToken");
    if (!userToken) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axiosWrapper.post(
        "/chat",
        { message },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const reply =
        response?.data?.data?.reply ||
        "I could not understand that. Please try again.";

      await animateBotMessage(reply);
    } catch (error) {
      await animateBotMessage(
        error?.response?.data?.message ||
          "Unable to reach AI assistant right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-md h-[65vh] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300">
          <div className="px-4 py-3 bg-blue-600 text-white font-semibold flex items-center justify-between">
            <p>AI Assistant</p>
            <button
              className="p-1 rounded hover:bg-blue-500 transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <FiX size={18} />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-6 shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {(isLoading || isBotTyping) && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-2xl rounded-bl-md text-sm">
                  Typing...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || isBotTyping || !input.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>
    </>
  );
};

export default ChatbotWidget;
