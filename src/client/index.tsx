import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePartySocket } from "partysocket/react";
import { nanoid } from "nanoid";
import { ChatMessage, Message, names } from "../shared";
import "./styles.css";

function App() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { room } = useParams();

  const socket = usePartySocket({
    party: "chat",
    room,
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message;
      if (message.type === "add") {
        setMessages((messages) => {
          const foundIndex = messages.findIndex((m) => m.id === message.id);
          if (foundIndex === -1) {
            return [...messages, {
              id: message.id,
              content: message.content,
              user: message.user,
              role: message.role,
              timestamp: new Date().toISOString(),
            }];
          } else {
            const newMessages = [...messages];
            newMessages[foundIndex] = {
              id: message.id,
              content: message.content,
              user: message.user,
              role: message.role,
              timestamp: new Date().toISOString(),
            };
            return newMessages;
          }
        });
      } else if (message.type === "update") {
        setMessages((messages) =>
          messages.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                  timestamp: new Date().toISOString(),
                }
              : m,
          ),
        );
      } else if (message.type === "all") {
        setMessages(message.messages);
      }
    },
  });

  if (socket.readyState !== WebSocket.OPEN) {
    return (
      <div className="chat-container loading">
        <div className="loading-spinner"></div>
        <h2>Connecting to chat...</h2>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat Room: {room}</h1>
        <div className="user-info">
          <span className="user-avatar">{name[0]}</span>
          <span className="username">{name}</span>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role === "assistant" ? "assistant" : "user"}`}
          >
            <div className="message-avatar">
              {message.user[0]}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-user">{message.user}</span>
                <span className="message-time">
                  {new Date(message.timestamp || new Date()).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      <form
        className="message-form"
        onSubmit={(e) => {
          e.preventDefault();
          const content = e.currentTarget.elements.namedItem("content") as HTMLInputElement;
          if (!content.value.trim()) return;
          
          const chatMessage: ChatMessage = {
            id: nanoid(8),
            content: content.value,
            user: name,
            role: "user",
            timestamp: new Date().toISOString(),
          };
          
          setMessages((messages) => [...messages, chatMessage]);
          setIsTyping(false);

          socket.send(
            JSON.stringify({
              type: "add",
              ...chatMessage,
            } satisfies Message),
          );

          content.value = "";
        }}
      >
        <input
          type="text"
          name="content"
          className="message-input"
          placeholder={`Hello ${name}! Type a message...`}
          autoComplete="off"
          onChange={(e) => setIsTyping(e.target.value.trim().length > 0)}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!isTyping}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
