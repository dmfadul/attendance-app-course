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

async function loadStudents() {
  const GIST_ID = 'be8732ad8a0fbdd966c3ff00f42a2aeb';
  const filename = 'students.json';
  const url = `https://gist.githubusercontent.com/dmfadul/${GIST_ID}/raw/${filename}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load config");
  return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const event = params.get('event');
  const selectedTurmas = event.split("-")[5].split("+");
  
  const fileContent = await loadResponses();
  const allStudents = await loadStudents();
  
  // Filter students dict to keep only selected turmas
  let filteredStudents;

  if (selectedTurmas.includes("ALL")) {
    // Use all turmas
    filteredStudents = allStudents;
  } else {
    // Use only selected turmas
    filteredStudents = Object.fromEntries(
      Object.entries(allStudents).filter(([key]) => selectedTurmas.includes(key))
    );
  }
  
  // Group responses by class (turma)
  const groupedResponses = {};
  for (const turma of selectedTurmas) {
    groupedResponses[turma] = fileContent.filter(r => r.class === turma);
  }
  
  const container = document.getElementById("responses-container");
  container.innerHTML = ""; // Clear previous

  const turnoDict = {
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite"
  };

  const year = event.split("-")[1]
  const month = event.split("-")[2];
  const day = event.split("-")[3];
  const date = new Date(year, month - 1, day);
  console.log("Date:", date);

  const turno = event.split("-")[6];
  const fullTurno = turnoDict[turno] || turno;

 // Title
  const h1 = document.getElementById("form-title");
  h1.innerHTML = `${event}`;

  // Render responses & missing by turma
  for (const turma of selectedTurmas) {
    const turmaRespondents = groupedResponses[turma] || [];
    const expectedNames = filteredStudents[turma] || [];

    // Build section title
    const sectionTitle = document.createElement("h3");
    sectionTitle.className = "mt-5";
    sectionTitle.textContent = `Turma ${turma}`;
    container.appendChild(sectionTitle);

    // Table
    const table = document.createElement("table");
    table.className = "table table-striped table-sm";
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Nome</th>
          <th>Localização</th>
          <th>Data/Hora</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    container.appendChild(table);

    const tbody = table.querySelector("tbody");

    // Render rows
    let lastName = null;
    const seenNames = new Set();
    turmaRespondents
      .filter(r => typeof r.name === "string")
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((response, index) => {
        if (seenNames.has(response.name)) return;
        seenNames.add(response.name);

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${String(index + 1).padStart(2, "0")}</td>
          <td>${response.name}</td>
          <td>${response.location ? `${response.location.lat.toFixed(6)}, ${response.location.lng.toFixed(6)}` : "N/A"}</td>
          <td>${new Date(response.timestamp).toLocaleString("pt-BR")}</td>
        `;

        tbody.appendChild(row);
      });

    // Missing participants
    const respondentNames = turmaRespondents.map(r => r.name);
    const missingNames = expectedNames.filter(p => !respondentNames.includes(p));

    const missingTitle = document.createElement("h6");
    missingTitle.className = "mt-3";
    missingTitle.textContent = "Faltantes:";
    container.appendChild(missingTitle);

    const ul = document.createElement("ul");
    ul.className = "list-group mb-5";

    missingNames.sort().forEach(name => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = name;
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }
});
