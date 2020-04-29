'use strict';

var port = process.env.PORT || 1337;

const socket = require("socket.io")(port);

console.log("Port Number:", port);
console.log("Server Started");

class Player {
    id;

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
     * @type {Player[]} this is an array of players
     */
    playersArr = [];

    /**
     * @param {Player[]} players this is an array of players
     */

    constructor(players) {
        this.playersArr = players;

        //Player Overlord
        this.overlord = this.playersArr[0];

        //Player Joe
        this.joe = this.playersArr[1];

        this.overlord.socket.on("shotHit", (data) => {
            this.joe.socket.emit("shotHit", data);
            console.log("Message Received");
        });
        this.joe.socket.on("shotHit", (data) => {
            console.log("Wrong Received");
        });
        //sender
        this.joe.socket.on("pickUp", (data) => {
            this.overlord.socket.emit("pickUp", data); //receiver
        });

        for (let i = 0; i < this.playersArr.length; i++) {
            this.playersArr[i].socket.on("giveUp", (data) => {
                this.playersArr[1 - i].socket.emit("giveUp", data);
            });
        }

        for (let i = 0; i < this.playersArr.length; i++) {
            this.playersArr[i].socket.on("transformUpdate", (data) => {
                this.playersArr[1 - i].socket.emit("transformUpdate", data);
            });
        }

        for (var i = 0; i < this.playersArr.length; i++) {
            this.playersArr[i].socket.on("disconnect", (socket) => {
                if (this.overlord.socket === socket) {
                    this.joe.socket.emit("disconMsg");
                }
                else {
                    this.overlord.socket.emit("disconMsg");
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
