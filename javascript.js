const ws = new WebSocket('ws://localhost:8082');

let timestamp = Date.now();
let elapsedTime = 0;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let vastustajanMaalit = 0;
document.getElementById("vastustajanMaalit").innerHTML = vastustajanMaalit;
let pelaajanMaalit = 0;
document.getElementById("pelaajanMaalit").innerHTML = pelaajanMaalit;
let identifier;

ws.addEventListener("message", e => {
    if (e.data.indexOf("spectator") === 0)
    {
        identifier = e.data;
    }
    if (e.data.indexOf("pelaaja") === 0)
    {
        identifier = e.data;
    }
    if (e.data.indexOf("pos") === 0)
    {
        let values = e.data.match(/[+-]?\d+/g)
        ohjaimet[values[0]-1].setPos(values[1], values[2]);
    }
    if (e.data.indexOf("kiekkopos") === 0)
    {
        let values = e.data.match(/[+-]?\d+(\.\d+)?/g);
        kiekko.setPos(values[0], values[1]);
    }
    if (e.data.indexOf("maali") === 0)
    {
        if (e.data.indexOf("maalip1") === 0)
        {
            pelaajanMaalit++;
            document.getElementById("pelaajanMaalit").innerHTML = pelaajanMaalit;
        }
        if (e.data.indexOf("maalip2") === 0)
        {
            vastustajanMaalit++;
            document.getElementById("vastustajanMaalit").innerHTML = vastustajanMaalit;
        }
    }
});

class esine
{
    constructor(xpos, ypos, radius, color)
    {
        this.xpos = xpos;
        this.ypos = ypos;
        this.radius = radius;
        this.color = color;
        this.speed = {x:0, y:0}
    }
    setPos(xpos, ypos)
    {
        if (xpos < this.radius) xpos = this.radius;
        if (xpos > canvas.width-this.radius) xpos = canvas.width-this.radius;
        if (ypos < this.radius) ypos = this.radius; 
        if (ypos > canvas.height-this.radius) ypos = canvas.height-this.radius;
        this.xpos = xpos;
        this.ypos = ypos;
    }

    setSpeed(speed)
    {
        this.speed = speed;
    }

    draw(ctx)
    {
        ctx.fillStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.xpos, this.ypos, this.radius, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.fill();
    }
}

class ohjattava extends esine 
{
    updateStatus()
    {
        if (identifier === "spectator") return;
        onmousemove = (e) =>
        {
            let pos = getMousePos(canvas, e);
            ws.send("pos" + identifier + " " + pos.x + " " + pos.y);
        }
    }
}

class maali
{
    constructor(xpos,ypos,vastustajanMaali)
    {
        this.status = vastustajanMaali;
        this.xpos = xpos;
        this.ypos = ypos;
        this.xpos2 = xpos + 180;
        this.ypos2 = ypos + 40;
    }
    draw(ctx)
    {
        ctx.beginPath();
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.xpos, this.ypos, 180, 40);
    }
}

function getMousePos(canvas, evt) 
{
    var rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(evt.clientX - rect.left),
      y: Math.round(evt.clientY - rect.top)
    };
}

function drawFrame()
{
    if (identifier === "pelaaja1") ws.send("request");
    elapsedTime = Date.now()-timestamp;
    timestamp = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < maalit.length; i++)
    {
        maalit[i].draw(ctx);
    }
    for (let i = 0; i < ohjaimet.length; i++)
    {
        ohjaimet[i].updateStatus();
        ohjaimet[i].draw(ctx);
    }
    kiekko.draw(ctx);

    requestAnimationFrame(drawFrame);
}

let ohjaimet = [new ohjattava(300, 700, 25, "red"), new ohjattava(300, 100, 25, "green")];
let maalit = [new maali(canvas.width/2-90, canvas.height-40, 0), new maali(canvas.width/2-90, 0, 1)]
const kiekko = new esine(canvas.width/2, canvas.height/2, 20, "black");
drawFrame();