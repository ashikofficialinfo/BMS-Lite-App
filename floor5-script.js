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

const rooms = [
  {id:504, name:"Class"}, {id:505, name:"Class"}, {id:506, name:"Class"},
  {id:507, name:"Class"}, {id:508, name:"RAC LAB-1"}, {id:509, name:"RAC LAB-2"}
];

let userRole = "guest";

// 2. WAIT FOR AUTH
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Authenticated:", user.uid);
        userRole = sessionStorage.getItem("role") || "guest";
        buildCards();
        applyPermissions();
        listenToFirebase();
    } else {
        console.log("Not logged in - redirecting");
        window.location.href = "index.html";
    }
});

// 3. BUILD ROOM CARDS
function buildCards() {
    const roomGrid = document.getElementById('roomGrid');
    roomGrid.innerHTML = "";
    rooms.forEach((room, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>Room ${room.id} - ${room.name}</h3>
            <div>Temperature: <span id="temp${index+1}">--</span> °C</div>
            <div>Humidity: <span id="humidity${index+1}">--</span> %</div>
            <div>Air Quality: <span id="air${index+1}" class="status safe">Good</span></div>
            <div>Fire Alert: <span id="fire${index+1}" class="status safe">Safe</span></div>
            <div>FCU Status: <span id="fcu${index+1}" class="status off">OFF</span></div>
            <div style="margin-top:12px;">
                <button class="toggle-on control-btn" onclick="triggerFcuPulse(${room.id}, 'on', this)">FCU ON</button>
                <button class="toggle-off control-btn" onclick="triggerFcuPulse(${room.id}, 'off', this)">FCU OFF</button>
            </div>
        `;
        roomGrid.appendChild(card);
    });
}

// 4. APPLY PERMISSIONS
function applyPermissions() {
    if (userRole === "guest") {
        const notice = document.getElementById("guest-notice");
        if (notice) notice.style.display = "block";
        document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
    }
}

// 5. FCU PULSE CONTROL
function triggerFcuPulse(roomId, action, btn) {
    if (roomId !== 504 && roomId !== 508 && roomId !== 509) {
        alert("Control not available for this room.");
        return;
    }

    if (userRole === "guest") {
        alert("Access Denied: Guest accounts cannot control hardware.");
        return;
    }

    const path = `controls/room_${roomId}_${action}`;
    console.log("Sending command:", path);

    database.ref(path).set(true)
        .then(() => {
            console.log("Command sent:", path);
            setTimeout(() => database.ref(path).set(false), 2000);
        })
        .catch(err => {
            console.error("Write failed:", err.message);
            alert("Command failed: " + err.message);
        });

    // 10 second button lock
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => {
        b.disabled = true;
        b.dataset.originalText = b.innerText;
        b.innerText = "Processing...";
    });
    setTimeout(() => {
        buttons.forEach(b => {
            b.disabled = (userRole === "guest");
            b.innerText = b.dataset.originalText;
        });
    }, 10000);
}

// 6. REAL-TIME LISTENERS
function listenToFirebase() {
    rooms.forEach((room, index) => {
        const roomKey = `R${room.id}`;

        // Temperature & Fire Alert
        database.ref(`sensors/ds18b20/${roomKey}/temperature`).on('value', (snap) => {
            const temp = snap.val();
            const tempEl = document.getElementById(`temp${index+1}`);
            const fireEl = document.getElementById(`fire${index+1}`);
            if (temp !== null && temp !== "ERROR") {
                tempEl.textContent = temp;
                if (parseFloat(temp) > 50) {
                    fireEl.textContent = "FIRE ALERT";
                    fireEl.className = "status off";
                } else {
                    fireEl.textContent = "Safe";
                    fireEl.className = "status safe";
                }
            }
        });

        // FCU Status
        database.ref(`status/room_${room.id}_running`).on('value', (snap) => {
            const el = document.getElementById(`fcu${index+1}`);
            if (el) {
                el.textContent = snap.val() === true ? "ON" : "OFF";
                el.className = snap.val() === true ? "status on" : "status off";
            }
        });
    });

    // MQ5 Gas Sensor
    database.ref(`sensors/mq5/gas_level`).on('value', (snap) => {
        const gasVal = snap.val();
        const airEl = document.getElementById(`air6`);
        if (!airEl) return;
        if (gasVal >= 2500) {
            airEl.textContent = "Explosion Risk";
            airEl.className = "status off";
            airEl.style.background = "";
        } else if (gasVal >= 1500) {
            airEl.textContent = "Gas Leakage";
            airEl.style.background = "#fffbeb";
            airEl.style.color = "#92400e";
            airEl.style.border = "1px solid #fcd34d";
        } else {
            airEl.textContent = "Good";
            airEl.className = "status safe";
            airEl.style.background = "";
        }
    });

    // Humidity from DHT22
    database.ref(`sensors/dht22/humidity`).on('value', (snap) => {
        const hum = snap.val();
        for (let i = 1; i <= 6; i++) {
            const el = document.getElementById(`humidity${i}`);
            if (el) el.textContent = hum ? hum : "--";
        }
    });
}
