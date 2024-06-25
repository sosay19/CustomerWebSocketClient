import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import CryptoJS from 'crypto-js';
import './index.css'; // Import your custom CSS file

const api_url = "http://localhost:5268/chathub";
const aes_key = "kN9Q5fy83Zw5e3tGj65KN5yHq+R1w9mqmpGYzQCUQQg="

const App = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState('');
    const [error, setError] = useState(null); // State to hold error messages

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(api_url, {
                withCredentials: true  // Ensure credentials are included
            })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log('SignalR Connected');
                setError(null); // Clear any previous errors on successful connection
            })
            .catch(err => {
                console.error('SignalR Connection Error:', err.toString());
                setError('Failed to connect to WebSocket server.'); // Set error state on connection failure
            });

        connection.onclose(() => {
            console.log('SignalR Connection Closed');
            setError('WebSocket connection closed unexpectedly.'); // Set error state on connection close
        });

        connection.on('ReceiveMessage', (user, encryptedMessage) => {
            const decryptedMessage = decryptMessage(encryptedMessage);
            setMessages(messages => [...messages, `${user}: ${decryptedMessage}`]);
        });

        return () => {
            connection.stop();
        };
    }, []);

    const sendMessage = async () => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(api_url)
            .build();

        try {
            await connection.start();
            const encryptedMessage = encryptMessage(message);

            await connection.invoke('SendMessage', user, encryptedMessage);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error.toString());
            setError('Failed to send message.'); // Set error state on message send failure
        } finally {
            // Do not stop the connection immediately after sending a message
            // Instead, handle connection lifecycle appropriately
            try {
                await connection.stop();
            } catch (error) {
                console.error('Error stopping connection:', error.toString());
            }
        }
    };


    const decryptMessage = (encryptedMessage) => {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, aes_key);
        const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

        return decryptedMessage;
    };

    const encryptMessage = (message) => {

        const encryptedMessage = CryptoJS.AES.encrypt(message, aes_key).toString();

        return encryptedMessage;
    };

    return (
        <div>
            <h1>WebSocket Demo</h1>
            {error && <div className="error">{error}</div>} {/* Display error message if error state is set */}
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
