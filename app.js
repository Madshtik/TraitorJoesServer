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

var waitingForRoom = undefined;
var room = undefined;

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(soc);

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

            for (var i = 0; i < room.playersArr.length; i++)
            {
                room.playersArr[i].socket.emit("startMatch");
                room.playersArr[i].id = i;

                console.log(room.playersArr[i].id);
            }
            waitingForRoom = undefined;
        }
    })

    soc.on("matchOnGoing", () => //when match is on going
    {
        console.log(room);
        //---------- Player Overlord
        room.overlord = room.playersArr[0];

        //---------- Player Joe
        room.joe = room.playersArr[1];

        room.overlord.socket.on("oLTransformUpdate", (data) => //from sender
        {
            room.joe.socket.emit("oLTransformUpdate", data); //to receiver - the Networked OL should receive this
            console.log("Hello");
        });

        room.overlord.socket.on("shoot", (data) => {
            room.joe.socket.emit("shoot", data);
        });

        room.overlord.socket.on("giveUp", (data) => {
            room.joe.socket.emit("giveUp", data);
        });

        room.joe.socket.on("joeTransformUpdate", (data) => {
            room.overlord.socket.emit("joeTransformUpdate", data); //to receiver - the Networked Joe should receive this
            console.log("Hello");
        });

        room.joe.socket.on("pickUp", (data) => {
            room.overlord.socket.emit("pickUp", data);
        });

        room.joe.socket.on("giveUp", (data) => {
            room.overlord.socket.emit("giveUp", data);
        });

        for (var i = 0; i < room.playersArr.length; i++) {
            room.playersArr[i].socket.on("disconnect", (socket) => {
                if (room.overlord.socket === socket) {
                    room.joe.emit("winMsg");
                }
                else {
                    room.overlord.emit("winMsg");
                }
            });
        }
    });
});