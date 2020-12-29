const express = require('express');
const app = express();
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const drawingboard = require('./routes/drawingboard');

var server = http.createServer(app);
var io = socketio(server); 
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("static"));

var userid = 0;

var userInfo = {} // consists of username,{x,y}

var line_history = [];
var colors = ['red', 'yellow', 'red', 'pink', 'green', 'orange', 'blue'];

io.on('connection', function(socket) {
    console.log('connected');
    for (var i in line_history) {
        socket.emit('draw_line', { line: line_history[i] });
    }

    socket.color = colors[Math.floor(Math.random() * colors.length)];

    socket.on('draw_line', function(data) {
        //console.log(data.line);
        line_history.push(data.line);
        io.emit('draw_line', { line: data.line });
    });

    socket.on('clear_canvas', function(data) {
        line_history = [];
        io.emit('clear_canvas', {});
    });


    socket.on('draw_cursor', function(data) {
        io.emit('draw_cursor', { line: data.line, id: socket.id, color: socket.color });
    });

    socket.emit('set_username', userid);
    userid += 1;
})


app.use('/drawingboard', drawingboard);

app.get('/drawingboard')

server.listen(3000, function() {
    console.log("Server has started at port 3000");
});