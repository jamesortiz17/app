const addBtn = document.getElementById("addReminderBtn");
const modal = document.getElementById("reminderModal");
const closeModal = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveReminderBtn");
const canvas = document.getElementById("balloonCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let reminders = [];
let usedColors = [];

// Calm rainbow colors
const rainbowColors = ["#fca5a5","#fdba74","#fef08a","#86efac","#93c5fd","#f9a8d4"];

// ------------------ Populate dropdowns ------------------
function populateDropdowns() {
    const now = new Date();
    const yearSelect = document.getElementById("reminderYear");
    const monthSelect = document.getElementById("reminderMonth");
    const daySelect = document.getElementById("reminderDay");
    const hourSelect = document.getElementById("reminderHour");
    const minuteSelect = document.getElementById("reminderMinute");

    // Years: current + next 5
    yearSelect.innerHTML = "";
    for (let y = now.getFullYear(); y <= now.getFullYear() + 5; y++) {
        yearSelect.innerHTML += `<option>${y}</option>`;
    }

    function updateMonths() {
        const selectedYear = parseInt(yearSelect.value);
        monthSelect.innerHTML = "";
        const startMonth = selectedYear === now.getFullYear() ? now.getMonth() + 1 : 1;
        for (let m = startMonth; m <= 12; m++) {
            monthSelect.innerHTML += `<option>${m}</option>`;
        }
        updateDays();
    }

    function updateDays() {
        const selectedYear = parseInt(yearSelect.value);
        const selectedMonth = parseInt(monthSelect.value);
        daySelect.innerHTML = "";
        const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
        const startDay = isCurrentMonth ? now.getDate() : 1;
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        for (let d = startDay; d <= daysInMonth; d++) {
            daySelect.innerHTML += `<option>${d}</option>`;
        }
    }

    // Hours 1-12
    hourSelect.innerHTML = "";
    for (let h = 1; h <= 12; h++) hourSelect.innerHTML += `<option>${h}</option>`;
    // Minutes 0-59
    minuteSelect.innerHTML = "";
    for (let m = 0; m < 60; m++) minuteSelect.innerHTML += `<option>${m.toString().padStart(2,"0")}</option>`;

    yearSelect.onchange = updateMonths;
    monthSelect.onchange = updateDays;

    updateMonths();
}

// ------------------ Modal open/close ------------------
addBtn.onclick = () => { modal.classList.remove("hidden"); populateDropdowns(); }
closeModal.onclick = () => modal.classList.add("hidden");

// ------------------ Save reminder ------------------
saveBtn.onclick = () => {
    const title = document.getElementById("reminderTitle").value.trim();
    if (!title) return alert("Enter a title!");

    let year = parseInt(document.getElementById("reminderYear").value);
    let month = parseInt(document.getElementById("reminderMonth").value) - 1;
    let day = parseInt(document.getElementById("reminderDay").value);
    let hour = parseInt(document.getElementById("reminderHour").value);
    const minute = parseInt(document.getElementById("reminderMinute").value);
    const ampm = document.getElementById("reminderAMPM").value;
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    let importance = parseInt(document.getElementById("reminderImportance").value);
    let deadline = new Date(year, month, day, hour, minute);

    const now = new Date();
    if(deadline < now) deadline = new Date(now.getTime() + 60 * 1000);

    // ------------------ Unique color ------------------
    let availableColors = rainbowColors.filter(c => !usedColors.includes(c));
    if (availableColors.length === 0) usedColors = [];
    const color = availableColors[Math.floor(Math.random()*availableColors.length)];
    usedColors.push(color);

    // ------------------ Size calculation ------------------
    const diffDays = Math.max(1, (deadline - now)/(1000*60*60*24));
    const maxRadius = Math.min(canvas.width, canvas.height)*0.45; // half screen
    const minRadius = 30;

    // Date curve: short deadlines huge, long deadlines smaller
    const dateFactor = Math.log(31)/Math.log(diffDays + 1); // 1 day = big, 30+ days = small
    const importanceFactor = importance / 5;
    const radius = minRadius + dateFactor*0.8*maxRadius + importanceFactor*0.2*maxRadius;

    // ------------------ Position non-overlapping ------------------
    let x, y, safe, attempts = 0;
    while(true){
        x = Math.random() * (canvas.width - 2*radius) + radius;
        y = Math.random() * (canvas.height - 2*radius) + radius;
        safe = reminders.every(r => Math.hypot(r.x-x,r.y-y) > r.radius + radius + 10);
        if(safe || attempts>200) break;
        attempts++;
    }

    let reducedRadius = radius;
    while(!safe && reducedRadius>20){
        reducedRadius -= 5;
        x = Math.random() * (canvas.width - 2*reducedRadius) + reducedRadius;
        y = Math.random() * (canvas.height - 2*reducedRadius) + reducedRadius;
        safe = reminders.every(r => Math.hypot(r.x-x,r.y-y) > r.radius + reducedRadius + 10);
    }

    reminders.push({title, deadline, importance, color, x, y, radius: reducedRadius});
    modal.classList.add("hidden");
}

// ------------------ Draw loop ------------------
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    reminders.forEach(r=>{
        // Balloon
        ctx.beginPath();
        ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);
        ctx.fillStyle=r.color;
        ctx.fill();
        ctx.closePath();

        // Title
        ctx.fillStyle="#111827";
        ctx.font = `${Math.min(24,r.radius/2)}px -apple-system`;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(r.title, r.x, r.y);
    });

    requestAnimationFrame(draw);
}

// ------------------ Click to pop ------------------
canvas.addEventListener("click", e=>{
    for(let i=0;i<reminders.length;i++){
        const r = reminders[i];
        const dx = e.offsetX - r.x;
        const dy = e.offsetY - r.y;
        if(Math.hypot(dx,dy)<=r.radius){
            // Confetti animation
            const confettiCount = 30;
            for(let j=0;j<confettiCount;j++){
                const angle = Math.random()*2*Math.PI;
                const dist = Math.random()*r.radius;
                const cx = r.x + Math.cos(angle)*dist;
                const cy = r.y + Math.sin(angle)*dist;
                const size = Math.random()*6 + 2;
                ctx.beginPath();
                ctx.arc(cx, cy, size, 0, Math.PI*2);
                ctx.fillStyle = r.color;
                ctx.fill();
            }
            reminders.splice(i,1);
            break;
        }
    }
});

draw();
