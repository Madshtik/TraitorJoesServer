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
var roomArr = [];

socket.on("connection", (soc) =>
{
    var newPlayer = new Player(soc);
    //pArr.push(newPlayer);

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
            roomArr.push(new Room([newPlayer, waitingForRoom]));

            console.log("Player 2 has arrived");

            for (var i = 0; i < roomArr[0].playersArr.length; i++) {
                roomArr[0].playersArr[i].socket.emit("startMatch");
                roomArr[0].playersArr[i].id = i;

                console.log(roomArr[0].playersArr[i].id);
            }
            waitingForRoom = undefined;

            matchStarted = true;
        }
    });

    //if (pArr[1] === newPlayer) {
    //    pArr[0].socket.on("transformUpdate", (data) => //from sender
    //    {
    //        pArr[1].socket.emit("transformUpdate", data); //to receiver - the Networked OL should receive this
    //        console.log(data);
    //    });
    //}

    if (matchStarted)
    {
        for (var i = 0; i < roomArr[0].playersArr.length; i++) {
            roomArr[0].playersArr[i].socket.on("position", (data) => {

                console.log("Adele Song");

                if (roomArr[0].overlord.socket === socket) {
                    roomArr[0].joe.emit("position", data);
                    console.log("Adele 2");

                }
                else {
                    roomArr[0].overlord.emit("position", data);
                    console.log("Adele 3");

                }
            });
        }
        //---------- Player Overlord
        roomArr[0].overlord = roomArr[0].playersArr[0];

        //---------- Player Joe
        roomArr[0].joe = roomArr[0].playersArr[1];

        roomArr[0].overlord.socket.on("transformUpdate", (data) => //from sender
        {
            roomArr[0].joe.socket.emit("transformUpdate", data); //to receiver - the Networked OL should receive this
            console.log("Hello");
        });

        roomArr[0].overlord.socket.on("shoot", (data) => {
            roomArr[0].joe.socket.emit("shoot", data);
        });

        roomArr[0].overlord.socket.on("giveUp", (data) => {
            roomArr[0].joe.socket.emit("giveUp", data);
        });

        roomArr[0].joe.socket.on("transformUpdate", (data) => {
            roomArr[0].overlord.socket.emit("transformUpdate", data); //to receiver - the Networked Joe should receive this
            console.log("Hello");
        });

        roomArr[0].joe.socket.on("pickUp", (data) => {
            roomArr[0].overlord.socket.emit("pickUp", data);
        });

        roomArr[0].joe.socket.on("giveUp", (data) => {
            roomArr[0].overlord.socket.emit("giveUp", data);
        });

        for (var i = 0; i < roomArr[0].playersArr.length; i++) {
            roomArr[0].playersArr[i].socket.on("disconnect", (socket) => {
                if (roomArr[0].overlord.socket === socket) {
                    roomArr[0].joe.socket.emit("winMsg");
                }
                else {
                    roomArr[0].overlord.socket.emit("winMsg");
                }
            });
        }
    }
});