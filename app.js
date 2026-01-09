const addBtn = document.getElementById("addReminderBtn");
const modal = document.getElementById("reminderModal");
const closeModal = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveReminderBtn");
const canvas = document.getElementById("balloonCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let reminders = [];

// ------------------ Populate date/time dropdowns ------------------
function populateDropdowns() {
  const now = new Date();
  const yearSelect = document.getElementById("reminderYear");
  const monthSelect = document.getElementById("reminderMonth");
  const daySelect = document.getElementById("reminderDay");
  const hourSelect = document.getElementById("reminderHour");
  const minuteSelect = document.getElementById("reminderMinute");

  // Years: current + next 5
  let years = [];
  for(let y=now.getFullYear(); y<=now.getFullYear()+5; y++) years.push(y);
  yearSelect.innerHTML = years.map(y=>`<option>${y}</option>`).join('');

  // Months: 1-12
  monthSelect.innerHTML = Array.from({length:12}, (_,i)=>`<option>${i+1}</option>`).join('');

  // Days: 1-31
  daySelect.innerHTML = Array.from({length:31}, (_,i)=>`<option>${i+1}</option>`).join('');

  // Hours 1-12
  hourSelect.innerHTML = Array.from({length:12}, (_,i)=>`<option>${i+1}</option>`).join('');

  // Minutes 0-59
  minuteSelect.innerHTML = Array.from({length:60}, (_,i)=>`<option>${i.toString().padStart(2,'0')}</option>`).join('');
}

// ------------------ Open/close modal ------------------
function openModal() {
  modal.classList.remove("hidden");
  populateDropdowns();
}

function closeModalFunc() {
  modal.classList.add("hidden");
}

addBtn.onclick = openModal;
closeModal.onclick = closeModalFunc;

// ------------------ Save reminder ------------------
saveBtn.onclick = () => {
  const title = document.getElementById("reminderTitle").value.trim();
  if(!title) return alert("Enter a title!");

  const year = parseInt(document.getElementById("reminderYear").value);
  const month = parseInt(document.getElementById("reminderMonth").value)-1;
  const day = parseInt(document.getElementById("reminderDay").value);
  let hour = parseInt(document.getElementById("reminderHour").value);
  const minute = parseInt(document.getElementById("reminderMinute").value);
  const ampm = document.getElementById("reminderAMPM").value;
  if(ampm==="PM" && hour<12) hour+=12;
  if(ampm==="AM" && hour===12) hour=0;

  const importance = parseInt(document.getElementById("reminderImportance").value);
  let deadline = new Date(year, month, day, hour, minute);

  // Prevent past dates
  const now = new Date();
  if(deadline < now) {
    deadline = new Date(now.getTime() + 60*1000); // +1min
  }

  // Balloon colors
  const colors = ["#fca5a5","#fdba74","#fef08a","#86efac","#93c5fd","#f9a8d4"];
  const color = colors[Math.floor(Math.random()*colors.length)];

  // Balloon position (non-overlapping)
  let radius = 30 + importance*15;
  let x, y, safe;
  for(let attempt=0; attempt<100; attempt++){
    x = Math.random()*(canvas.width-2*radius)+radius;
    y = Math.random()*(canvas.height-2*radius)+radius;
    safe = reminders.every(r=>{
      const dx=r.x-x;
      const dy=r.y-y;
      return Math.hypot(dx,dy) > r.radius+radius;
    });
    if(safe) break;
  }

  reminders.push({title, deadline, importance, color, x, y, radius});
  closeModalFunc();
};

// ------------------ Draw balloons ------------------
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const now = new Date();

  reminders.forEach((r,i)=>{
    // Size model: days remaining vs importance
    const diffMs = r.deadline-now;
    let dayRatio = Math.max(0, 1 - diffMs/(1000*60*60*24*30)); // roughly 1 month scale
    const size = r.radius + r.importance*10*dayRatio;

    // Draw balloon
    ctx.beginPath();
    ctx.arc(r.x, r.y, size, 0, Math.PI*2);
    ctx.fillStyle = r.color;
    ctx.fill();
    ctx.closePath();

    // Draw title
    ctx.fillStyle="#111827";
    ctx.font = `${Math.max(12, size/3)}px -apple-system`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(r.title, r.x, r.y);
  });

  requestAnimationFrame(draw);
}

canvas.addEventListener("click", (e)=>{
  for(let i=0;i<reminders.length;i++){
    const r=reminders[i];
    const dx = e.offsetX - r.x;
    const dy = e.offsetY - r.y;
    const diffMs = r.deadline-new Date();
    let dayRatio = Math.max(0, 1 - diffMs/(1000*60*60*24*30));
    const size = r.radius + r.importance*10*dayRatio;
    if(Math.hypot(dx,dy) <= size){
      // Pop + simple confetti
      for(let j=0;j<20;j++){
        const dx=Math.random()*40-20;
        const dy=Math.random()*40-20;
        ctx.beginPath();
        ctx.arc(r.x+dx,r.y+dy,5,0,Math.PI*2);
        ctx.fillStyle=r.color;
        ctx.fill();
      }
      reminders.splice(i,1);
      break;
    }
  }
});

draw();
