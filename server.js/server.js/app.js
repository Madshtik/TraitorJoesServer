'use strict';

var port = /*process.env.PORT ||*/ 1337;
const socket = require('socket.io')(port);

console.log("Server Started");

socket.on("connection", (soc) => {
    console.log("Connection Made With Client")
})
