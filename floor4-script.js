// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. ROOM DATA FOR LEVEL 4
const rooms = [
    {id:410, name:"Food Processing & Preservation Lab"},
    {id:411, name:"Class"},
    {id:412, name:"Class"},
    {id:413, name:"Class"},
    {id:414, name:"Class"},
    {id:415, name:"Microbiology Lab"}
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
        <div>Fire Alert: <span class="status safe">Safe</span></div>
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
    document.getElementById("guest-notice").style.display = "block";
    document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
}

// 5. PULSE LOGIC - (DISABLED SENDING DATA)
function triggerFcuPulse(roomId, action) {
    // We removed database.ref().set() so NO data is sent to Firebase
    console.log(`Command blocked: Room ${roomId} ${action} (Read-Only Mode)`);
    alert("System is currently in Read-Only Mode. No commands sent.");
}

// 6. REAL-TIME LISTENERS (Kept active to READ data)
function listenToStatus() {
    rooms.forEach((room, index) => {
        // Listen for ON/OFF status from Firebase
        database.ref(`status/room_${room.id}_running`).on('value', snap => {
            const el = document.getElementById(`fcu${index+1}`);
            if (snap.exists()) {
                const isOn = snap.val() === true;
                el.textContent = isOn ? "ON" : "OFF";
                el.className = isOn ? "status on" : "status off";
            }
        });

        // Listen for Temperature from Firebase
        database.ref(`sensors/room_${room.id}/temp`).on('value', snap => {
            const tempEl = document.getElementById(`temp${index+1}`);
            if(snap.exists()) {
                tempEl.innerText = snap.val();
            } else {
                tempEl.innerText = "--";
            }
        });
    });
}

listenToStatus();