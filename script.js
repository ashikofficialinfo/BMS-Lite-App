// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCmRQY6Qkursb7kt4p_pizV747JO7EntDM",
    authDomain: "bms-lite-c1453.firebaseapp.com",
    projectId: "bms-lite-c1453",
    appId: "1:992533228260:web:89739abdfc5cef63ff9af1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function adminLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    if(!email || !password) {
        errorMsg.innerText = "Please fill in all fields.";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        sessionStorage.setItem("role", "admin");
        window.location.href = "dashboard.html";
      })
      .catch(err => {
        errorMsg.innerText = "Invalid credentials. Please try again.";
      });
}

function guestLogin() {
    const errorMsg = document.getElementById("errorMsg");
    
    auth.signInAnonymously()
      .then(() => {
        sessionStorage.setItem("role", "guest");
        window.location.href = "dashboard.html";
      })
      .catch(err => {
        errorMsg.innerText = "Guest access error. Try again later.";
      });
}