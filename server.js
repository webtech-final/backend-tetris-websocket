const randomstring = require('randomstring');
const http = require('http');
const app = require('express')();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
});

const port = process.env.PORT || 3000

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

    client.on('message', msg => {
        io.emit('new_message', msg);
    });

    function handleGameOver(payLoad) {
        // const clients = io.sockets.adapter.rooms.get(clientRooms[client.id]);
        // for (const clientId of clients) {
        //     const client = io.sockets.sockets.get(clientId);
        //     client.number == payLoad.loserNumber
        //         ? (payLoad.loserName = client.playerName)
        //         : (payLoad.winnerName = client.playerName);
        // }
        io.sockets.in(clientRooms[client.id]).emit('gameOver', payLoad);
    }

    function handleGenGameCode() {
        let roomName = randomstring.generate(5);
        client.emit('gameCode', roomName);
    }

    function handleNewGame({ roomName, playerName }) {
        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 1;
        client.playerName = playerName;
        client.emit('init', 1);
    }

    function handleJoinGame({ roomName, playerName }) {
        const room = io.sockets.adapter.rooms.get(roomName);
        let clientOneName = '';
        if (room) {
            for (const clientId of room) {
                let clientNumberOne = io.sockets.sockets.get(clientId);
                clientOneName = clientNumberOne.playerName;
            }
        }
        let numClients = 0;
        if (room) numClients = room.size;

        if (numClients === 0) {
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

        io.sockets
            .in(clientRooms[client.id])
            .emit('startGame', { playerOneName: clientOneName, playerTwoName: playerName });
    }
});

app.get('/', (req, res) => {
    res.send('socket.io server are runing');
});

server.listen(port, () => {
    console.log(`listening on :${port}`);
});

//test
