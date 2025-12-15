// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ================= YOUR FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCmRQY6Qkursb7kt4p_pizV747JO7EntDM",
  authDomain: "bms-lite-c1453.firebaseapp.com",
  databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bms-lite-c1453",
  storageBucket: "bms-lite-c1453.firebasestorage.app",
  messagingSenderId: "992533228260",
  appId: "1:992533228260:web:89739abdfc5cef63ff9af1"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ================= HTML ELEMENTS =================
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authBox = document.getElementById("authBox");
const dashboard = document.getElementById("dashboard");
const msg = document.getElementById("msg");

const chillerStatusEl = document.getElementById("chillerStatus");
const toggleChillerBtn = document.getElementById("toggleChiller");

// ================= LOGIN =================
loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    msg.innerText = "Email and password required";
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      msg.innerText = "";
    })
    .catch(err => {
      msg.innerText = err.code + " : " + err.message;
    });
};

// ================= LOGOUT =================
logoutBtn.onclick = () => {
  signOut(auth);
};

// ================= AUTH STATE =================
onAuthStateChanged(auth, user => {
  if (user) {
    authBox.style.display = "none";
    dashboard.style.display = "block";
  } else {
    authBox.style.display = "block";
    dashboard.style.display = "none";
  }
});

// ================= CHILLER STATUS =================
const chillerRef = ref(db, "chiller/status");

onValue(chillerRef, snapshot => {
  const status = snapshot.val();
  chillerStatusEl.innerText = status ? "ON" : "OFF";
});

// Toggle chiller ON/OFF (admin)
toggleChillerBtn.onclick = () => {
  onValue(chillerRef, snap => {
    set(chillerRef, !snap.val());
  }, { onlyOnce: true });
};

// ================= FLOOR NAVIGATION =================
window.goFloor = (floor) => {
  window.location.href = `floor.html?floor=${floor}`;
};
