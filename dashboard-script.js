// 1. FIREBASE INITIALIZATION
const firebaseConfig = {
    databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. AUTH & ROLE CHECK
const role = sessionStorage.getItem("role") || "guest";
document.getElementById("userRole").innerText = role.toUpperCase();

// 3. MAIN MONITORING FUNCTION
function startMonitoring() {
    // --- Chiller Status Monitor ---
    database.ref('status/chiller_status').on('value', snap => {
        const el = document.getElementById("chillerStatus");
        const status = snap.val() ? "ON" : "OFF";
        el.innerText = status;
        el.style.color = snap.val() ? "#16a34a" : "#dc2626";
    });

    // --- Pumps Running Monitor (for FCU count) ---
    database.ref('status/pumps_running').on('value', snap => {
        const el = document.getElementById("fcuCount");
        const count = snap.val() ? "1" : "0";
        el.innerText = count;
        el.style.color = snap.val() ? "#16a34a" : "#dc2626";
    });

    // --- System Fault Monitor ---
    database.ref('status/system_fault').on('value', snap => {
        const banner = document.getElementById("alarms");
        const status = snap.val();
        
        if (status === "OK") {
            banner.innerText = "SYSTEM STATUS: NORMAL";
            banner.style.background = "#f0f4f8";
            banner.style.color = "#64748b";
        } else {
            banner.innerText = "SYSTEM FAULT: POWER DOWN/PHASE MISSING";
            banner.style.background = "#dc2626";
            banner.style.color = "white";
        }
    });
}

// Logout Function
function logout() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

// Run Monitoring
startMonitoring();