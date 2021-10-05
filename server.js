const randomstring = require('randomstring');
const http = require('http');
const app = require('express')();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
});

const clientRooms = {};

io.on('connection', client => {
    client.on('genGameCode', handleGenGameCode);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('gameOver', handleGameOver);
    client.on('player1', state => {
        io.sockets.in(clientRooms[client.id]).emit('state1', state);
    });
    client.on('player2', state => {
        io.sockets.in(clientRooms[client.id]).emit('state2', state);
    });

    function handleGameOver(payLoad) {
        const clients = io.sockets.adapter.rooms.get(clientRooms[client.id]);
        for (const clientId of clients) {
            const client = io.sockets.sockets.get(clientId);
            client.number == payLoad.loserNumber
                ? (payLoad.loserName = client.playerName)
                : (payLoad.winnerName = client.playerName);
        }
        io.sockets.in(clientRooms[client.id]).emit('gameOver', payLoad);
    }

    function handleGenGameCode() {
        let roomName = randomstring.generate(5);
        client.emit('gameCode', roomName);
    }

    function handleNewGame({ roomName, playerName }) {
        if (playerName) {
            clientRooms[client.id] = roomName;

            client.join(roomName);
            client.number = 1;
            client.playerName = playerName;
            client.emit('init', 1);
        }
    }

    function handleJoinGame({ roomName, playerName }) {
        if (playerName) {
            let clientNumberOne;
            const room = io.sockets.adapter.rooms.get(roomName);
            for (const clientId of room) {
                clientNumberOne = io.sockets.sockets.get(clientId);
            }

            let numClients = 0;
            if (room) numClients = room.size;

            if (numClients === 0 || playerName == clientNumberOne.playerName) {
                client.emit('unknownCode');
                return;
            } else if (numClients > 1) {
                client.emit('tooManyPlayers');
                return;
            }

            clientRooms[client.id] = roomName;

            client.join(roomName);
            client.number = 2;
            client.playerName = playerName;
            client.emit('init', 2);

            io.sockets.in(clientRooms[client.id]).emit('startGame', true);
        }
    }
});

app.get('/', (req, res) => {
    res.send('socket.io server are runing');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
