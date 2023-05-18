//Inizialmente, vengono importati i moduli necessari (Express.js, http, path, Socket.io) e creato l'oggetto app che rappresenta 
//l'applicazione Express. Viene poi creato un server HTTP che gestirà le richieste in ingresso.
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();

const server = http.createServer(app);

//Successivamente, viene impostata la directory public come directory statica, dove saranno memorizzati tutti i file pubblici 
//come fogli di stile, script client-side, immagini, ecc.
app.use(express.static(path.join(__dirname, "public")));

const io = socketio(server);

//Dopo aver creato l'oggetto io come istanza di Socket.io associata al server creato precedentemente, vengono importati e 
//utilizzati i moduli users.js e rooms.js. Questi moduli implementano alcune funzioni che gestiscono gli utenti connessi e 
//le stanze di gioco disponibili.
const {userConnected, connectedUsers, initializeChoices, moves, makeMove, choices} = require("./util/users");
const {createRoom, joinRoom, exitRoom, rooms} = require("./util/rooms");
const e = require("express");
const { exitCode } = require("process");


//All'interno di questo evento, vengono gestite tutte le interazioni tra server e client.
io.on("connection", socket => {
    //La funzione 'create-room' viene chiamata quando un utente crea una nuova stanza. 
    //Se la stanza già esiste, viene restituito un messaggio di errore. 
    //Altrimenti, la stanza viene creata e l'utente viene aggiunto alla stanza come player 1.
    socket.on("create-room", (roomId) => {
        if(rooms[roomId]){
            const error = "Questa stanza esiste già";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            createRoom(roomId, socket.client.id);
            socket.emit("room-created", roomId);
            socket.emit("player-1-connected");
            socket.join(roomId);
        }
    })

    //La funzione 'join-room' viene chiamata quando un utente vuole unirsi ad una stanza già esistente. 
    //Se la stanza non esiste, viene restituito un messaggio di errore. 
    //Altrimenti, l'utente viene aggiunto alla stanza come player 2.
    socket.on("join-room", roomId => {
        if(!rooms[roomId]){
            const error = "Questa stanza non esiste";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
        }
    })

    //La funzione 'join-random' viene chiamata quando un utente vuole unirsi ad una stanza casuale già esistente. 
    //La funzione cerca una stanza vuota e se ne esiste una, l'utente viene aggiunto alla stanza come player 2.
    socket.on("join-random", () => {
        let roomId = "";

        for(let id in rooms){
            if(rooms[id][1] === ""){
                roomId = id;
                break;
            }
        }

        if(roomId === ""){
            const error = "Tutte le stanza sono piene o non ne esiste nessuna";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
        }
    });

    //La funzione 'make-move' viene chiamata quando un utente effettua una mossa (rock, paper o scissors). 
    //La funzione salva la mossa dell'utente e controlla se entrambi i giocatori hanno fatto una mossa. 
    //In tal caso, viene determinato il vincitore della partita e viene inviato un messaggio a entrambi i giocatori.
    socket.on("make-move", ({playerId, myChoice, roomId}) => {
        makeMove(roomId, playerId, myChoice);

        if(choices[roomId][0] !== "" && choices[roomId][1] !== ""){
            let playerOneChoice = choices[roomId][0];
            let playerTwoChoice = choices[roomId][1];

            if(playerOneChoice === playerTwoChoice){
                let message = "Avete scelto entrambi " + playerOneChoice + ", pareggio";
                io.to(roomId).emit("draw", message);
                
            }else if(moves[playerOneChoice] === playerTwoChoice){
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }else{
                    enemyChoice = playerOneChoice;
                }

                io.to(roomId).emit("player-1-wins", {myChoice, enemyChoice});
            }else{
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }else{
                    enemyChoice = playerOneChoice;
                }

                io.to(roomId).emit("player-2-wins", {myChoice, enemyChoice});
            }

            choices[roomId] = ["", ""];
        }
    });

    //La funzione 'disconnect' viene chiamata quando un utente si disconnette dal server. 
    //La funzione controlla se l'utente era in una stanza e se sì, rimuove l'utente dalla stanza e notifica l'altro giocatore.
    socket.on("disconnect", () => {
        if(connectedUsers[socket.client.id]){
            let player;
            let roomId;

            for(let id in rooms){
                if(rooms[id][0] === socket.client.id || 
                    rooms[id][1] === socket.client.id){
                    if(rooms[id][0] === socket.client.id){
                        player = 1;
                    }else{
                        player = 2;
                    }

                    roomId = id;
                    break;
                }
            }

            exitRoom(roomId, player);

            if(player === 1){
                io.to(roomId).emit("player-1-disconnected");
            }else{
                io.to(roomId).emit("player-2-disconnected");
            }
        }
    })
})

server.listen(5000, () => console.log("Server started on port 5000..."));