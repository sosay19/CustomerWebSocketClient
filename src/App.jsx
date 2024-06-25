import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const App = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState('');

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('https://localhost:7114/chathub', {
                withCredentials: true  // Ensure credentials are included
            })

            .withAutomaticReconnect()
            .build();

        connection.start().catch(err => console.error(err.toString()));

        connection.on('ReceiveMessage', (user, message) => {
            setMessages(messages => [...messages, `${user}: ${message}`]);
        });

        return () => {
            connection.stop();
        };
    }, []);

    const sendMessage = async () => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('https://localhost:7114/chathub') // Ensure this URL matches your server URL
            .build();

        await connection.start();
        await connection.invoke('SendMessage', user, message);
        setMessage('');
    };

    return (
        <div>
            <h1>WebSocket Demo</h1>
            <div>
                <input
                    type="text"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    placeholder="User"
                />
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Message"
                />
                <button onClick={sendMessage}>Send</button>
            </div>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
};

export default App;
