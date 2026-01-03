// ========================================
// GLOBAL VARIABLES
// ========================================
let currentRoomId = null;
let timerInterval = null;
let username = null; // Store user's name
let lobbyTimersInterval = null; // For updating lobby room timers
let roomsData = []; // Store rooms data for live updates

// ========================================
// SOCKET CONNECTION
// ========================================
const socket = io();

socket.on("connect", () => {
    console.log("✓ Connected to server! Socket ID:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("✗ Connection error:", error);
    alert("Cannot connect to server! Make sure server is running on port 3000.");
});

// ========================================
// DOM ELEMENTS
// ========================================
// Username screen
const usernameScreen = document.getElementById("usernameScreen");
const usernameInput = document.getElementById("usernameInput");
const setUsernameBtn = document.getElementById("setUsernameBtn");

// Lobby
const lobby = document.getElementById("lobby");
const displayUsername = document.getElementById("displayUsername");
const roomNameInput = document.getElementById("roomNameInput");
const durationInput = document.getElementById("durationInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const roomsList = document.getElementById("roomsList");

// Chat Room
const chatRoom = document.getElementById("chatRoom");
const currentRoomName = document.getElementById("currentRoomName");
const roomTimer = document.getElementById("roomTimer");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ========================================
// USERNAME SETUP
// ========================================
setUsernameBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    
    if (name === "") {
        alert("Please enter your name!");
        return;
    }
    
    if (name.length < 2) {
        alert("Name must be at least 2 characters!");
        return;
    }
    
    // Store username
    username = name;
    displayUsername.textContent = username;
    
    // Tell server about username
    socket.emit("setUsername", username);
    
    // Hide username screen, show lobby
    usernameScreen.style.display = "none";
    lobby.style.display = "block";
});

// Allow Enter key to set username
usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        setUsernameBtn.click();
    }
});

// ========================================
// CREATE ROOM
// ========================================
createRoomBtn.addEventListener("click", () => {
    const roomName = roomNameInput.value.trim();
    const duration = parseInt(durationInput.value);

    if (roomName === "") {
        alert("Please enter a room name!");
        return;
    }

    if (duration < 1 || duration > 60) {
        alert("Duration must be between 1 and 60 minutes!");
        return;
    }

    socket.emit("createRoom", {
        roomName: roomName,
        duration: duration
    });

    roomNameInput.value = "";
    durationInput.value = "5";
});

// ========================================
// ROOM CREATED
// ========================================
socket.on("roomCreated", (data) => {
    const { roomId, roomName } = data;
    socket.emit("joinRoom", roomId);
});

// ========================================
// ROOMS LIST
// ========================================
socket.on("roomsList", (rooms) => {
    console.log("Received rooms list:", rooms);
    
    // Store rooms data with current time
    roomsData = rooms.map(room => ({
        ...room,
        receivedAt: Date.now() // Store when we received this data
    }));
    
    updateRoomsList();
    
    // Start live timer updates for lobby
    startLobbyTimers();
});

function updateRoomsList() {
    roomsList.innerHTML = "";

    if (roomsData.length === 0) {
        roomsList.innerHTML = '<li style="color: #999; text-align: center; padding: 20px;">No active rooms. Create one!</li>';
        return;
    }
    
    roomsData.forEach(room => {
        const li = document.createElement("li");
        li.className = "room-item";
        li.setAttribute("data-room-id", room.id);

        // Calculate current time left
        const timePassed = Math.floor((Date.now() - room.receivedAt) / 1000);
        const currentTimeLeft = Math.max(0, room.timeLeft - timePassed);
        
        const minutes = Math.floor(currentTimeLeft / 60);
        const seconds = currentTimeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        li.innerHTML = `
            <div class="room-info">
                <div class="room-name">${room.name}</div>
                <div class="room-details">
                    👥 ${room.userCount} users | 
                    <span class="timer" data-time-left="${currentTimeLeft}">⏱️ ${timeString}</span>
                </div>
            </div>
            <button onclick="window.joinRoom('${room.id}')">Join</button>
        `;

        roomsList.appendChild(li);
    });
}

