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
     * @type {Player[]} this is an array of players
     */
    playersArr = [];

    /**
     * 
     * @param {Player[]} players this is an array of players
     */
    constructor(players)
    {
        this.playersArr = players;

        for (var i = 0; i < players.length; i++)
        {
            players[i].socket.emit("matchFound", { "id": i });
            players[i].id = i;
        }

        //---------- Player Overlord
        this.overlord = players[0];

        //---------- Player Joe
        this.joe = players[1];

        this.overlord.socket.on("transformUpdate", (data) =>
        {
            this.joe.socket.emit("transformUpdate", data);
        });

        this.overlord.socket.on("shoot", (data) =>
        {
            this.joe.socket.emit("shoot", data);
        });

        this.overlord.socket.on("giveUp", (data) =>
        {
            this.joe.socket.emit("giveUp", data);
        });


        this.joe.socket.on("transformUpdate", (data) =>
        {
            this.overlord.socket.emit("transformUpdate", data);            
        });

        this.joe.socket.on("pickUp", (data) => //sender
        {
            this.overlord.socket.emit("pickUp", data); //receiver
        });

        this.joe.socket.on("giveUp", (data) =>
        {
            this.overlord.socket.emit("giveUp", data);
        });

        for (var i = 0; i < players.length; i++)
        {
            players[i].socket.on("disconnect", (socket) =>
            {
                if (this.overlord.socket === socket)
                {
                    this.joe.emit("Yoo won, yay");
                }
                else
                {
                    this.overlord.emit("Yoo won, yay");
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

            for (var i = 0; i < room.players.length; i++)
            {
                room.players[i].socket.emit("startMatch");
            }

            waitingForRoom = undefined;
        }
    })
});