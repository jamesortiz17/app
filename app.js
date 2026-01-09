const addBtn = document.getElementById("addReminderBtn");
const modal = document.getElementById("reminderModal");
const closeModal = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveReminderBtn");
const canvas = document.getElementById("balloonCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let reminders = [];

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
    for(let y=now.getFullYear(); y<=now.getFullYear()+5; y++){
        yearSelect.innerHTML += `<option>${y}</option>`;
    }

    // Months
    monthSelect.innerHTML = "";
    for(let m=1; m<=12; m++){
        monthSelect.innerHTML += `<option>${m}</option>`;
    }

    // Days
    daySelect.innerHTML = "";
    for(let d=1; d<=31; d++){
        daySelect.innerHTML += `<option>${d}</option>`;
    }

    // Hours 1-12
    hourSelect.innerHTML = "";
    for(let h=1; h<=12; h++){
        hourSelect.innerHTML += `<option>${h}</option>`;
    }

    // Minutes 0-59
    minuteSelect.innerHTML = "";
    for(let m=0; m<60; m++){
        minuteSelect.innerHTML += `<option>${m.toString().padStart(2,'0')}</option>`;
    }
}

// ------------------ Modal open/close ------------------
addBtn.onclick = () => { modal.classList.remove("hidden"); populateDropdowns(); }
closeModal.onclick = () => modal.classList.add("hidden");

// ------------------ Save reminder ------------------
saveBtn.onclick = () => {
    const title = document.getElementById("reminderTitle").value.trim();
    if(!title) return alert("Enter a title!");

    let year = parseInt(document.getElementById("reminderYear").value);
    let month = parseInt(document.getElementById("reminderMonth").value)-1;
    let day = parseInt(document.getElementById("reminderDay").value);
    let hour = parseInt(document.getElementById("reminderHour").value);
    const minute = parseInt(document.getElementById("reminderMinute").value);
    const ampm = document.getElementById("reminderAMPM").value;
    if(ampm==="PM" && hour<12) hour+=12;
    if(ampm==="AM" && hour===12) hour=0;

    let importance = parseInt(document.getElementById("reminderImportance").value);
    let deadline = new Date(year, month, day, hour, minute);

    const now = new Date();
    if(deadline < now) deadline = new Date(now.getTime()+60*1000);

    // Balloon colors
    const colors = ["#fca5a5","#fdba74","#fef08a","#86efac","#93c5fd","#f9a8d4"];
    const color = colors[Math.floor(Math.random()*colors.length)];

    // Pre-calculate size based on urgency & importance
    const diffDays = Math.max(1, (deadline-now)/(1000*60*60*24)); // min 1 day
    let radius = 30 + importance*10 + 200/Math.sqrt(diffDays); // closer = bigger

    // Position non-overlapping
    let x,y,safe;
    for(let attempt=0; attempt<100; attempt++){
        x = Math.random()*(canvas.width-2*radius)+radius;
        y = Math.random()*(canvas.height-2*radius)+radius;
        safe = reminders.every(r=>{
            return Math.hypot(r.x-x, r.y-y) > r.radius + radius + 10;
        });
        if(safe) break;
    }

    reminders.push({title, deadline, importance, color, x, y, radius});
    modal.classList.add("hidden");
}

// ------------------ Draw loop ------------------
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    reminders.forEach((r,i)=>{
        // Balloon
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2);
        ctx.fillStyle = r.color;
        ctx.fill();
        ctx.closePath();

        // Title
        ctx.fillStyle="#111827";
        ctx.font = `${Math.min(24, r.radius/2)}px -apple-system`;
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
            // Pop confetti
            for(let j=0;j<20;j++){
                const dx = Math.random()*40-20;
                const dy = Math.random()*40-20;
                ctx.beginPath();
                ctx.arc(r.x+dx, r.y+dy,5,0,Math.PI*2);
                ctx.fillStyle = r.color;
                ctx.fill();
            }
            reminders.splice(i,1);
            break;
        }
    }
});

draw();
