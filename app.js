'use strict';

var port = process.env.PORT || 1337;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

class Player
{
    id;
    position;
    rotation;

    /**
     * @type {SocketIO.Socket}  this is the socket given when a player joins
     */
    socket;

    /**
     * @param {number} playerId this is the player ID given when a player joins
     * @param {SocketIO.Socket} playerSocket this is the socket when a player joins
     */
    constructor(playerId, playerSocket)
    {
        this.id = playerId;
        this.socket = playerSocket;
    }
}

class Room
{
    /**
     * @type {Player}  this is the player type
     */
    overlord;

    /**
     * @type {Player}  this is the player type
     */
    joe;

    /**
     * 
     * @param {Player[]} players this is an array of players
     */
    constructor(players)
    {
        for (var i = 0; i < players.length; i++)
        {
            players[i].socket.emit("matchFound", { "id": i });
            players[i].id = i;
        }

        //---------- Player Overlord
        this.overlord = players[0];

        players[0].socket.on("transformUpdate", (data) =>
        {
            players[1].socket.emit("transformUpdate", data);
        });

        players[0].socket.on("shoot", (data) =>
        {
            players[1].socket.emit("shoot", data);
        });

        players[0].socket.on("giveUp", (data) =>
        {
            players[1].socket.emit("giveUp", data);
        });

        //---------- Player Joe
        this.joe = players[1];

        players[1].socket.on("transformUpdate", (data) =>
        {
            players[0].socket.emit("transformUpdate", data);            
        });

        players[1].socket.on("pickUp", (data) => //sender
        {
            players[0].socket.emit("pickUp", data); //receiver
        });

        players[1].socket.on("giveUp", (data) =>
        {
            players[0].socket.emit("giveUp", data);
        });

        for (var i = 0; i < players.length; i++)
        {
            players[i].socket.on("disconnect", (socket) =>
            {
                if (players[0].socket === socket)
                {
                    players[1].emit("Yoo won, yay");
                }
                else
                {
                    players[0].emit("Yoo won, yay");
                }
            });
        }
    }
}

var currentId = 0;
var waitingForRoom = undefined;

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(currentId++, soc);

    console.log(newPlayer.socket.handshake.address);

    soc.on("createRoom", () => //Hosting
    {
        if (waitingForRoom === undefined) //creates room
        {
            waitingForRoom = newPlayer;

            console.log("Waiting for player 2");
        }
    });

    soc.on("findRoom", () => //Joining
    {
        if (waitingForRoom !== newPlayer) //finds room created by host
        {
            var room = new Room([newPlayer, waitingForRoom]);
            
            console.log("Player 2 has arrived");

            room.players[0].emit("startMatch");
            room.players[1].emit("startMatch");

            waitingForRoom = undefined;
        }
    })
});