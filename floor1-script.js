// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. ROOM DATA FOR LEVEL 1 (Ground Floor)
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
const userRole = sessionStorage.getItem("role") || "guest";

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
    if(notice) notice.style.display = "block";
    document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
}

// 5. PULSE LOGIC (FIREBASE WRITING DISABLED)
function triggerFcuPulse(roomId, action) {
    if (userRole === "guest") {
        alert("Access Denied: Guest cannot control hardware.");
        return;
    }

    const path = `controls/room_${roomId}_${action}_pulse`;
    
    // --- LOGGING ONLY: DATA TRANSMISSION DISABLED ---
    console.log(`[LEVEL 1 SIMULATION] Room: ${roomId} | Action: ${action.toUpperCase()}`);
    console.log(`[LEVEL 1 SIMULATION] Firebase Path blocked: ${path}`);

    /* // Commented out to prevent actual hardware switching
    database.ref(path).set(true);
    setTimeout(() => database.ref(path).set(false), 200);
    */
}

// 6. REAL-TIME LISTENERS (READ-ONLY MONITORING)
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

        // Monitor Temperature
        database.ref(`sensors/room_${room.id}/temp`).on('value', snap => {
            const tempEl = document.getElementById(`temp${index+1}`);
            if (tempEl && snap.val() !== null) tempEl.innerText = snap.val();
        });

        // Monitor Humidity
        database.ref(`sensors/room_${room.id}/humidity`).on('value', snap => {
            const humEl = document.getElementById(`humidity${index+1}`);
            if (humEl && snap.val() !== null) humEl.innerText = snap.val();
        });
    });
}

// Start watching for updates immediately
listenToStatus();