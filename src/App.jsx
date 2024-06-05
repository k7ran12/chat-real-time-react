import { useState, useEffect, useRef } from 'react';
import './App.css';
import { io } from "socket.io-client";
import Card from './components/Card/Card';

function App() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("tk") || ''); 
  const [showForm, setShowForm] = useState(!token); // Mostrar el formulario si no hay token

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://161.132.48.191:3000', {
      auth: {
        username: token,
        serverOffset: 0
      }
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor');
      setSocket(newSocket);
      scrollToBottom();
    });

    newSocket.on('previousMessages', (messages) => {
      setMessages(messages.map(msg => ({ text: msg.message, username: msg.username, sentByUser: msg.username === token })));
    });

    newSocket.on('message', (message) => {
      console.log(message);
      setMessages((prevMessages) => [...prevMessages, { text: message.message, username: message.username, sentByUser: message.username === token }]);
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const msgObj = { text: message, username: token, sentByUser: true };
      console.log(msgObj);
      socket.emit('message', message, () => {
        console.log('Mensaje enviado');
        setMessages((prevMessages) => [...prevMessages, msgObj]);
        scrollToBottom();
      });
      setMessage('');
    }
  };

  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  const saveToken = (e) => {
    e.preventDefault();
    localStorage.setItem("tk", token);
    setShowForm(false); // Ocultar el formulario después de guardar el token
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card />
      <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center">Chat</h1>
        </div>
        {/* Mostrar el formulario solo si showForm es verdadero */}
        {showForm && (
          <form onSubmit={saveToken} className="mb-4">
            <input
              type="text"
              value={token}
              onChange={handleTokenChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ingresa tu usuario..."
            />
            <button
              type="submit"
              className="block w-full p-2 mt-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Guardar
            </button>
          </form>
        )}
        <div id="chat-container" className={`h-64 overflow-y-scroll border border-gray-200 p-2 mb-4 flex flex-col scroll-smooth ${!showForm ? 'block' : 'hidden'}`}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded-lg max-w-xs ${
                msg.sentByUser ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'
              } ${index === messages.length - 1 ? 'mb-3' : ''}`}
            >
              <strong>{msg.username}:</strong> {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className={`flex ${showForm ? 'hidden' : 'block'}`}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Escribe tu mensaje..."
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
