var mouse = {
    click: false,
    move: false,
    pos: {x: 0, y: 0},
    pos_prev: false
};



var canvas = document.getElementById('drawing');
var context = canvas.getContext('2d');
var width = window.innerWidth;
var height = window.innerHeight * 0.9;

canvas.width = width;
canvas.height = height;

var strokeColor = 'red';
var socket = io.connect();



canvas.onmousedown = function(e) {
    mouse.click = true;
}

canvas.onmouseup = function(e) {
    mouse.click = false;
}

canvas.onmousemove = function(e) {
    mouse.pos.x = e.clientX / width;
    mouse.pos.y = e.clientY / height;
    mouse.move = true;
    // alert(`${mouse.pos.x}, ${mouse.pos.y}`);
}

socket.on('draw_line', function(data) {
    var line = data.line;
    context.beginPath();
    context.lineWidth = 2;
    if (data.line.erase) {
        context.strokeStyle = line.color;
        context.globalCompositeOperation = "source-over";
        context.moveTo(line.start.x * width, line.start.y * height);
        context.lineTo(line.end.x * width, line.end.y * height);
        context.stroke();
        context.strokeStyle = strokeColor;
    } else {
        context.globalCompositeOperation = "destination-out";
        context.arc(line.start.x, line.start.y, 8, 0, Math.PI*2, false);
        context.fill();
    }
    
    
});

socket.on('clear_canvas', function(data) {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

function mainLoop() {
    if (mouse.click && mouse.move && mouse.pos_prev) {
        socket.emit('draw_line', {line: {start: mouse.pos, end: mouse.pos_prev, color: strokeColor}});
        mouse.move = false;
    }
    mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
}

setInterval(mainLoop, 25);


function clearCanvas() {
    socket.emit('clear_canvas', {});  
}

function changeStrokeColor(color) {
    strokeColor = color;
    context.strokeStyle = color;
}