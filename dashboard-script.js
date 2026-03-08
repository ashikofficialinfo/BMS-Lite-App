// 1. FIREBASE INITIALIZATION
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

// 2. AUTH STATE CHECK - wait for Firebase auth before doing anything
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is logged in - safe to start
        console.log("Logged in as:", user.email || "anonymous", "UID:", user.uid);
        const role = sessionStorage.getItem("role") || "guest";
        document.getElementById("userRole").innerText = role.toUpperCase();
        startMonitoring(role);
    } else {
        // Not logged in - redirect to login page
        console.log("Not authenticated - redirecting to login");
        window.location.href = "index.html";
    }
});

// 3. MAIN MONITORING FUNCTION
function startMonitoring(role) {
    // --- Chiller Status ---
    database.ref('status/chiller_status').on('value', snap => {
        const el = document.getElementById("chillerStatus");
        const status = snap.val() ? "ON" : "OFF";
        el.innerText = status;
        el.style.color = snap.val() ? "#16a34a" : "#dc2626";
    });

    // --- Pumps Running ---
    database.ref('status/pumps_running').on('value', snap => {
        const el = document.getElementById("fcuCount");
        el.innerText = snap.val() ? "1" : "0";
        el.style.color = snap.val() ? "#16a34a" : "#dc2626";
    });

    // --- System Fault ---
    database.ref('status/system_fault').on('value', snap => {
        const banner = document.getElementById("alarms");
        if (snap.val() === "OK") {
            banner.innerText = "SYSTEM STATUS: NORMAL";
            banner.style.background = "#f0f4f8";
            banner.style.color = "#64748b";
        } else {
            banner.innerText = "SYSTEM FAULT: POWER DOWN/PHASE MISSING";
            banner.style.background = "#dc2626";
            banner.style.color = "white";
        }
    });

    // --- Control Buttons (admin only) ---
    // Hide control buttons for guests
    if (role !== "admin") {
        const controls = document.querySelectorAll(".control-btn");
        controls.forEach(btn => btn.disabled = true);
        console.log("Guest mode - controls disabled");
    }
}

// 4. RELAY CONTROL FUNCTIONS (admin only)
function sendCommand(path) {
    const role = sessionStorage.getItem("role");
    if (role !== "admin") {
        alert("Admin access required!");
        return;
    }
    database.ref(path).set(true)
        .then(() => console.log("Command sent:", path))
        .catch(err => console.error("Write failed:", err.message));
}

// 5. LOGOUT
function logout() {
    auth.signOut().then(() => {
        sessionStorage.clear();
        window.location.href = "index.html";
    });
}
