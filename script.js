const workoutPlan = {
  "شنبه - Push": [
    "پرس سینه هالتر",
    "پرس بالا سینه دمبل",
    "پرس سرشانه نشسته دمبل",
    "فلای سینه سیم‌کش",
    "نشر جانب دمبل",
    "دیپ پشت بازو (یا سیم‌کش طناب)",
    "پشت بازو هالتر خوابیده",
    "HIIT با دوچرخه ثابت (اختیاری)"
  ],
  "یک‌شنبه - Lower (قدرتی)": [
    "اسکوات هالتر",
    "ددلیفت رومانیایی",
    "پرس پا دستگاه",
    "لانج دمبل راه‌رفته",
    "هاک اسکوات",
    "ساق پا ایستاده",
    "HIIT (اختیاری)"
  ],
  "سه‌شنبه - Pull": [
    "ددلیفت",
    "بارفیکس",
    "زیر بغل تی‌بار",
    "زیر بغل سیم‌کش",
    "فیس پول",
    "جلو بازو دمبل تناوبی",
    "جلو بازو هالتر",
    "جلو بازو سیم‌کش تمرکز"
  ],
  "چهارشنبه - Lower + Core + Cardio": [
    "اسکوات گابلت",
    "ددلیفت سومو",
    "لانج ثابت",
    "کیک بک باسن با سیم‌کش",
    "هک اسکوات سبک",
    "ساق پا نشسته",
    "پلانک",
    "کرانچ با کابل",
    "Russian Twist",
    "Cardio ثابت ۱۵–20 دقیقه"
  ]
};

// زمان پیش‌فرض هر روز
const defaultSchedule = {
  "شنبه - Push": "18:00",
  "یک‌شنبه - Lower (قدرتی)": "18:00",
  "سه‌شنبه - Pull": "18:00",
  "چهارشنبه - Lower + Core + Cardio": "18:00"
};

// کلید و آیدی گوگل را در این متغیرها قرار دهید
const CLIENT_ID = "YOUR_CLIENT_ID"; // FIXME
const API_KEY = "YOUR_API_KEY"; // FIXME
const DISCOVERY =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

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
    vBtn.onclick = () => toggleGif(item, ex);
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
}

function toggleGif(container, exercise) {
  const existing = container.querySelector('img.gif');
  if (existing) {
    existing.remove();
    return;
  }
  const img = document.createElement('img');
  img.className = 'gif';
  img.alt = exercise;
  container.appendChild(img);

  fetch(
    `https://g.tenor.com/v1/search?q=${encodeURIComponent(
      exercise
    )}&key=LIVDSRZULELA&limit=1`
  )
    .then((r) => r.json())
    .then((data) => {
      const url =
        data.results?.[0]?.media?.[0]?.tinygif?.url ||
        data.results?.[0]?.media?.[0]?.gif?.url;
      if (url) {
        img.src = url;
      } else {
        img.remove();
      }
    })
    .catch(() => img.remove());
}

// گوگل درایو
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY] });
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

document.getElementById('authorize_button').onclick = handleAuthClick;
document.getElementById('signout_button').onclick = handleSignoutClick;
document.getElementById('save_drive').onclick = saveToDrive;

render();
