const firebaseConfig = {
    apiKey: "AIzaSyCmRQY6Qkursb7kt4p_pizV747JO7EntDM",
    authDomain: "bms-lite-c1453.firebaseapp.com",
    databaseURL: "https://bms-lite-c1453-default-rtdb.firebaseio.com",
    projectId: "bms-lite-c1453"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const role = sessionStorage.getItem("role") || "guest";
const floorName = window.location.pathname.split("/").pop().split(".")[0]; 

document.addEventListener("DOMContentLoaded", () => {
    const roomGrid = document.getElementById("roomGrid");
    rooms.forEach((room, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3>Room ${room.id} - ${room.name}</h3>
          <div>Temp: <span id="temp${index}">--</span>°C</div>
          <div>Humidity: <span id="hum${index}">--</span>%</div>
          <div>FCU: <span id="fcu${index}" class="status off">OFF</span></div>
          <div style="margin-top:10px">
            <button onclick="controlFCU(${index}, true)" class="toggle-on">ON</button>
            <button onclick="controlFCU(${index}, false)" class="toggle-off">OFF</button>
          </div>
        `;
        roomGrid.appendChild(card);
    });

    if(role === "guest") {
        document.querySelectorAll('button').forEach(b => b.disabled = true);
    }

    db.ref(`floors/${floorName}`).on('value', (snapshot) => {
        const data = snapshot.val();
        if(!data) return;
        rooms.forEach((_, i) => {
            const rData = data[`room${i}`];
            if(rData) {
                document.getElementById(`temp${i}`).innerText = rData.temp;
                document.getElementById(`hum${i}`).innerText = rData.humidity;
                const el = document.getElementById(`fcu${i}`);
                el.innerText = rData.fcu_status ? "ON" : "OFF";
                el.className = rData.fcu_status ? "status on" : "status off";
            }
        });
    });
});

function controlFCU(index, state) {
    if(role !== "admin") return alert("Admin access required");
    db.ref(`floors/${floorName}/room${index}`).update({ fcu_status: state });
}