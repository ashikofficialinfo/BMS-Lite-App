import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCmRQY6Qkursb7kt4p_pizV747JO7EntDM",
  authDomain: "bms-lite-c1453.firebaseapp.com",
  databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bms-lite-c1453",
  storageBucket: "bms-lite-c1453.firebasestorage.app",
  messagingSenderId: "992533228260",
  appId: "1:992533228260:web:89739abdfc5cef63ff9af1"
};

// ================= INITIALIZE =================
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

// ================= UI ELEMENTS =================
const authBox = document.getElementById("authBox");
const controlBox = document.getElementById("controlBox");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMsg = document.getElementById("authMsg");
const badge = document.getElementById("statusBadge");
const tempDisplay = document.getElementById("temp");

// Gas UI
const gasStatus = document.getElementById("gasStatus");
const gasBadge = document.getElementById("gasBadge");

// GPIO
const gpioButtons = {
  gpio1: document.getElementById("gpio1Btn"),
  gpio2: document.getElementById("gpio2Btn"),
  gpio3: document.getElementById("gpio3Btn")
};

const gpioLabels = {
  gpio1: document.getElementById("gpio1Status"),
  gpio2: document.getElementById("gpio2Status"),
  gpio3: document.getElementById("gpio3Status")
};

// ================= LOGIN =================
loginBtn.onclick = async () => {
  authMsg.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("emailField").value,
      document.getElementById("passwordField").value
    );
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

logoutBtn.onclick = () => signOut(auth);

// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBox.style.display = "none";
    controlBox.style.display = "block";
    badge.className = "status-badge online";
    badge.textContent = "Online";
    startListeners();
  } else {
    authBox.style.display = "block";
    controlBox.style.display = "none";
    badge.className = "status-badge offline";
    badge.textContent = "Offline";
  }
});

// ================= DB LISTENERS =================
let gasAlerted = false; // prevents repeat alert

function startListeners() {

  // GPIO listeners
  ["gpio1", "gpio2", "gpio3"].forEach((key) => {
    onValue(ref(db, "/" + key), (snapshot) => {
      let value = snapshot.val() ? 1 : 0;
      updateUI(key, value);
    });
  });

  // Temperature
  onValue(ref(db, "/temperature"), (snapshot) => {
    const temp = snapshot.val();
    tempDisplay.textContent = temp !== null ? temp : "--";
  });

  // 🔥 GAS LEAKAGE LISTENER
  onValue(ref(db, "/gas"), (snapshot) => {
    const gasDetected = snapshot.val();

    if (gasDetected) {
      gasStatus.textContent = "Detected!";
      gasBadge.textContent = "ALERT";
      gasBadge.classList.remove("safe");
      gasBadge.classList.add("alert");

      // Alert only once
      if (!gasAlerted) {
        gasAlerted = true;

        // Sound alarm
        const alarm = new Audio(
          "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
        );
        alarm.play();

        // Popup
        alert("⚠️ GAS LEAKAGE DETECTED!\nTake immediate action!");
      }

    } else {
      gasStatus.textContent = "Safe";
      gasBadge.textContent = "SAFE";
      gasBadge.classList.remove("alert");
      gasBadge.classList.add("safe");
      gasAlerted = false; // reset alert
    }
  });

  // GPIO button click
  Object.values(gpioButtons).forEach((btn) => {
    btn.onclick = () => {
      let gpio = btn.dataset.gpio;
      let newState = btn.classList.contains("on") ? 0 : 1;
      set(ref(db, "/" + gpio), newState);
    };
  });
}

// ================= UPDATE GPIO UI =================
function updateUI(key, val) {
  let btn = gpioButtons[key];
  let lab = gpioLabels[key];

  if (val === 1) {
    btn.classList.add("on");
    lab.textContent = "Status: ON";
    lab.style.color = "#9effae";
  } else {
    btn.classList.remove("on");
    lab.textContent = "Status: OFF";
    lab.style.color = "#d1d1d1";
  }
}
