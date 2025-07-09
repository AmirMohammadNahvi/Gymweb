const workoutPlan = {
  "شنبه - Push": [
    "5-10 دقیقه الپتیکال یا دوچرخه" ,
    "حرکات کششی فعال" ,
    "پرس سینه هالتر 4*8",
    "پرس بالا سینه دمبل 3*10",
    "پرس سرشانه نشسته دمبل 4*8-10",
    "فلای سینه سیم‌کش 3*12-15",
    "نشر جانب دمبل 3*15",
    "دیپ پشت بازو (یا سیم‌کش طناب) 3*12",
    "پشت بازو هالتر خوابیده 3*10(skull crusher)",
    "HIIT با دوچرخه ثابت (اختیاری)"
  ],
  "یک‌شنبه - Lower (قدرتی)": [
    "داینامیک استرچ" ,
    "راه رفتن لانج" ,
    "اسکوات هالتر 4*6-8",
    "ددلیفت رومانیایی 4*8",
    "پرس پا دستگاه 3*12",
    "لانج دمبل راه‌رفته 3*10 گام در هر پا",
    "هاک اسکوات 3*10",
    "ساق پا ایستاده 4*15-20",
    "skipping" ,
    "airbike"
  ],
  "سه‌شنبه - Pull": [
    "ددلیفت 4*5-6",
    "بارفیکس 4 ست تا ناتوانی",
    "زیر بغل تی‌بار 3*10",
    "زیر بغل سیم‌کش 3*12",
    "فیس پول 3*15",
    "جلو بازو دمبل تناوبی 3*12",
    "جلو بازو هالتر 3*10",
    "جلو بازو سیم‌کش تمرکز 3*15"
  ],
  "چهارشنبه - Lower + Core + Cardio": [
    "اسکوات گابلت 3*15",
    "ددلیفت سومو 3*10",
    "لانج ثابت 3*12 هر پا",
    "کیک بک باسن با سیم‌کش 3*15",
    "هک اسکوات سبک 2*15",
    "ساق پا نشسته 3*20",
    "پلانک 3*60 ثانیه",
    "کرانچ با کابل 3*15",
    "Russian Twist 3*20",
    "Cardio ثابت ۱۵–20 دقیقه"
  ]
};

// زمان پیش‌فرض هر روز
const defaultSchedule = {
  "شنبه - Push": "15:00",
  "یک‌شنبه - Lower (قدرتی)": "15:00",
  "سه‌شنبه - Pull": "15:00",
  "چهارشنبه - Lower + Core + Cardio": "15:00"
};

const dayMap = {
  "یک‌شنبه": 0,
  "دوشنبه": 1,
  "سه‌شنبه": 2,
  "چهارشنبه": 3,
  "پنج‌شنبه": 4,
  "جمعه": 5,
  "شنبه": 6
};

// کلید و آیدی گوگل را در این متغیرها قرار دهید
const CLIENT_ID = "YOUR_CLIENT_ID"; // FIXME
const API_KEY = "YOUR_API_KEY"; // FIXME
const DISCOVERY_DRIVE =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const DISCOVERY_CAL =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events";

let tokenClient;
let driveFileId = null;
let gapiInited = false;
let gisInited = false;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('checked')) || {};
  } catch (e) {
    return {};
  }
}

function loadSchedule() {
  try {
    return JSON.parse(localStorage.getItem('schedule')) || { ...defaultSchedule };
  } catch (e) {
    return { ...defaultSchedule };
  }
}

function saveSchedule(state) {
  localStorage.setItem('schedule', JSON.stringify(state));
}

function saveState(state) {
  localStorage.setItem('checked', JSON.stringify(state));
}

function computeProgress(day, exercises, checked) {
  const done = exercises.filter((ex) => checked[day] && checked[day][ex]).length;
  return { done, total: exercises.length };
}



function createCard(day, exercises, checked, onToggle) {
  const card = document.createElement('div');
  card.className = 'card';

  const h2 = document.createElement('h2');
  h2.textContent = day;
  card.appendChild(h2);

  const timeWrap = document.createElement('div');
  timeWrap.className = 'time';
  const label = document.createElement('span');
  label.textContent = 'ساعت تمرین:';
  const input = document.createElement('input');
  input.type = 'time';
  input.value = scheduleState[day] || defaultSchedule[day];
  input.onchange = (e) => {
    scheduleState[day] = e.target.value;
    saveSchedule(scheduleState);
  };
  timeWrap.appendChild(label);
  timeWrap.appendChild(input);
  card.appendChild(timeWrap);

  const progInfo = computeProgress(day, exercises, checked);
  const wrap = document.createElement('div');
  wrap.className = 'progress-wrap';
  const bar = document.createElement('div');
  bar.className = 'progress';
  const fill = document.createElement('div');
  fill.className = 'bar';
  fill.style.width = `${(progInfo.done / progInfo.total) * 100}%`;
  bar.appendChild(fill);
  const labelP = document.createElement('span');
  labelP.className = 'progress-label';
  labelP.textContent = `${progInfo.done}/${progInfo.total}`;
  wrap.appendChild(bar);
  wrap.appendChild(labelP);
  card.appendChild(wrap);

  exercises.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'exercise';
    if (checked[day] && checked[day][ex]) item.classList.add('done');

    const span = document.createElement('span');
    span.className = 'name';
    span.textContent = ex;
    item.appendChild(span);

    const vBtn = document.createElement('button');
    vBtn.className = 'video';
    vBtn.textContent = 'ویدیو';
    vBtn.onclick = () => openGoogle(ex);
    item.appendChild(vBtn);

    const dBtn = document.createElement('button');
    dBtn.className = 'done';
    dBtn.textContent = checked[day] && checked[day][ex] ? 'انجام شد' : 'انجام';
    dBtn.onclick = () => onToggle(day, ex);
    item.appendChild(dBtn);

    card.appendChild(item);
  });

  const reset = document.createElement('button');
  reset.textContent = 'ریست روز';
  reset.onclick = () => {
    onToggle(day, null, true);
  };
  card.appendChild(reset);

  return card;
}

