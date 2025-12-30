// 1. DATABASE CONFIGURATION
const firebaseConfig = {
  databaseURL: "https://bms-lite-c1453-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const userRole = sessionStorage.getItem("role");
const roomGrid = document.getElementById('roomGrid');

// 2. GENERATE ROOM CARDS
const rooms = [
  {id:504, name:"Class"}, {id:505, name:"Class"}, {id:506, name:"Class"},
  {id:507, name:"Class"}, {id:508, name:"RAC LAB-1"}, {id:509, name:"RAC LAB-2"}
];

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

// 3. PERMISSION CHECK
if (userRole === "guest") {
  document.getElementById("guest-notice").style.display = "block";
  document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = true);
}

// 4. PULSE LOGIC WITH 10S LOCK
function triggerFcuPulse(roomId, action, btn) {
  // Only send pulses for 504, 508, 509
  if (roomId !== 504 && roomId !== 508 && roomId !== 509) {
    console.log("Control not available for this room");
    return; 
  }

  if (userRole === "guest") {
    alert("Access Denied: Guest accounts cannot control hardware.");
    return;
  }

  // --- CHANGED: Firebase Pulse Trigger now stays true for 2 seconds ---
  const path = `controls/room_${roomId}_${action}_pulse`;
  database.ref(path).set(true);
  
  setTimeout(() => { 
    database.ref(path).set(false); 
  }, 2000); // Pulse duration changed to 2000ms (2 seconds)

  // 10 Second Button Lock Logic
  const parent = btn.parentElement;
  const buttons = parent.querySelectorAll('button');
  buttons.forEach(b => {
    b.disabled = true;
    b.dataset.originalText = b.innerText; // Store old text
    b.innerText = "Processing";
  });

  setTimeout(() => {
    buttons.forEach(b => {
      b.disabled = (userRole === "guest");
      b.innerText = b.dataset.originalText;
    });
  }, 10000);
}

// 5. REAL-TIME DATA LISTENERS
function listenToFirebase() {
  const roomIds = [504, 505, 506, 507, 508, 509];
  
  roomIds.forEach((id, index) => {
    const roomKey = `R${id}`;

    // Temperature & Fire Alert (>50)
    database.ref(`sensors/ds18b20/${roomKey}/temperature`).on('value', (snapshot) => {
      const temp = snapshot.val();
      const tempEl = document.getElementById(`temp${index+1}`);
      const fireEl = document.getElementById(`fire${index+1}`);
      if (temp !== null && temp !== "ERROR") {
        tempEl.textContent = temp;
        if (parseFloat(temp) > 50) {
          fireEl.textContent = "FIRE ALERT"; 
          fireEl.className = "status off"; // Red
        } else {
          fireEl.textContent = "Safe"; 
          fireEl.className = "status safe"; // Green
        }
      }
    });

    // FCU Running Status
    database.ref(`status/room_${id}_running`).on('value', (snapshot) => {
      const isRunning = snapshot.val();
      const fcuEl = document.getElementById(`fcu${index+1}`);
      if (isRunning) {
        fcuEl.textContent = "ON"; fcuEl.className = "status on";
      } else {
        fcuEl.textContent = "OFF"; fcuEl.className = "status off";
      }
    });
  });

  // Room 509 MQ5 Gas Monitoring
  database.ref(`sensors/mq5/gas_level`).on('value', (snapshot) => {
    const gasVal = snapshot.val();
    const airEl = document.getElementById(`air6`); 
    if (gasVal >= 1500 && gasVal < 2500) {
      airEl.textContent = "Gas Leakage"; 
      airEl.style.background = "#fffbeb"; 
      airEl.style.color = "#92400e";
      airEl.style.border = "1px solid #fcd34d";
    } else if (gasVal >= 2500) {
      airEl.textContent = "Explosion Risk"; 
      airEl.className = "status off"; 
      airEl.style.background = ""; 
    } else {
      airEl.textContent = "Good"; 
      airEl.className = "status safe"; 
      airEl.style.background = ""; 
    }
  });

  // Global Humidity from single DHT22
  database.ref(`sensors/dht22/humidity`).on('value', (snapshot) => {
    const hum = snapshot.val();
    for(let i=1; i<=6; i++) {
      const humEl = document.getElementById(`humidity${i}`);
      if(humEl) humEl.textContent = hum ? hum : "--";
    }
  });
}

listenToFirebase();