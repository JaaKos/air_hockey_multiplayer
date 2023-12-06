const WebSocket = require("ws");
let portNumber = process.argv[2] ? parseInt(process.argv[2]) : 8082;

if (!process.argv[2])
{
    console.log("Starting server on default port", portNumber,"\nFor custom port, enter a number (1-65535) in the launch command.");
} 
else 
{
    console.log("Starting server on port", portNumber);
}

const wss = new WebSocket.Server({port: portNumber});
let pelaaja1;
let pelaaja2;
let pelaajatpos = [{x: 300, y: 700}, {x: 300, y: 100}];
let kiekkopos = {x: 300, y: 400};
let kiekkospeed = {x: 0, y: 0};
const canvasX = 600;
const canvasY = 800;
let giveHost = true;

wss.on("connection", ws => 
{
    console.log("New user connected");
    if (giveHost)
    {
        pelaaja1 = ws;
        giveHost = false;
        ws.send("pelaaja1");
    } 
    else if (wss.clients.size == 2)
    {
        pelaaja2 = ws;
        ws.send("pelaaja2");
    }
    else if (wss.clients.size >= 3) ws.send("spectator");

    ws.on("close", () =>
    {
        if (ws == pelaaja1) giveHost = true;
    });

    ws.on("message", data =>
    {
        const output = new Buffer.from(data, 'hex').toString();
        //console.log(output);
        if (output.indexOf("pos") === 0)
        {
            let values = output.match(/[+-]?\d+/g);
            if (output.indexOf("pospelaaja1") === 0)
            {
                pelaajatpos[0].x = values[1];
                pelaajatpos[0].y = values[2];
            } 
            else if (output.indexOf("pospelaaja2") === 0)
            {
                pelaajatpos[1].x = values[1];
                pelaajatpos[1].y = values[2];
            } 
            collisionCheck();
            wss.clients.forEach(client => client.send(output));
        }
        if (output.indexOf("request") === 0)
        {
            sendKiekkoPos();
        }
    });
});

function sendKiekkoPos()
{
    kiekkopos.x += kiekkospeed.x;
    kiekkopos.y += kiekkospeed.y;
    if (kiekkopos.x < 25 + 1 || kiekkopos.x > canvasX-25-1) kiekkospeed.x *= -1;
    if (kiekkopos.y < 25 + 1 || kiekkopos.y > canvasY-25-1) kiekkospeed.y *= -1;
    if (kiekkopos.x < 26) kiekkopos.x = 26
    if (kiekkopos.x > canvasX - 26) kiekkopos.x = canvasX-26;
    if (kiekkopos.y < 26) kiekkopos.y = 26;
    if (kiekkopos.y > canvasY - 26) kiekkopos.y = canvasY-26;
    if (kiekkopos.x > canvasX/2-90 && kiekkopos.x < canvasX/2+90 && kiekkopos.y < 40) resetKiekko("maalip1");
    if (kiekkopos.x > canvasX/2-90 && kiekkopos.x < canvasX/2+90 && kiekkopos.y > canvasY-40) resetKiekko("maalip2");
    collisionCheck();
    wss.clients.forEach(client => client.send("kiekkopos " + kiekkopos.x + " " + kiekkopos.y));
}

function collisionCheck()
{
    for (let i = 0; i < 2; i++)
    {
        let distance = Math.hypot(pelaajatpos[i].x - kiekkopos.x, pelaajatpos[i].y - kiekkopos.y);
        if (distance < 45)
        {
            let collisionAngle = Math.atan2(kiekkopos.y-pelaajatpos[i].y, kiekkopos.x-pelaajatpos[i].x);
            kiekkospeed.x = Math.cos(collisionAngle)*10;
            kiekkospeed.y = Math.sin(collisionAngle)*10;
            kiekkopos.x += Math.cos(collisionAngle)*5, 
            kiekkopos.y += Math.sin(collisionAngle)*5;
        }
    }
}

function resetKiekko(msg)
{
    wss.clients.forEach(client => client.send(msg));
    kiekkopos.x = 300;
    kiekkopos.y = 400;
    kiekkospeed.x = 0;
    kiekkospeed.y = 0;
}