function render() {
  const container = document.getElementById('app');
  container.innerHTML = '';
  Object.entries(workoutPlan).forEach(([day, exercises]) => {
    container.appendChild(
      createCard(day, exercises, checkedState, handleToggle)
    );
  });
  updateOverall();
}

let checkedState = loadState();
let scheduleState = loadSchedule();

function handleToggle(day, ex, resetDay = false) {
  if (resetDay) {
    if (checkedState[day]) delete checkedState[day];
  } else {
    if (!checkedState[day]) checkedState[day] = {};
    checkedState[day][ex] = !checkedState[day][ex];
  }
  saveState(checkedState);
  render();
  updateOverall();
}

function openGoogle(exercise) {
  const query = encodeURIComponent(`${exercise} تمرین بدنسازی`);
  window.open(`https://www.google.com/search?q=${query}`, '_blank');
}

// گوگل درایو
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DRIVE, DISCOVERY_CAL]
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: ''
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.display = 'inline-block';
    document.getElementById('calendar_button').style.display = 'none';
    document.getElementById('save_drive').style.display = 'none';
    document.getElementById('signout_button').style.display = 'none';
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      console.log(resp);
      return;
    }
    document.getElementById('signout_button').style.display = 'inline-block';
    document.getElementById('authorize_button').style.display = 'none';
    document.getElementById('save_drive').style.display = 'inline-block';
    document.getElementById('calendar_button').style.display = 'inline-block';
    await loadFromDrive();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('signout_button').style.display = 'none';
    document.getElementById('authorize_button').style.display = 'inline-block';
    document.getElementById('save_drive').style.display = 'none';
    document.getElementById('calendar_button').style.display = 'none';
  }
}

async function loadFromDrive() {
  try {
    const resp = await gapi.client.drive.files.list({
      q: "name='workout_schedule.json' and trashed=false",
      spaces: 'drive',
      fields: 'files(id,name)'
    });
    if (resp.result.files && resp.result.files.length > 0) {
      driveFileId = resp.result.files[0].id;
      const file = await gapi.client.drive.files.get({
        fileId: driveFileId,
        alt: 'media'
      });
      const data = JSON.parse(file.body);
      checkedState = data.checked || {};
      scheduleState = data.schedule || { ...defaultSchedule };
      saveState(checkedState);
      saveSchedule(scheduleState);
      render();
      updateOverall();
    }
  } catch (e) {
    console.log('load error', e);
  }
}

async function saveToDrive() {
  const body = JSON.stringify({ checked: checkedState, schedule: scheduleState });
  const file = new Blob([body], { type: 'application/json' });
  const metadata = { name: 'workout_schedule.json', mimeType: 'application/json' };
  const accessToken = gapi.client.getToken().access_token;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);
  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';
  if (driveFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
    method = 'PATCH';
  }
  await fetch(url, {
    method,
    headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
    body: form
  });
}

function nextDate(dayNumber) {
  const now = new Date();
  const diff = (dayNumber + 7 - now.getDay()) % 7;
  now.setDate(now.getDate() + diff);
  return now;
}

async function addToCalendar() {
  for (const day of Object.keys(workoutPlan)) {
    const name = day.split(' ')[0];
    const num = dayMap[name];
    if (num === undefined) continue;
    const date = nextDate(num);
    const time = (scheduleState[day] || defaultSchedule[day]).split(':');
    const start = new Date(date);
    start.setHours(+time[0], +time[1], 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const event = {
      summary: day,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Tehran' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Tehran' }
    };
    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
    } catch (e) {
      console.log('calendar error', e);
    }
  }
}

document.getElementById('authorize_button').onclick = handleAuthClick;
document.getElementById('signout_button').onclick = handleSignoutClick;
document.getElementById('save_drive').onclick = saveToDrive;
document.getElementById('calendar_button').onclick = addToCalendar;


render();
