'use strict';

var port = /*process.env.PORT ||*/ 1337;

/**
 * @type {SocketIO.Socket[]} the currently connected players
 * */
var playerConnections = [];

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

socket.on("connection", (soc) => {
    console.log("Connection Made With Client");

    playerConnections.push(soc);

    soc.on("Sending My Position", (data) => {
        console.log(data);
        playerConnections[0].emit("PlayerMove", data);
    })
})
