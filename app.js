'use strict';

var port = process.env.PORT || 1337;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

class Player {
    id;
    //position;
    //rotation;

    /**
     * @type {SocketIO.Socket}  this is the socket given when a player joins
     */
    socket;

    /**
     * @param {SocketIO.Socket} playerSocket this is the socket when a player joins
     */
    constructor(playerSocket) {
        this.socket = playerSocket;
    }
}

class Room {
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
    constructor(players) {
        this.playersArr = players;

        //---------- Player Overlord
        this.overlord = this.playersArr[0];

        //---------- Player Joe
        this.joe = this.playersArr[1];
        for (let i = 0; i < this.playersArr.length; i++) {
            this.playersArr[i].socket.on("transformUpdate", (data) => {
                this.playersArr[1 - i].socket.emit("transformUpdate", data);
            });
        }
        this.overlord.socket.on("shoot", (data) => {
            this.joe.socket.emit("shoot", data);
        });

        this.overlord.socket.on("giveUp", (data) => {
            this.joe.socket.emit("giveUp", data);
        });

        this.joe.socket.on("pickUp", (data) => //sender
        {
            this.overlord.socket.emit("pickUp", data); //receiver
        });

        this.joe.socket.on("giveUp", (data) => {
            this.overlord.socket.emit("giveUp", data);
        });

        for (var i = 0; i < this.playersArr.length; i++) {
            this.playersArr[i].socket.on("disconnect", (socket) => {
                if (this.overlord.socket === socket) {
                    this.joe.emit("winMsg");
                }
                else {
                    this.overlord.emit("winMsg");
                }
            });
        }
    }
}

var waitingForRoom = undefined;

socket.on("connection", (soc) => {
    var newPlayer = new Player(soc);

    console.log(newPlayer.socket.handshake.address);

    soc.on("findRoom", () => //Joining
    {
        console.log("Hello");
        if (waitingForRoom !== newPlayer && waitingForRoom !== undefined) //finds room created by host
        {
            var room = new Room([newPlayer, waitingForRoom]);

            console.log("Player 2 has arrived");

            var data;
            var dataJSON;

            for (var i = 0; i < room.playersArr.length; i++) {
                room.playersArr[i].socket.emit("startMatch", { "id": i });
                room.playersArr[i].id = i;

                console.log(room.playersArr[i].id);
            }
            waitingForRoom = undefined;
        }
        else if (waitingForRoom === undefined) //creates room
        {
            waitingForRoom = newPlayer;

            console.log("Waiting for player 2");
        }
    })
});
