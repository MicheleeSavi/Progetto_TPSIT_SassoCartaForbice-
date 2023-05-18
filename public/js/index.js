// Connessione al server tramite socket.io
const socket = io();

// Elementi del DOM (Document Object Model)
const openCreateRoomBox = document.getElementById("open-create-room-box");
const openJoinRoomBox = document.getElementById("open-join-room-box");
const createRoomBox = document.getElementById("create-room-box");
const roomIdInput = document.getElementById("room-id");
const cancelCreateActionBtn = document.getElementById("cancel-create-action");
const gameplayChoices = document.getElementById("gameplay-choices");
const createRoomBtn = document.getElementById("create-room-btn");
const gameplayScreen = document.querySelector(".gameplay-screen");
const startScreen = document.querySelector(".start-screen");
const cancelJoinActionBtn = document.getElementById("cancel-join-action");
const joinBoxRoom = document.getElementById("join-room-box");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomInput = document.getElementById("join-room-input");
const joinRandomBtn = document.getElementById("join-random");
const errorMessage = document.getElementById("error-message");
const playerOne = document.getElementById("player-1");
const playerTwo = document.getElementById("player-2");
const waitMessage = document.getElementById("wait-message");
const rock = document.getElementById("rock");
const paper = document.getElementById("paper");
const scissor = document.getElementById("scissor");
const myScore = document.getElementById('my-score');
const enemyScore = document.getElementById('enemy-score');
const playerOneTag = document.getElementById("player-1-tag");
const playerTwoTag = document.getElementById("player-2-tag");
const winMessage = document.getElementById("win-message");

//  Variabili
let canChoose = false;
let playerOneConnected = false;
let playerTwoIsConnected = false;
let playerId = 0;
let myChoice = "";
let enemyChoice = "";
let roomId = "";
let myScorePoints = 0;
let enemyScorePoints = 0;

// Quando l'utente clicca sul pulsante "Apri crea stanza", nascondi le scelte di gioco e mostra la sezione "Crea stanza"
openCreateRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    createRoomBox.style.display = "block";
})

// Quando l'utente clicca sul pulsante "Annulla" nella sezione "Crea stanza", mostra le scelte di gioco e nascondi la sezione "Crea stanza"
cancelCreateActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    createRoomBox.style.display = "none";
})

// Quando l'utente clicca sul pulsante "Crea stanza" nella sezione "Crea stanza", invia un evento al server per creare una 
// nuova stanza con l'id inserito dall'utente
createRoomBtn.addEventListener("click", function(){
    let id = roomIdInput.value;

    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("create-room", id);
})

// Quando l'utente clicca sul pulsante "Apri unisciti stanza", nascondi le scelte di gioco e mostra la sezione "Unisciti stanza"
openJoinRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    joinBoxRoom.style.display = "block";
})

// Quando l'utente clicca sul pulsante "Annulla" nella sezione "Unisciti stanza", mostra le scelte di gioco e nascondi la sezione "Unisciti stanza"
cancelJoinActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    joinBoxRoom.style.display = "none";
})

// Quando l'utente clicca sul pulsante "Unisciti" nella sezione "Unisciti stanza", invia un evento al server per unirsi alla 
// stanza con l'id inserito dall'utente
joinRoomBtn.addEventListener("click", function(){
    let id = joinRoomInput.value;

    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("join-room", id);
})

// Quando l'utente clicca sul pulsante "Unisciti a una stanza casuale", invia un evento al server per unirsi a una stanza casuale
joinRandomBtn.addEventListener("click", function(){
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";
    socket.emit("join-random");
})

// All'interno di ogni funzione, il codice controlla se il giocatore può effettuare la scelta in quel momento (tramite la variabile canChoose) 
// e se il giocatore non ha già effettuato la scelta (tramite la variabile myChoice). Inoltre, controlla se entrambi 
// i giocatori (playerOne e playerTwo) sono connessi (tramite le variabili playerOneConnected e playerTwoIsConnected).
// Se tutte le condizioni sono soddisfatte, il gioco registra la scelta del giocatore (tramite la variabile myChoice) e 
//invia i dati della scelta al server tramite l'evento "make-move" usando socket.emit().
rock.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "sasso";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

paper.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "carta";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

scissor.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "forbice";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

// Socket
// viene chiamata quando viene ricevuto un messaggio di errore dal server
socket.on("display-error", error => {
    errorMessage.style.display = "block";
    let p = document.createElement("p");
    p.innerHTML = error;
    errorMessage.appendChild(p);
})

// viene chiamata quando il server crea una nuova stanza
socket.on("room-created", id => {
    playerId = 1;
    roomId = id;

    setPlayerTag(1);

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";
})

// viene chiamata quando un client si unisce a una stanza esistente
socket.on("room-joined", id => {
    playerId = 2;
    roomId = id;

    playerOneConnected = true;
    playerJoinTheGame(1)
    setPlayerTag(2);
    setWaitMessage(false);

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";
})

