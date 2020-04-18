'use strict';

var port = process.env.PORT || 1337;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

/**
 * @type {SocketIO.Socket[]} js is a bitch
 * */
var playersArr=[];

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
     * @param {SocketIO.Socket} p1 this is player 1
     * @param {SocketIO.Socket} p2 this is player 2
     */
    constructor(p1, p2)
    {
        playersArr.push(p1);
        playersArr.push(p2);

        //for (var i = 0; i < this.players.length; i++)
        //{
        //    this.players[i].socket.emit("matchFound", { "id": i });
        //    this.players[i].id = i;
        //}

        ////---------- Player Overlord
        //this.overlord = this.players[0];
        ////---------- Player Joe
        //this.joe = players[1];

        //this.overlord.socket.on("transformUpdate", (data) =>
        //{
        //    this.joe.socket.emit("transformUpdate", data);
        //});

        //this.overlord.socket.on("shoot", (data) =>
        //{
        //    this.joe.socket.emit("shoot", data);
        //});

        //this.overlord.socket.on("giveUp", (data) =>
        //{
        //    this.joe.socket.emit("giveUp", data);
        //});

        //this.joe.socket.on("transformUpdate", (data) =>
        //{
        //    this.overlord.socket.emit("transformUpdate", data);            
        //});

        //this.joe.socket.on("pickUp", (data) => //sender
        //{
        //    this.overlord.socket.emit("pickUp", data); //receiver
        //});

        //this.joe.socket.on("giveUp", (data) =>
        //{
        //    this.overlord.socket.emit("giveUp", data);
        //});

        //for (var i = 0; i < this.players.length; i++)
        //{
        //    this.players[i].socket.on("disconnect", (socket) =>
        //    {
        //        if (this.overlord.socket === socket)
        //        {
        //            this.joe.emit("Yoo won, yay");
        //        }
        //        else
        //        {
        //            this.overlord.emit("Yoo won, yay");
        //        }
        //    });
        //}
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
            var room = new Room(waitingForRoom.playerSocket, newPlayer.playerSocket);

            //console.log(room.overlord);

            for (var i = 0; i < playersArr.length; i++)
            {
                playersArr[i].socket.emit("startMatch");
            }

            waitingForRoom = undefined;
        }
    })
});