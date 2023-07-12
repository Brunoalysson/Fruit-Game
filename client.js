const WebSocket = require('ws');
const readline = require('readline');

// Configuração do WebSocket
const ws = new WebSocket('ws://localhost:3000');

// Cria uma interface de leitura para entrada do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Evento: Conexão estabelecida com o servidor
ws.on('open', () => {
    console.log('Conexão estabelecida com o servidor.');

    // Solicita o nome de usuário para o jogador
    rl.question('Digite seu nome de usuário: ', (username) => {
        // Envia uma mensagem para o servidor com o nome de usuário
        const message = {
            type: 'register',
            payload: {
                username
            }
        };
        ws.send(JSON.stringify(message));
    });
});

// Evento: Recebe uma mensagem do servidor
ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
        // Recebe a resposta do servidor para o registro do jogador
        if (data.success) {
            console.log(data.message);
            // Inicia a interação com o jogo
            startGameInteraction();
        } else {
            console.log(data.message);
            // Fecha a conexão com o servidor
            ws.close();
        }
    }

    // Outros eventos e mensagens do servidor podem ser tratados aqui
});

// Evento: Conexão fechada
ws.on('close', () => {
    console.log('Conexão com o servidor encerrada.');
    process.exit(0);
});

// Função para iniciar a interação com o jogo
function startGameInteraction() {
    console.log('Você está conectado ao jogo. Use os comandos abaixo para interagir:');
    console.log('- create: Criar um novo jogo');
    console.log('- join <gameId>: Entrar em um jogo existente');
    console.log('- start <gameId>: Iniciar um jogo que você criou');
    console.log('- exit: Sair do jogo');

    // Solicita comandos do jogador
    rl.on('line', (input) => {
        const args = input.trim().split(' ');

        if (args[0] === 'create') {
            const message = {
                type: 'createGame',
                payload: {
                    username: args[1],
                    minPlayers: 2 // Número mínimo de jogadores para iniciar um jogo
                }
            };
            ws.send(JSON.stringify(message));
        } else if (args[0] === 'join') {
            const message = {
                type: 'joinGame',
                payload: {
                    username: args[1],
                    gameId: args[2]
                }
            };
            ws.send(JSON.stringify(message));
        } else if (args[0] === 'start') {
            const message = {
                type: 'startGame',
                payload: {
                    username: args[1],
                    gameId: args[2]
                }
            };
            ws.send(JSON.stringify(message));
        } else if (args[0] === 'exit') {
            console.log('Saindo do jogo...');
            ws.close();
        } else {
            console.log('Comando inválido. Tente novamente.');
        }
    });
}