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

        //---------- Player Overlord
        this.overlord = this.playersArr[0];

        //---------- Player Joe
        this.joe = this.playersArr[1];

        this.overlord.socket.on("oLTransformUpdate", (data) => //from sender
        {
            this.joe.socket.emit("oLTransformUpdate", data); //to receiver - the Networked OL should receive this
            console.log("Hello");
        });

        this.overlord.socket.on("shoot", (data) =>
        {
            this.joe.socket.emit("shoot", data);
        });

        this.overlord.socket.on("giveUp", (data) =>
        {
            this.joe.socket.emit("giveUp", data);
        });

        this.joe.socket.on("joeTransformUpdate", (data) =>
        {
            this.overlord.socket.emit("joeTransformUpdate", data); //to receiver - the Networked Joe should receive this
            console.log("Hello");
        });

        this.joe.socket.on("pickUp", (data) =>
        {
            this.overlord.socket.emit("pickUp", data);
        });

        this.joe.socket.on("giveUp", (data) =>
        {
            this.overlord.socket.emit("giveUp", data);
        });

        for (var i = 0; i < this.playersArr.length; i++)
        {
            this.playersArr[i].socket.on("disconnect", (socket) =>
            {
                if (this.overlord.socket === socket)
                {
                    this.joe.emit("winMsg");
                }
                else
                {
                    this.overlord.emit("winMsg");
                }
            });
        }
    }
}

var waitingForRoom = undefined;

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
            var room = new Room([newPlayer, waitingForRoom]);
            
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
});