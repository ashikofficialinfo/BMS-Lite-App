// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyCmRQY6Qkursb7kt4p_pizV747JO7EntDM",
    authDomain: "bms-lite-c1453.firebaseapp.com",
    projectId: "bms-lite-c1453",
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app",
    appId: "1:992533228260:web:89739abdfc5cef63ff9af1"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const auth = firebase.auth();

// 2. ROOM DATA FOR LEVEL 1
const rooms = [
    {id:108, name:"Testing Lab"},
    {id:109, name:"Electrical Lab"},
    {id:110, name:"Class"},
    {id:112, name:"Construction Lab"},
    {id:113, name:"Geotechnical Lab"},
    {id:114, name:"Electronic Lab"},
    {id:117, name:"Machine Shop"},
    {id:118, name:"Store"}
];

const grid = document.getElementById('roomGrid');
let userRole = "guest";

// 3. WAIT FOR AUTH BEFORE DOING ANYTHING
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Authenticated:", user.uid);
        userRole = sessionStorage.getItem("role") || "guest";
        buildCards();
        applyPermissions();
        listenToStatus();
    } else {
        console.log("Not logged in - redirecting");
        window.location.href = "index.html";
    }
});

// 4. BUILD ROOM CARDS
function buildCards() {
    grid.innerHTML = "";
    rooms.forEach((room, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>Room ${room.id} - ${room.name}</h3>
            <div>Temperature: <span id="temp${index+1}">--</span> °C</div>
            <div>Humidity: <span id="humidity${index+1}">--</span> %</div>
            <div>Air Quality: <span class="status safe">Good</span></div>
            <div>Fire Alert: <span id="fire${index+1}" class="status safe">Safe</span></div>
            <div>FCU Status: <span id="fcu${index+1}" class="status off">OFF</span></div>
            <div style="margin-top:12px;">
                <button class="toggle-on control-btn" onclick="triggerFcuPulse(${room.id}, 'on')">FCU ON</button>
                <button class="toggle-off control-btn" onclick="triggerFcuPulse(${room.id}, 'off')">FCU OFF</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 5. APPLY PERMISSIONS
function applyPermissions() {
    if (userRole === "guest") {
        const notice = document.getElementById("guest-notice");
        if (notice) notice.style.display = "block";
        document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
    }
}

// 6. FCU PULSE CONTROL - FIXED AND ENABLED
function triggerFcuPulse(roomId, action) {
    if (userRole === "guest") {
        alert("Access Denied: Guest cannot control hardware.");
        return;
    }

    const path = `controls/room_${roomId}_${action}`;
    console.log("Sending command to:", path);

    database.ref(path).set(true)
        .then(() => {
            console.log("Command sent successfully:", path);
            // Auto reset after 2 seconds
            setTimeout(() => {
                database.ref(path).set(false);
            }, 2000);
        })
        .catch(err => {
            console.error("Firebase write failed:", err.message);
            alert("Command failed: " + err.message);
        });
}

// 7. REAL-TIME LISTENERS
function listenToStatus() {
    rooms.forEach((room, index) => {
        // FCU Status
        database.ref(`status/room_${room.id}_running`).on('value', snap => {
            const el = document.getElementById(`fcu${index+1}`);
            if (el) {
                el.textContent = snap.val() === true ? "ON" : "OFF";
                el.className = snap.val() === true ? "status on" : "status off";
            }
        });

        // Fire Sensor
        database.ref(`sensors/room_${room.id}/fire`).on('value', snap => {
            const el = document.getElementById(`fire${index+1}`);
            if (el) {
                el.textContent = snap.val() === true ? "FIRE!" : "Safe";
                el.className = snap.val() === true ? "status off" : "status safe";
            }
        });

        // Temperature
        database.ref(`sensors/room_${room.id}/temp`).on('value', snap => {
            const el = document.getElementById(`temp${index+1}`);
            if (el && snap.val() !== null) el.innerText = snap.val();
        });

        // Humidity
        database.ref(`sensors/room_${room.id}/humidity`).on('value', snap => {
            const el = document.getElementById(`humidity${index+1}`);
            if (el && snap.val() !== null) el.innerText = snap.val();
        });
    });
}
