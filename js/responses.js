console.log("responses JS loaded");

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      event: params.get('event'),
      session: params.get('session')
    };
}

async function loadResponses() {
  const GIST_ID = 'be8732ad8a0fbdd966c3ff00f42a2aeb';

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();
    const files = data.files;

    const params = new URLSearchParams(window.location.search);
    let event = params.get('event');
    
    const targetFileName = `${event}.json`;
    console.log("Loading responses from file:", targetFileName);
    console.log("Available files in gist:", Object.keys(files));
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

async function loadParticipants() {
  const GIST_ID = 'be8732ad8a0fbdd966c3ff00f42a2aeb';

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();
    const files = data.files;

    const { event, session } = getQueryParams();
    
    const filename = `${event}-config.json`;
    const file = files[filename];

    if (file) {
        const configContent = JSON.parse(file.content);
        return configContent.participants;
      } else {
        console.error(`File ${targetFileName} not found in gist.`);
        return [];
      }
  } catch (err) {
    console.error("Error loading configs:", err);
    return [];
  }
}

function renderResponses(fileContent) {
  const turnoDict = {
    "morning": "Manhã",
    "afternoon": "Tarde",
    "evening": "Noite"
  }
  
  const h1 = document.getElementById("form-title");
  
  const { event, session } = getQueryParams();
  const [ day, turno ] = session.split("-");
  const dia = day.replace("day", "dia ");

  h1.innerHTML = `Respostas: ${event}<br>${dia} - ${turnoDict[turno]}`;
  
  const tableBody = document.querySelector("#responses tbody");
  tableBody.innerHTML = "";

  const respondents = fileContent.filter(r => typeof r.name === 'string');

  respondents.sort((a, b) => a.name.localeCompare(b.name));

  let lastRespondentName = null;
  respondents.forEach((response, index) => {
      if (response.name === lastRespondentName) {
          return; // Skip duplicate names
      } else {
          lastRespondentName = response.name;
      }
      const { location, timestamp } = response;

      const row = document.createElement("tr");

      const idxCell = document.createElement("td");
      idxCell.textContent = String(index + 1).padStart(2, '0');
      row.appendChild(idxCell);

      const nameCell = document.createElement("td");
      nameCell.textContent = response.name;
      row.appendChild(nameCell);

      const locationCell = document.createElement("td");
      locationCell.textContent = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "N/A";
      row.appendChild(locationCell);

      const timestampCell = document.createElement("td");
      const date = new Date(timestamp);
      timestampCell.textContent = isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString("pt-BR");
      row.appendChild(timestampCell);

      tableBody.appendChild(row);
  });
}

function renderMissingParticipants(missingParticipantsRaw) {
  const list = document.getElementById("missing-participants");
  list.innerHTML = "";
  
  const missingParticipants = [...new Set(missingParticipantsRaw.filter(p => typeof p === 'string'))].sort();
  missingParticipants.forEach((p) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = p;
      list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const fileContent = await loadResponses();
  const participants = await loadParticipants();
  console.log("Loaded participants:", participants);
  console.log("Loaded responses:", fileContent);
  
  // const respondents = Object.values(fileContent).map(r => r.name);
  // const missingParticipants = participants.filter(p => !respondents.includes(p));
  
  // renderResponses(fileContent);
  // renderMissingParticipants(missingParticipants);
});
