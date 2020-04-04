'use strict';

var port = /*process.env.PORT ||*/ 1337;
var currentId = 0;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

/**
 * @type {Player[]} array to store new players
 * */
playersArr = [];

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
        //---------- Player Overlord
        this.overlord = players[0];
        this.overlord.socket.on("shoot", (data) => //sender
        {
            this.joe.socket.emit("shoot", data); //sendee
        });

        players[0].socket.on("transformUpdate", (data) =>
        {
            players[1].socket.emit("transformUpdate", data);
        });

        players[0].socket.on("giveUp", (data) =>
        {

        });

        //---------- Player Joe
        this.joe = players[1];
        this.joe.socket.on("pickUp", (data) => //sender
        {
            this.overlord.socket.emit("pickUp", data); //sendee
        });

        players[1].socket.on("transformUpdate", (data) =>
        {
            players[0].socket.emit("transformUpdate", data);
        });

        players[1].socket.on("giveUp", (data) =>
        {
            
        });

        //function <= attempt this on everything above to make it look cleaner

        for (var i = 0; i < players.length; i++)
        {
            players[i].socket.on("disconnect", (socket) =>
            {
                if (this.overlord.socket === socket)
                {
                    this.joe.socket.emit("youWin")
                }
                else
                {
                    this.overlord.socket.emit("youWin")
                }
            });
        }
        
    }
}

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(currentId++, soc)

    waitingForRoom = undefined;
    playersArr.push(newPlayer);

    soc.on("findRoom", () => //matchmaking
    {
        if (waitingForRoom === undefined)
        {
            waitingForRoom = newPlayer;
        }
        else
        {
            var match = new Room([newPlayer, waitingForRoom])
            waitingForRoom = undefined;
        }
    })
});