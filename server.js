const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 3000;

//respond with static files from 'public' folder when asked
app.use(express.static("public"));

// Serve index.html as homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server);

// IN-MEMORY STORAGE
const rooms = {}; 
// Structure: { roomId: { name, users, createdAt, timer, duration } }

const users = {};
// Structure: { socketId: { username } }

// FUNCTIONS
// To generate unique room ID (like "room_abc123")
function generateRoomId() {
    return "room_" + Math.random().toString(36).substring(2, 9);
}

// Delete a room and kick all users
function deleteRoom(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    console.log(`Deleting room: ${roomId}`);
    
    // Notify all users in the room that it's closing
    io.to(roomId).emit("roomExpired", {
        message: "This room has self-destructed!"
    });

    // Kick all users from the room
    io.in(roomId).socketsLeave(roomId);

    // Clear the timer
    if (room.timer) {
        clearTimeout(room.timer);
    }

    // Delete the room from memory
    delete rooms[roomId];
    
    // Broadcast updated room list to everyone
    io.emit("roomsList", getRoomsList());
}

// Get list of active rooms
function getRoomsList() {
    return Object.keys(rooms).map(roomId => ({
        id: roomId,
        name: rooms[roomId].name,
        userCount: rooms[roomId].users.length,
        timeLeft: Math.floor((rooms[roomId].expiresAt - Date.now()) / 1000)
    }));
}

// SOCKET.IO CONNECTION

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Initialize user
    users[socket.id] = { username: "Anonymous" };
    socket.emit("roomsList", getRoomsList());

    // EVENT: Set Username
    socket.on("setUsername", (username) => {
        users[socket.id].username = username;
        console.log(`User ${socket.id} set username to: ${username}`);
    });

    // EVENT: Create a new room
    socket.on("createRoom", (data) => {
        const { roomName, duration } = data; // duration in minutes
        const roomId = generateRoomId();
        const durationMs = duration * 60 * 1000; // Convert to milliseconds

        // Create room object
        rooms[roomId] = {
            name: roomName,
            users: [],
            createdAt: Date.now(),
            expiresAt: Date.now() + durationMs,
            duration: duration,
            timer: null
        };

        //self-destruct timer
        rooms[roomId].timer = setTimeout(() => {
            deleteRoom(roomId);
        }, durationMs);

        console.log(`Room created: ${roomId} (${roomName}) - expires in ${duration} minutes`);

        // Send room ID back to creator
        socket.emit("roomCreated", { roomId, roomName });

        // Broadcast updated room list to everyone
        io.emit("roomsList", getRoomsList());
    });

    // EVENT: Join a room
    socket.on("joinRoom", (roomId) => {
        const room = rooms[roomId];
        
        // Check if room exists
        if (!room) {
            socket.emit("error", { message: "Room not found!" });
            return;
        }

        // Add user to room
        socket.join(roomId);
        room.users.push(socket.id);

        console.log(`User ${socket.id} joined room ${roomId}`);

        // Notify user they joined
        socket.emit("joinedRoom", {
            roomId,
            roomName: room.name,
            timeLeft: Math.floor((room.expiresAt - Date.now()) / 1000)
        });

        // Notify others in room
        socket.to(roomId).emit("userJoined", {
            message: "A new user joined the room"
        });

        // Update room list for everyone
        io.emit("roomsList", getRoomsList());
    });

    // EVENT: Send message in a room
    socket.on("chatMessage", (data) => {
        const { roomId, message, username } = data;
        
        // Broadcast message to everyone in the room
        io.to(roomId).emit("chatMessage", {
            message,
            senderId: socket.id,
            username: username || users[socket.id].username,
            timestamp: Date.now()
        });

        console.log(`Message in room ${roomId} from ${username}: ${message}`);
    });

    // EVENT: Leave a room
    socket.on("leaveRoom", (roomId) => {
        const room = rooms[roomId];
        if (room) {
            // Remove user from room
            room.users = room.users.filter(id => id !== socket.id);
            socket.leave(roomId);

            console.log(`User ${socket.id} left room ${roomId}`);

            // Notify others
            socket.to(roomId).emit("userLeft", {
                message: "A user left the room"
            });

            // Update room list
            io.emit("roomsList", getRoomsList());
        }
    });

    // EVENT: User disconnects
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove user from users list
        delete users[socket.id];

        // Remove user from all rooms
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            if (room.users.includes(socket.id)) {
                room.users = room.users.filter(id => id !== socket.id);
                
                // Notify others in room
                socket.to(roomId).emit("userLeft", {
                    message: "A user disconnected"
                });
            }
        });

        // Update room list
        io.emit("roomsList", getRoomsList());
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});