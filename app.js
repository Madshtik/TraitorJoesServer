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
     * @type {Player[]} players array
     */
    players;

    /** 
     *  
     * @param {Player} p1 this is player 1
     * @param {Player} p2 this is player 2
     */
    constructor(p1, p2)
    {
        this.players.push(p1);
        this.players.push(p2);

        for (var i = 0; i < this.players.length; i++)
        {
            this.players[i].socket.emit("matchFound", { "id": i });
            this.players[i].id = i;
        }

        //---------- Player Overlord
        this.overlord = this.players[0];

        this.players[0].socket.on("transformUpdate", (data) =>
        {
            this.players[1].socket.emit("transformUpdate", data);
        });

        this.players[0].socket.on("shoot", (data) =>
        {
            this.players[1].socket.emit("shoot", data);
        });

        this.players[0].socket.on("giveUp", (data) =>
        {
            this.players[1].socket.emit("giveUp", data);
        });

        //---------- Player Joe
        this.joe = players[1];

        this.players[1].socket.on("transformUpdate", (data) =>
        {
            this.players[0].socket.emit("transformUpdate", data);            
        });

        this.players[1].socket.on("pickUp", (data) => //sender
        {
            this.players[0].socket.emit("pickUp", data); //receiver
        });

        this.players[1].socket.on("giveUp", (data) =>
        {
            this.players[0].socket.emit("giveUp", data);
        });

        for (var i = 0; i < this.players.length; i++)
        {
            this.players[i].socket.on("disconnect", (socket) =>
            {
                if (this.players[0].socket === socket)
                {
                    this.players[1].emit("Yoo won, yay");
                }
                else
                {
                    this.players[0].emit("Yoo won, yay");
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

            console.log(room.overlord);

            for (var i = 0; i < room.players.length; i++)
            {
                room.players[i].socket.emit("startMatch");
            }

            waitingForRoom = undefined;
        }
    })
});