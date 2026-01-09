const addBtn = document.getElementById("addReminderBtn");
const modal = document.getElementById("reminderModal");
const closeModal = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveReminderBtn");
const canvas = document.getElementById("balloonCanvas");
const ctx = canvas.getContext("2d");

let reminders = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function getNextDays() {
  const now = new Date();
  const years = [now.getFullYear() % 100, (now.getFullYear()+1)%100, (now.getFullYear()+2)%100];
  const months = Array.from({length:12}, (_,i)=>i+1);
  const days = Array.from({length:31}, (_,i)=>i+1);
  return {years, months, days};
}

function populateDropdowns() {
  const {years, months, days} = getNextDays();
  const yearSelect = document.getElementById("reminderYear");
  const monthSelect = document.getElementById("reminderMonth");
  const daySelect = document.getElementById("reminderDay");
  const hourSelect = document.getElementById("reminderHour");
  const minuteSelect = document.getElementById("reminderMinute");

  yearSelect.innerHTML = years.map(y=>`<option>${y}</option>`).join('');
  monthSelect.innerHTML = months.map(m=>`<option>${m}</option>`).join('');
  daySelect.innerHTML = days.map(d=>`<option>${d}</option>`).join('');
  hourSelect.innerHTML = Array.from({length:12}, (_,i)=>`<option>${i+1}</option>`).join('');
  minuteSelect.innerHTML = Array.from({length:60}, (_,i)=>`<option>${i.toString().padStart(2,'0')}</option>`).join('');
}

function openModal() {
  modal.classList.remove("hidden");
  populateDropdowns();
}

function closeModalFunc() {
  modal.classList.add("hidden");
}

addBtn.onclick = openModal;
closeModal.onclick = closeModalFunc;

saveBtn.onclick = () => {
  const title = document.getElementById("reminderTitle").value;
  const year = parseInt(document.getElementById("reminderYear").value);
  const month = parseInt(document.getElementById("reminderMonth").value) - 1;
  const day = parseInt(document.getElementById("reminderDay").value);
  let hour = parseInt(document.getElementById("reminderHour").value);
  const minute = parseInt(document.getElementById("reminderMinute").value);
  const ampm = document.getElementById("reminderAMPM").value;
  if (ampm === "PM" && hour<12) hour+=12;
  if (ampm==="AM" && hour===12) hour=0;
  const importance = parseInt(document.getElementById("reminderImportance").value);

  const deadline = new Date(2000+year, month, day, hour, minute);
  const colors = ["#fca5a5","#fdba74","#fef08a","#86efac","#93c5fd","#f9a8d4"];
  const color = colors[Math.floor(Math.random()*colors.length)];

  reminders.push({title, deadline, importance, color});
  closeModalFunc();
};

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const now = new Date();
  const positions = [];

  for (let r of reminders) {
    // Linear size model (you can adjust later)
    const totalMs = r.deadline - now;
    let ratio = 0;
    if(totalMs>0) ratio = Math.min(1, 1 - totalMs/(1000*60*60*24*180)); // approx 6 months
    const baseSize = 30 + ratio*200 + r.importance*15;
    let x, y;
    let safe=true;

    for(let attempt=0; attempt<50; attempt++){
      x = Math.random()*(canvas.width-baseSize*2)+baseSize;
      y = Math.random()*(canvas.height-baseSize*2)+baseSize;
      safe = positions.every(p=>Math.hypot(p.x-x,p.y-y) > (p.size+baseSize));
      if(safe) break;
    }
    positions.push({x,y,size:baseSize});
    ctx.beginPath();
    ctx.arc(x,y,baseSize,0,Math.PI*2);
    ctx.fillStyle = r.color;
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle="#111827";
    ctx.font = `${Math.max(12,baseSize/3)}px -apple-system`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(r.title, x, y);

    // click detection
    canvas.onclick = (e)=>{
      for(let i=0;i<reminders.length;i++){
        const p=positions[i];
        if(Math.hypot(p.x-e.offsetX,p.y-e.offsetY)<=p.size){
          // pop animation
          for(let j=0;j<30;j++){
            const dx=Math.random()*40-20;
            const dy=Math.random()*40-20;
            ctx.beginPath();
            ctx.arc(p.x+dx,p.y+dy,5,0,Math.PI*2);
            ctx.fillStyle=r.color;
            ctx.fill();
          }
          reminders.splice(i,1);
          break;
        }
      }
    };
  }
  requestAnimationFrame(draw);
}

draw();
