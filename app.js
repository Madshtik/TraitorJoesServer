'use strict';

var port = /*process.env.PORT ||*/ 1337;

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
        //---------- Player Overlord
        this.overlord = players[0];
        players[0].socket.on("transformUpdate", (data) =>
        {
            players[1].socket.emit("transformUpdate", data);
        });

        players[0].socket.on("shoot", (data) => //sender
        {
            this.joe.socket.emit("shoot", data); //sendee
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
            this.overlord.socket.emit("pickUp", data); //sendee
        });

        players[1].socket.on("giveUp", (data) =>
        {
            players[0].socket.emit("giveUp", data);
        });

        //function <= attempt this on everything above to make it look cleaner
    }
}

/**
 * @type {Player[]} array to store new players
 * */
var playersArr = [];
var currentId = 0;

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(currentId++, soc)
    var waitingForRoom = undefined;
    playersArr.push(newPlayer);

    soc.on("findRoom", () => //matchmaking
    {
        if (waitingForRoom === undefined) {
            waitingForRoom = newPlayer;
        }
        else
        {
            var newRoom = new Room([newPlayer, waitingForRoom])
            waitingForRoom = undefined;
        }
    });

    console.log("I am the client");
});