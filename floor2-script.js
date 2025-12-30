// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. ROOM DATA FOR LEVEL 2
const rooms = [
    {id:208, name:"Conference Hall"},
    {id:209, name:"CAD Lab"},
    {id:210, name:"Drawing Lab"},
    {id:212, name:"Class"},
    {id:213, name:"Class"},
    {id:214, name:"Class"},
    {id:215, name:"Class"},
    {id:216, name:"Baking Lab"},
    {id:218, name:"Class"},
    {id:219, name:"Chemistry Lab"},
    {id:220, name:"Physics Lab"}
];

const grid = document.getElementById('roomGrid');
const userRole = sessionStorage.getItem("role");

// 3. GENERATE THE CARDS
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

// 4. APPLY PERMISSIONS
if (userRole === "guest") {
    const notice = document.getElementById("guest-notice");
    if (notice) notice.style.display = "block";
    document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
}

// 5. PULSE LOGIC (FIREBASE SENDING DISABLED)
function triggerFcuPulse(roomId, action) {
    if (userRole === "guest") {
        alert("Access Denied: Guest cannot control hardware.");
        return;
    }

    const path = `controls/room_${roomId}_${action}_pulse`;

    // --- LOGGING ONLY: DATA TRANSMISSION STOPPED HERE ---
    console.log(`[SIMULATION] Command: Room ${roomId} ${action.toUpperCase()}`);
    console.log(`[SIMULATION] Target Path: ${path}`);
    console.log("Status: No data sent to Firebase (Disabled as requested).");

    /* // To re-enable, remove these comments:
    database.ref(path).set(true);
    setTimeout(() => database.ref(path).set(false), 200);
    */
}

// 6. REAL-TIME LISTENERS (LIVE MONITORING ACTIVE)
function listenToStatus() {
    rooms.forEach((room, index) => {
        // Monitor FCU State (Incoming from ESP32)
        database.ref(`status/room_${room.id}_running`).on('value', snap => {
            const el = document.getElementById(`fcu${index+1}`);
            if (el) {
                if (snap.val() === true) {
                    el.textContent = "ON";
                    el.className = "status on";
                } else {
                    el.textContent = "OFF";
                    el.className = "status off";
                }
            }
        });

        // Monitor Fire Sensors (Incoming from ESP32)
        database.ref(`sensors/room_${room.id}/fire`).on('value', snap => {
            const fireEl = document.getElementById(`fire${index+1}`);
            if (fireEl) {
                if (snap.val() === true) {
                    fireEl.textContent = "FIRE!";
                    fireEl.className = "status off"; // Red warning
                } else {
                    fireEl.textContent = "Safe";
                    fireEl.className = "status safe";
                }
            }
        });

        // Monitor Temp/Humidity (If your ESP32 sends these paths)
        database.ref(`sensors/room_${room.id}/temp`).on('value', snap => {
            const tempEl = document.getElementById(`temp${index+1}`);
            if (tempEl && snap.val() !== null) tempEl.textContent = snap.val();
        });

        database.ref(`sensors/room_${room.id}/humidity`).on('value', snap => {
            const humEl = document.getElementById(`humidity${index+1}`);
            if (humEl && snap.val() !== null) humEl.textContent = snap.val();
        });
    });
}

// Start watching for real-time status updates
listenToStatus();