function startLobbyTimers() {
    // Clear existing interval
    if (lobbyTimersInterval) {
        clearInterval(lobbyTimersInterval);
    }
    
    // Update every second
    lobbyTimersInterval = setInterval(() => {
        // Only update if lobby is visible
        if (lobby.style.display === "none") {
            return;
        }
        
        const timerElements = document.querySelectorAll("#roomsList .timer");
        let hasExpiredRooms = false;
        
        timerElements.forEach(timerEl => {
            const currentTimeLeft = parseInt(timerEl.getAttribute("data-time-left"));
            
            if (currentTimeLeft <= 0) {
                hasExpiredRooms = true;
                return;
            }
            
            const newTimeLeft = currentTimeLeft - 1;
            timerEl.setAttribute("data-time-left", newTimeLeft);
            
            const minutes = Math.floor(newTimeLeft / 60);
            const seconds = newTimeLeft % 60;
            timerEl.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Change color when under 1 minute
            if (newTimeLeft < 60) {
                timerEl.style.color = "#e74c3c";
                timerEl.style.fontWeight = "bold";
            }
        });
        
        // If any room expired, the server will send updated list soon
        // So we don't need to do anything special here
    }, 1000);
}

// ========================================
// JOIN ROOM
// ========================================
window.joinRoom = function(roomId) {
    console.log("Joining room:", roomId);
    socket.emit("joinRoom", roomId);
}

// ========================================
// JOINED ROOM
// ========================================
socket.on("joinedRoom", (data) => {
    const { roomId, roomName, timeLeft } = data;

    currentRoomId = roomId;
    currentRoomName.textContent = roomName;
    
    lobby.style.display = "none";
    chatRoom.style.display = "block";

    messages.innerHTML = "";
    addSystemMessage(`Welcome to "${roomName}"! This room will self-destruct.`);

    startCountdownTimer(timeLeft);
    
    // Stop lobby timers when entering a room
    if (lobbyTimersInterval) {
        clearInterval(lobbyTimersInterval);
    }
});

// ========================================
// COUNTDOWN TIMER
// ========================================
function startCountdownTimer(initialSeconds) {
    let secondsLeft = initialSeconds;

    updateTimerDisplay(secondsLeft);

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        secondsLeft--;
        updateTimerDisplay(secondsLeft);

        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    roomTimer.textContent = `⏱️ Time left: ${minutes}:${secs.toString().padStart(2, '0')}`;

    if (seconds < 60) {
        roomTimer.style.color = "#e74c3c";
    }
}

// ========================================
// SEND MESSAGE
// ========================================
sendBtn.addEventListener("click", () => {
    sendMessage();
});

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const msg = messageInput.value.trim();

    if (msg === "") {
        return;
    }

    socket.emit("chatMessage", {
        roomId: currentRoomId,
        message: msg,
        username: username
    });

    messageInput.value = "";
}

// ========================================
// RECEIVE MESSAGE
// ========================================
socket.on("chatMessage", (data) => {
    const { message, senderId, timestamp, username: senderName } = data;

    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper";
    
    // Check if it's your message
    const isOwn = senderId === socket.id;
    wrapper.classList.add(isOwn ? "own" : "other");

    const messageDiv = document.createElement("div");
    messageDiv.className = "message";

    // Format time properly
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Show sender name (or "You")
    const displayName = isOwn ? "You" : senderName;

    messageDiv.innerHTML = `
        <div class="message-sender">${displayName}</div>
        <div class="message-text">${message}</div>
        <div class="message-time">${timeString}</div>
    `;

    wrapper.appendChild(messageDiv);
    messages.appendChild(wrapper);

    // Auto-scroll to bottom
    messages.scrollTop = messages.scrollHeight;
});

// ========================================
// USER JOINED/LEFT
// ========================================
socket.on("userJoined", (data) => {
    addSystemMessage(data.message);
});

socket.on("userLeft", (data) => {
    addSystemMessage(data.message);
});

// ========================================
// ROOM EXPIRED
// ========================================
socket.on("roomExpired", (data) => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    messages.innerHTML = `
        <div class="expired-message">
            💣 ${data.message}
            <br><br>
            All messages have been destroyed.
        </div>
    `;

    messageInput.disabled = true;
    sendBtn.disabled = true;

    setTimeout(() => {
        leaveRoomToLobby();
    }, 3000);
});

// ========================================
// LEAVE ROOM
// ========================================
leaveRoomBtn.addEventListener("click", () => {
    if (currentRoomId) {
        socket.emit("leaveRoom", currentRoomId);
    }
    leaveRoomToLobby();
});

function leaveRoomToLobby() {
    currentRoomId = null;
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    messageInput.disabled = false;
    sendBtn.disabled = false;

    lobby.style.display = "block";
    chatRoom.style.display = "none";
    
    // Restart lobby timers when returning to lobby
    startLobbyTimers();
}

// ========================================
// SYSTEM MESSAGE
// ========================================
function addSystemMessage(text) {
    const div = document.createElement("div");
    div.className = "system-message";
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// ========================================
// ERROR HANDLING
// ========================================
socket.on("error", (data) => {
    alert("Error: " + data.message);
});