// vengono chiamate quando un altro giocatore si unisce alla stanza
socket.on("player-1-connected", () => {
    playerJoinTheGame(1);
    playerOneConnected = true;
})

socket.on("player-2-connected", () => {
    playerJoinTheGame(2)
    playerTwoIsConnected = true
    canChoose = true;
    setWaitMessage(false);
});

// vengono chiamate quando un altro giocatore si disconnette dalla stanza
socket.on("player-1-disconnected", () => {
    reset()
})

socket.on("player-2-disconnected", () => {
    canChoose = false;
    playerTwoLeftTheGame()
    setWaitMessage(true);
    enemyScorePoints = 0
    myScorePoints = 0
    displayScore()
})

// viene chiamata quando la partita termina in pareggio
socket.on("draw", message => {
    setWinningMessage(message);
})

// vengono chiamate quando un giocatore vince la partita
socket.on("player-1-wins", ({myChoice, enemyChoice}) => {
    if(playerId === 1){
        let message = "Hai scelto " + myChoice + " e l'avversario " + enemyChoice + ", quindi hai vinto!";
        setWinningMessage(message);
        myScorePoints++;
    }else{
        let message = "Hai scelto " + myChoice + " e l'avversario " + enemyChoice + ", quindi hai perso!";
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore()
})

socket.on("player-2-wins", ({myChoice, enemyChoice}) => {
    if(playerId === 2){
        let message = "Hai scelto " + myChoice + " e l'avversario " + enemyChoice + ", quindi hai vinto!";
        setWinningMessage(message);
        myScorePoints++;
    }else{
        let message = "Hai scelto " + myChoice + " e l'avversario " + enemyChoice + ", quindi hai perso!";
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore()
})

// Functions

// Funzione che aggiorna i tag per i giocatori in base all'ID del giocatore passato come argomento
function setPlayerTag(playerId){
    if(playerId === 1){
        playerOneTag.innerText = "Tu (Giocatore 1)";
        playerTwoTag.innerText = "Avversario (Giocatore 2)";
    }else{
        playerOneTag.innerText = "Avversario (Giocatore 2)";
        playerTwoTag.innerText = "Tu (Giocatore 1)";
    }
}

// Funzione che indica che un giocatore si è connesso al gioco in base all'ID del giocatore passato come argomento
function playerJoinTheGame(playerId){
    if(playerId === 1){
        playerOne.classList.add("connected");
    }else{
        playerTwo.classList.add("connected");
    }
}

// Funzione che aggiunge un messaggio di attesa o lo rimuove in base al valore booleano passato come argomento
function setWaitMessage(display){
    if(display){
        let p = document.createElement("p");
        p.innerText = "Aspettando che si unisca un altro giocatore...";
        waitMessage.appendChild(p)
    }else{
        waitMessage.innerHTML = "";
    }
}

// Funzione che resetta lo stato del gioco e riporta lo schermo alle impostazioni iniziali
function reset(){
    canChoose = false;
    playerOneConnected = false;
    playerTwoIsConnected = false;
    startScreen.style.display = "block";
    gameplayChoices.style.display = "block";
    gameplayScreen.style.display = "none";
    joinBoxRoom.style.display = "none";
    createRoomBox.style.display = "none";
    playerTwo.classList.remove("connected");
    playerOne.classList.remove("connected");
    myScorePoints = 0
    enemyScorePoints = 0
    displayScore()
    setWaitMessage(true);
}

// Funzione che indica che il Giocatore 2 ha lasciato il gioco
function playerTwoLeftTheGame(){
    playerTwoIsConnected = false;
    playerTwo.classList.remove("connected");
}

// Funzione che aggiorna il punteggio sullo schermo
function displayScore(){
    myScore.innerText = myScorePoints;
    enemyScore.innerText = enemyScorePoints;
}

// Funzione che consente al giocatore di fare una scelta in base all'argomento "choice" passato (sasso, carta o forbici)
function choose(choice){
    if(choice === "sasso"){
        rock.classList.add("my-choice");
    }else if(choice === "carta"){
        paper.classList.add("my-choice");
    }else{
        scissor.classList.add("my-choice");
    }

    canChoose = false;
}

// Funzione che rimuove la scelta del giocatore in base all'argomento "choice" passato (sasso, carta o forbici)
function removeChoice(choice){
    if(choice === "sasso"){
        rock.classList.remove("my-choice");
    }else if(choice === "carta"){
        paper.classList.remove("my-choice");
    }else{
        scissor.classList.remove("my-choice");
    }

    canChoose = true;
    myChoice = "";
}

// Funzione che aggiunge un messaggio di vincita o perdita in base all'argomento "message" passato e rimuove la scelta del 
// giocatore dopo un certo periodo di tempo
function setWinningMessage(message){
    let p  = document.createElement("p");
    p.innerText = message;

    winMessage.appendChild(p);

    setTimeout(() => {
        removeChoice(myChoice)
        winMessage.innerHTML = "";
    }, 2500)
}