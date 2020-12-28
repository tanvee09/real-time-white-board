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


var line_history = [];

io.on('connection', function(socket) {
    console.log('connected');
    for (var i in line_history) {
        socket.emit('draw_line', {line: line_history[i]});
    }

    socket.on('draw_line', function(data) {
        console.log(data.line);
        line_history.push(data.line);
        io.emit('draw_line', {line: data.line});
    });

    socket.on('clear_canvas', function(data) {
        line_history = [];
        io.emit('clear_canvas', {});
    });
})


app.use('/drawingboard', drawingboard);

app.get('/drawingboard')

server.listen(3000, function() {
    console.log("Server has started at port 3000");
});