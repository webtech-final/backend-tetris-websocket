const randomstring = require('randomstring');
const http = require('http');
const app = require('express')();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ['GET', 'POST'],
    },
});

const clientRooms = {};

io.on('connection', client => {
    console.log(client.id);

    client.on('genGameCode', handleGenGameCode);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('player1', (state) => {
        io.sockets.in(clientRooms[client.id]).emit('state1', state);
    })
    client.on('player2', (state) => {
        io.sockets.in(clientRooms[client.id]).emit('state2', state);
    })

    function handleGenGameCode() {
        let roomName = randomstring.generate(5);
        client.emit('gameCode', roomName);
    }

    function handleNewGame(roomName) {
        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleJoinGame(roomName) {
        const room = io.sockets.adapter.rooms.get(roomName);

        let numClients = 0;
        if(room)
            numClients = room.size;

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
        client.emit('init', 2)
    }
});

io.on('disconnect', () => {
    console.dir(clientRooms)
})

app.get('/', (req, res) => {
    res.send('socket.io server are runing');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});