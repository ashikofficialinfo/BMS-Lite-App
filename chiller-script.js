// 1. Check Role and Disable Buttons
const userRole = sessionStorage.getItem("role");

function checkPermissions() {
    if (userRole === "guest") {
        const btnChiller = document.getElementById("btn-chiller");
        const btnPump = document.getElementById("btn-pump");
        const btnFan = document.getElementById("btn-fan");
        
        if(btnChiller) btnChiller.disabled = true;
        if(btnPump) btnPump.disabled = true;
        if(btnFan) btnFan.disabled = true;
        
        document.getElementById("permission-warning").style.display = "block";
    }
}

checkPermissions();

// 2. FIREBASE CONFIGURATION
const firebaseConfig = {
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 3. CONTROL LOGIC WITH UPDATED 2s PULSE
function triggerPulse(device) {
    if (userRole === "guest") {
        alert("Access Denied: Read-only account.");
        return;
    }

    const button = document.getElementById("btn-" + device);
    const originalText = button.innerText;
    
    // Special handling for fan button - NO Firebase call
    if (device === "fan") {
        button.disabled = true;
        button.innerText = "Fan Control Local";
        button.style.backgroundColor = "#6b7280";
        
        setTimeout(() => {
            button.disabled = false;
            button.innerText = originalText;
            button.style.backgroundColor = "";
        }, 3000);
        
        return; 
    }

    // Chiller Logic
    if (device === "chiller") {
        button.disabled = true;
        button.innerText = "Processing...";
        button.style.backgroundColor = "#f59e0b";
        
        // --- CHANGED: Pulse now 2000ms ---
        database.ref('controls/' + device + '_pulse').set(true);
        setTimeout(() => {
            database.ref('controls/' + device + '_pulse').set(false);
        }, 2000); 
        
        // Re-enable after 2 minutes
        setTimeout(() => {
            button.disabled = false;
            button.innerText = originalText;
            button.style.backgroundColor = "";
        }, 120000); 
        
    } 
    // Pump Logic
    else if (device === "pump") {
        button.disabled = true;
        button.innerText = "Processing...";
        button.style.backgroundColor = "#f59e0b";
        
        // --- CHANGED: Pulse now 2000ms ---
        database.ref('controls/' + device + '_pulse').set(true);
        setTimeout(() => {
            database.ref('controls/' + device + '_pulse').set(false);
        }, 2000);
        
        // Re-enable after 30 seconds
        setTimeout(() => {
            button.disabled = false;
            button.innerText = originalText;
            button.style.backgroundColor = "";
        }, 30000);
    }
}

// 4. REAL-TIME LISTENERS
function startRealTimeListeners() {
    database.ref('sensors/ds18b20/CWIN/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("cw-in").textContent = (val !== null && val !== "ERROR") ? val.toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CWOUT/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("cw-out").textContent = (val !== null && val !== "ERROR") ? val.toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CHWIN/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("chw-in").textContent = (val !== null && val !== "ERROR") ? val.toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CHWOUT/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("chw-out").textContent = (val !== null && val !== "ERROR") ? val.toFixed(1) : "--";
    });

    database.ref('sensors/makeup_water_level').on('value', (snap) => {
        const val = snap.val();
        const makeupEl = document.getElementById("makeup-level");
        if(makeupEl) {
            makeupEl.textContent = val || "--";
            makeupEl.style.color = val === "LOW" ? "#fb7185" : "white";
        }
    });

    database.ref('status/flow_status').on('value', (snap) => {
        const val = snap.val();
        const cwFlow = document.getElementById("cw-flow");
        if(cwFlow) cwFlow.textContent = val ? "NORMAL" : "NO FLOW";
    });

    database.ref('status/chiller_status').on('value', (snap) => {
        updateUIStatus("chiller-status", snap.val());
    });

    database.ref('status/pumps_running').on('value', (snap) => {
        updateUIStatus("pump-status", snap.val());
    });

    database.ref('status/fan_running').on('value', (snap) => {
        updateUIStatus("fan-status", snap.val());
    });
}

function updateUIStatus(elementId, isRunning) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (isRunning) {
        el.textContent = "RUNNING";
        el.className = "status running";
    } else {
        el.textContent = "STOPPED";
        el.className = "status stop";
    }
}

startRealTimeListeners();