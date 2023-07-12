// Dependências
const express = require('express');
const WebSocket = require('ws');

// Configuração do servidor
const app = express();

// Defini rota para a raiz ("/")
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Iniciar o servidor
const server = app.listen(3000, () => {
    console.log('Server running on port 3000');
});


// Configuração do WebSocket
const wss = new WebSocket.Server({ server });
let clients = [];
let games = [];

//  Funções utilitárias
const getClientByUsername = (username) => {
    return clients.find((client) => client.username === username);
};

const getGameById = (gameId) => {
    return games.find((game) => game.id === gameId);
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    // Event: New client connected
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Event: New user registration
        if (data.type === 'register') {
            const { email, password, username } = data.payload;

            // Check if email or username is already taken
            const emailTaken = clients.some((client) => client.email === email);
            const usernameTaken = clients.some(
                (client) => client.username === username
            );

            if (emailTaken || usernameTaken) {
                const response = {
                    type: 'register',
                    success: false,
                    message: 'Email or username is already taken',
                };
                ws.send(JSON.stringify(response));
            } else {
                // Register new client
                const newClient = { email, password, username, ws };
                clients.push(newClient);

                const response = {
                    type: 'register',
                    success: true,
                    message: 'Registration successful',
                };
                ws.send(JSON.stringify(response));
            }
        }

        // Event: User login
        if (data.type === 'login') {
            const { email, password } = data.payload;

            const client = clients.find(
                (client) => client.email === email && client.password === password
            );

            if (client) {
                // Update WebSocket connection with client data
                client.ws = ws;

                const response = {
                    type: 'login',
                    success: true,
                    message: 'Login successful',
                };
                ws.send(JSON.stringify(response));
            } else {
                const response = {
                    type: 'login',
                    success: false,
                    message: 'Invalid email or password',
                };
                ws.send(JSON.stringify(response));
            }
        }

        // ... (continue with other message handling logic)

    });

    // Event: Client disconnected
    ws.on('close', () => {
        // Remove disconnected client from clients list
        clients = clients.filter((client) => client.ws !== ws);

        // Check if any games need to be updated
        games = games.filter((game) => {
            // Remove disconnected client from players list
            game.players = game.players.filter((player) => player.ws !== ws);

            // If the disconnected client was the game creator, cancel the game
            if (game.creator.ws === ws) {
                const response = {
                    type: 'cancelGame',
                    success: false,
                    message: 'Game canceled due to creator disconnecting',
                    gameId: game.id,
                };
                game.players.forEach((player) => player.ws.send(JSON.stringify(response)));
                return false; // Exclude the game from the games list
            }

            return true; // Keep the game in the games list
        });
    });
});