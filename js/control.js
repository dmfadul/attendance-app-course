console.log("controls JS loaded");

async function loadSessionsConfig() {
  const GIST_ID = 'e2c98b8850cffdd04f61d8cbeaa0d04f';

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();
    const files = data.files;

    const params = new URLSearchParams(window.location.search);
    const eventCode = params.get('event');
    
    const targetFileName = `${eventCode}-config.json`;
    const file = files[targetFileName];

    if (file) {
        const configContent = JSON.parse(file.content);
        return configContent;
      } else {
        console.error(`File ${targetFileName} not found in gist.`);
        return [];
      }
  } catch (err) {
    console.error("Error loading configs:", err);
    return [];
  }
}

function renderSessionLinks(config) {
  const list = document.getElementById("session-links");
  list.innerHTML = "";

  const eventCode = config.eventCode;
  const numDays = config.numDays;
  const sessionsPerDay = config.sessionsPerDay;
  
  const baseUrl = window.location.origin + "/attendance-app/session/form.html?event=" + encodeURIComponent(eventCode);
  const responseUrl = window.location.origin + "/attendance-app/session/responses.html?event=" + encodeURIComponent(eventCode);

  for (let day = 1; day <= numDays; day++) {
    for (let session = 1; session <= sessionsPerDay; session++) {
        const li = document.createElement("li");
        const a = document.createElement("a");

        a.href = `${baseUrl}&session=day${day}-slot${session}`;
        a.textContent = `form: ${config.eventCode}: Dia ${day} Turno ${session}`;
        a.target = "_blank";
        a.className = "d-block mb-2 text-primary";

        li.appendChild(a);
        list.appendChild(li);
    }
  }

  for (let day = 1; day <= numDays; day++) {
    for (let session = 1; session <= sessionsPerDay; session++) {
        const li = document.createElement("li");
        const a = document.createElement("a");

        a.href = `${responseUrl}&session=day${day}-slot${session}`;
        a.textContent = `Respostas: ${config.eventCode}: Dia ${day} Turno ${session}`;
        a.target = "_blank";
        a.className = "d-block mb-2 text-primary";

        li.appendChild(a);
        list.appendChild(li);
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const config = await loadSessionsConfig();
  renderSessionLinks(config);
});
