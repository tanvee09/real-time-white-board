const express = require('express');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const drawingboard = require('./routes/drawingboard');
const { v1: uuid } = require('uuid');

var server = http.createServer(app);
var io = socketio(server);
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("static"));


const rooms = {} // can keep track of all the rooms , there players, there ids,
var colors = ['red', 'yellow', 'red', 'pink', 'green', 'orange', 'blue'];


const joinRoom = (socket, room) => {
    room.sockets.push(socket);
    room.user_id.push(socket.name);

    socket.join(room.id, () => {
        // store the room id in the socket for future use
        socket.roomId = room.id;
        console.log(socket.id, "Joined", room.id);
    });
    console.log(room.sockets.length);
};

const leaveRooms = (socket) => {
    const roomsToDelete = [];
    for (const id in rooms) {
        const room = rooms[id];
        if (room.sockets.includes(socket)) {
            socket.leave(id);
            room.sockets = room.sockets.filter((item) => item !== socket);
        }
        if (room.sockets.length == 0) {
            roomsToDelete.push(room);
        }
    }
    for (const room of roomsToDelete) {
        console.log('Deleting ' + room.id);
        delete rooms[room.id];
    }
};


/**
 * The starting point for a user connecting to our lovely little multiplayer
 * server!
 */
io.on('connection', (socket) => {

    // give each socket a random identifier so that we can determine who is who when
    // we're sending messages back and forth!
    socket.id = uuid();
    socket.color = colors[Math.floor(Math.random() * colors.length)];

    console.log('a user connected');
    socket.emit('message', 'You are connected!');

    socket.color = colors[Math.floor(Math.random() * colors.length)];

    socket.on('draw_line', function(data) {

        let room_id = socket.roomId;

        rooms[room_id].line_history.push(data.line);
        for (sock of rooms[room_id].sockets) {
            sock.emit('draw_line', { line: data.line });
        }

    });

    socket.on('clear_canvas', function(data) {
        let room_id = socket.roomId;
        rooms[room_id].line_history = [];
        for (sock of rooms[room_id].sockets) {
            sock.emit('clear_canvas', {});
        }
    });


    socket.on('draw_cursor', function(data) {
        let room_id = socket.roomId;
        for (sock of rooms[room_id].sockets) {
            sock.emit('draw_cursor', { line: data.line, id: sock.id, color: sock.color });
        }
    });


    socket.on('setUsername', (text) => {
        socket.name = text;
        socket.emit('getUsername', socket.name);
    });





    /**
     * Lets us know that players have joined a room and are waiting in the waiting room.
     */


    socket.on('deletePrevSockets', (roomId) => {
        console.log("Delete sockets in: " + roomId);
        for (i in rooms)
            console.log(rooms[i].id);
        rooms[roomId].sockets = [];
        rooms[roomId].user_id = [];
    });


    //Gets fired when someone wants to get the list of rooms. respond with the list of room names.
    socket.on('getRoomNames', (data, callback) => {
        const roomNames = [];
        for (const id in rooms) {
            const { name } = rooms[id];
            const room = { name, id };
            roomNames.push(room);
        }
        callback(roomNames);
    });

    function uniqueRoomID() {
        var roomids = Object.keys(rooms);
        var room;

        function codeCreate() {
            var i;
            var s = '';
            var num;
            for (i = 0; i <= 5; i++) {
                num = Math.random() * 25;
                s += String.fromCharCode(65 + num);
            }
            return s;
        }
        room = codeCreate();
        while (roomids.includes(room)) {
            room = codeCreate();
        }
        return room;
    }

    //Gets fired when a user wants to create a new room.
    socket.on('createRoom', (roomName) => {
        let id = uniqueRoomID();
        // const room = {
        //     id: uniqueRoomID(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
        //     name: roomName,
        //     sockets: [],
        //     line_history: [], // this i changed
        //     user_id: [] // user ids of all the sockets connected;
        // };
        // rooms[room.id] = room;
        // have the socket join the room they've just created.
        // joinRoom(socket, room);
        // for (i in rooms)
        //     console.log(rooms[i].id);
        socket.emit('roomId', room.id);
    });

    //Gets fired when a player has joined a room.
    socket.on('joinRoom', (roomId, callback) => {
        console.log("Available room ids: ")
        for (i in rooms) {
            console.log(i.length);
        }
        console.log('Trying to connect to: #' + roomId.length + "#");
        const room = rooms[roomId];
        joinRoom(socket, room);
        for (var i in room[line_history]) { // do something
            socket.emit('draw_line', { line: line_history[i] });
        }
    });

    socket.on('disconnect', () => {
        leaveRooms(socket);
    });

    socket.on('leaveRoom', () => {
        leaveRooms(socket);
    });
});


app.get("/multiplayer:roomid", async(req, res) => {
    const { roomid } = req.params;
    console.log("Room id: " + roomid);
    res.render("multiplayer", { room_id: roomid });
});


app.get('/draw/:id', (req, res) => {
    let id = req.params.id;
    res.render('drawingboard', { roomId: id });
});



// app.use('/drawingboard', drawingboard);


server.listen(3000, function() {
    console.log("Server has started at port 3000");
});