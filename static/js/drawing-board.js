var mouse = {
    click: false,
    move: false,
    pos: { x: 0, y: 0 },
    pos_prev: false
};

var eraserOn = false;

var username;
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
    socket.emit('draw_cursor', { line: { x: mouse.pos.x, y: mouse.pos.y } });
    // alert(`${mouse.pos.x}, ${mouse.pos.y}`);
}

socket.on('draw_line', function(data) {
    var line = data.line;
    context.lineWidth = line.lineWidth;
    context.strokeStyle = line.color;
    if (!data.line.erase) {
        context.globalCompositeOperation = "source-over";
    } else {
        context.globalCompositeOperation = "destination-out";
    }
    context.beginPath();
    context.moveTo(line.start.x * width, line.start.y * height);
    context.lineTo(line.end.x * width, line.end.y * height);
    context.stroke();
    context.strokeStyle = strokeColor;
});

socket.on('clear_canvas', function(data) {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('set_username', function(data) {
    username = data;
    console.log("username set ", username);
})


function mainLoop() {
    if (mouse.click && mouse.move && mouse.pos_prev) {
        var lineWidth = document.getElementById('strokeWidth').value;
        var strokeColor = document.getElementById('brushColor').value;
        socket.emit('draw_line', { line: { start: mouse.pos, end: mouse.pos_prev, color: strokeColor, lineWidth: lineWidth, erase: eraserOn } });
        mouse.move = false;
    }
    mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y };
}

setInterval(mainLoop, 25);


function clearCanvas() {
    socket.emit('clear_canvas', {});
}

function changeStrokeColor(color) {
    strokeColor = color;
    context.strokeStyle = color;
}

function toggleEraser() {
    eraserOn = !eraserOn;
    if (eraserOn) {
        document.getElementById('eraser').style.backgroundColor = 'green';
        document.getElementById('drawing').style['cursor'] = 'url("/images/eraser.png"), auto';
    } else {
        document.getElementById('eraser').style.backgroundColor = '';
        document.getElementById('drawing').style['cursor'] = 'url("/images/cursor.png"), auto';
    }
}



function getCursorElement(id) {
    var elementId = 'cursor-' + id;
    var element = document.getElementById(elementId);
    if (element == null) {
        element = document.createElement('div');
        element.id = elementId;
        element.className = 'cursor';
        document.body.appendChild(element);
    }
    return element;
}


socket.on('draw_cursor', function(data) {
    var el = getCursorElement(data.id);
    console.log(data.line);
    el.style.left = data.line.x * width + 'px';
    el.style.top = data.line.y * width + 'px';
    el.style.position = "absolute";
});