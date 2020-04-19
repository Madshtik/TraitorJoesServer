'use strict';

var port = process.env.PORT || 1337;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

class Player
{
    //id;
    //position;
    //rotation;

    /**
     * @type {SocketIO.Socket}  this is the socket given when a player joins
     */
    socket;

    /**
     * @param {SocketIO.Socket} playerSocket this is the socket when a player joins
     */
    constructor(playerSocket)
    {
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
    }
}

var matchStarted = false;
var waitingForRoom = undefined;
var room = undefined;
var pArr = [];

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(soc);
    pArr.push(newPlayer);

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
            room = new Room([newPlayer, waitingForRoom]);

            console.log("Player 2 has arrived");

            for (var i = 0; i < room.playersArr.length; i++) {
                room.playersArr[i].socket.emit("startMatch");
                room.playersArr[i].id = i;

                console.log(room.playersArr[i].id);
            }
            waitingForRoom = undefined;

            matchStarted = true;
        }

        if (matchStarted)
        {
            console.log("0");
            
            //---------- Player Overlord
            room.overlord = room.playersArr[0];

            //---------- Player Joe
            room.joe = room.playersArr[1];

            room.overlord.socket.on("transformUpdate", (data) => //from sender
            {
                room.joe.socket.emit("transformUpdate", data); //to receiver - the Networked OL should receive this
                console.log("1");
            });

            room.overlord.socket.on("shoot", (data) =>
            {
                room.joe.socket.emit("shoot", data);
                console.log("2");
            });

            room.overlord.socket.on("giveUp", (data) =>
            {
                room.joe.socket.emit("giveUp", data);
                console.log("3");
            });

            room.joe.socket.on("transformUpdate", (data) =>
            {
                room.overlord.socket.emit("transformUpdate", data); //to receiver - the Networked Joe should receive this
                console.log("4");
            });

            room.joe.socket.on("pickUp", (data) =>
            {
                room.overlord.socket.emit("pickUp", data);
                console.log("5");
            });

            room.joe.socket.on("giveUp", (data) =>
            {
                room.overlord.socket.emit("giveUp", data);
                console.log("6");
            });

            for (var i = 0; i < room.playersArr.length; i++) {
                room.playersArr[i].socket.on("disconnect", (socket) => {
                    if (room.overlord.socket === socket) {
                        room.joe.socket.emit("winMsg");
                    }
                    else {
                        room.overlord.socket.emit("winMsg");
                    }
                });
            }
        }
    });

    //if (pArr[1] === newPlayer) {
    //    pArr[0].socket.on("transformUpdate", (data) => //from sender
    //    {
    //        pArr[1].socket.emit("transformUpdate", data); //to receiver - the Networked OL should receive this
    //        console.log(data);
    //    });
    //}
});