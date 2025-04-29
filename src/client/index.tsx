import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router";
import { nanoid } from "nanoid";

import { type ChatMessage, type Message } from "../shared";

function App() {
  const [name, setName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { room } = useParams();

  const socket = usePartySocket({
    party: "chat",
    room,
    onOpen: (event, socket) => {
      // optionally handle open event if needed
    },
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message | { type: "info"; user: string };

      if ("type" in message) {
        if (message.type === "all") {
          // Received all past messages
          setMessages(message.messages);
        } else if (message.type === "add" || message.type === "update") {
          setMessages((prevMessages) => {
            const foundIndex = prevMessages.findIndex((m) => m.id === message.id);
            if (foundIndex !== -1) {
              return prevMessages.map((m) =>
                m.id === message.id
                  ? { id: message.id, content: message.content, user: message.user, role: message.role }
                  : m
              );
            } else {
              return [...prevMessages, {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              }];
            }
          });
        }
      }

      // Detect if server sends username info (optional future feature)
      if ("user" in message && message.type === "info") {
        setName(message.user);
      }
    },
  });

  if (!name) {
    return <div className="loading">Connecting...</div>;
  }

  return (
    <div className="chat container">
      {messages.map((message) => (
        <div key={message.id} className="row message">
          <div className="two columns user">{message.user}</div>
          <div className="ten columns">{message.content}</div>
        </div>
      ))}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const contentInput = e.currentTarget.elements.namedItem("content") as HTMLInputElement;
          const content = contentInput.value.trim();
          if (!content) return;

          const chatMessage: ChatMessage = {
            id: nanoid(8),
            content,
            user: name,
            role: "user",
          };

          setMessages((messages) => [...messages, chatMessage]);

          socket.send(
            JSON.stringify({
              type: "add",
              ...chatMessage,
            } satisfies Message)
          );

          contentInput.value = "";
        }}
      >
        <input
          type="text"
          name="content"
          className="ten columns my-input-text"
          placeholder={`Hello ${name}! Type a message...`}
          autoComplete="off"
        />
        <button type="submit" className="send-message two columns">
          Send
        </button>
      </form>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
      <Route path="/:room" element={<App />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>
);
