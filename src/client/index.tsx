function App() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
            }];
          } else {
            const newMessages = [...messages];
            newMessages[foundIndex] = {
              id: message.id,
              content: message.content,
              user: message.user,
              role: message.role,
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
    // Not connected yet
    return (
      <div className="chat container" style={{ textAlign: "center", marginTop: "30%" }}>
        <h2>Connecting...</h2>
      </div>
    );
  }

  return (
    <div className="chat container">
      {messages.map((message) => (
        <div key={message.id} className="row message">
          <div className="two columns user">{message.user}</div>
          <div className="ten columns content">{message.content}</div>
        </div>
      ))}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const content = e.currentTarget.elements.namedItem("content") as HTMLInputElement;
          const chatMessage: ChatMessage = {
            id: nanoid(8),
            content: content.value,
            user: name,
            role: "user",
          };
          setMessages((messages) => [...messages, chatMessage]);

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
