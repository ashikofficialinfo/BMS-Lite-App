// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    // Ensure this matches your project URL from Firebase Console
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. ROOM DATA FOR LEVEL 3
const rooms = [
    {id:310, name:"Networking Lab"},
    {id:311, name:"Class"},
    {id:312, name:"Class"},
    {id:313, name:"Class"},
    {id:314, name:"Computer Lab"},
    {id:315, name:"Software Lab"}
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
    if(notice) notice.style.display = "block";
    document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
}

// 5. PULSE LOGIC (DATA TRANSMISSION DISABLED)
function triggerFcuPulse(roomId, action) {
    if (userRole === "guest") {
        alert("Access Denied: Guest accounts cannot control hardware.");
        return;
    }

    // Path identification
    const path = `controls/room_${roomId}_${action}_pulse`;
    
    // Log to the browser console for testing purposes
    console.log(`Command Clicked: Room ${roomId} ${action.toUpperCase()}`);
    console.log(`Target Firebase Path: ${path}`);
    console.log("Status: Transmission is currently DISABLED.");

    /* --- FIREBASE WRITE DISABLED ---
       The lines below are commented out to prevent sending data.
       To enable control again, simply remove the '/*' and '* /' tags.

    database.ref(path).set(true);
    setTimeout(() => database.ref(path).set(false), 200);
    */
}

// 6. REAL-TIME STATUS LISTENERS (READ-ONLY MODE)
function listenToStatus() {
    rooms.forEach((room, index) => {
        // Listen for FCU Running State (Read from ESP32)
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

        // Listen for Fire/Smoke Sensor (Read from ESP32)
        database.ref(`sensors/room_${room.id}/fire`).on('value', snap => {
            const fireEl = document.getElementById(`fire${index+1}`);
            if (fireEl) {
                if (snap.val() === true) {
                    fireEl.textContent = "ALARM";
                    fireEl.className = "status off"; // Red style
                } else {
                    fireEl.textContent = "Safe";
                    fireEl.className = "status safe"; // Green style
                }
            }
        });
        
        // Listen for Temperature Updates
        database.ref(`sensors/room_${room.id}/temp`).on('value', snap => {
            const tempEl = document.getElementById(`temp${index+1}`);
            if (tempEl && snap.val() !== null) tempEl.textContent = snap.val();
        });

        // Listen for Humidity Updates
        database.ref(`sensors/room_${room.id}/humidity`).on('value', snap => {
            const humEl = document.getElementById(`humidity${index+1}`);
            if (humEl && snap.val() !== null) humEl.textContent = snap.val();
        });
    });
}

// Start watching for status updates
listenToStatus();