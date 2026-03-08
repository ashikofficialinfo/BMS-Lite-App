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
let userRole = "guest";

// 2. WAIT FOR AUTH
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Authenticated:", user.uid);
        userRole = sessionStorage.getItem("role") || "guest";
        checkPermissions();
        startRealTimeListeners();
    } else {
        console.log("Not logged in - redirecting");
        window.location.href = "index.html";
    }
});

// 3. PERMISSION CHECK
function checkPermissions() {
    if (userRole === "guest") {
        const warn = document.getElementById("permission-warning");
        if (warn) warn.style.display = "block";
        const btnChiller = document.getElementById("btn-chiller");
        const btnPump = document.getElementById("btn-pump");
        const btnFan = document.getElementById("btn-fan");
        if (btnChiller) btnChiller.disabled = true;
        if (btnPump) btnPump.disabled = true;
        if (btnFan) btnFan.disabled = true;
    }
}

// 4. CONTROL LOGIC
function triggerPulse(device) {
    if (userRole === "guest") {
        alert("Access Denied: Read-only account.");
        return;
    }

    const button = document.getElementById("btn-" + device);
    const originalText = button.innerText;

    // Fan is local only - no Firebase
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

    button.disabled = true;
    button.innerText = "Processing...";
    button.style.backgroundColor = "#f59e0b";

    const path = `controls/${device}_pulse`;
    database.ref(path).set(true)
        .then(() => {
            console.log("Command sent:", path);
            setTimeout(() => database.ref(path).set(false), 2000);
        })
        .catch(err => {
            console.error("Write failed:", err.message);
            alert("Command failed: " + err.message);
            button.disabled = false;
            button.innerText = originalText;
            button.style.backgroundColor = "";
        });

    // Re-enable after lock period
    const lockTime = device === "chiller" ? 120000 : 30000;
    setTimeout(() => {
        button.disabled = (userRole === "guest");
        button.innerText = originalText;
        button.style.backgroundColor = "";
    }, lockTime);
}

// 5. REAL-TIME LISTENERS
function startRealTimeListeners() {
    database.ref('sensors/ds18b20/CWIN/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("cw-in").textContent = (val !== null && val !== "ERROR") ? parseFloat(val).toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CWOUT/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("cw-out").textContent = (val !== null && val !== "ERROR") ? parseFloat(val).toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CHWIN/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("chw-in").textContent = (val !== null && val !== "ERROR") ? parseFloat(val).toFixed(1) : "--";
    });

    database.ref('sensors/ds18b20/CHWOUT/temperature').on('value', (snap) => {
        const val = snap.val();
        document.getElementById("chw-out").textContent = (val !== null && val !== "ERROR") ? parseFloat(val).toFixed(1) : "--";
    });

    database.ref('sensors/makeup_water_level').on('value', (snap) => {
        const val = snap.val();
        const el = document.getElementById("makeup-level");
        if (el) {
            el.textContent = val || "--";
            el.style.color = val === "LOW" ? "#fb7185" : "white";
        }
    });

    database.ref('status/flow_status').on('value', (snap) => {
        const el = document.getElementById("cw-flow");
        if (el) el.textContent = snap.val() ? "NORMAL" : "NO FLOW";
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

    // Alarm monitoring
    database.ref('status/system_fault').on('value', (snap) => {
        const alarmList = document.getElementById("alarm-list");
        if (!alarmList) return;
        if (snap.val() !== "OK") {
            alarmList.innerHTML = `<li style="color:#fb7185">⚠️ SYSTEM FAULT: ${snap.val()}</li>`;
        } else {
            alarmList.innerHTML = `<li style="color:#4ade80">✅ All systems normal</li>`;
        }
    });
}

// 6. STATUS UI HELPER
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
