console.log("JS file loaded 2");

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    event: params.get('event'),
    session: params.get('session')
  };
}

function populateClassDropdown(students) {
  const classSelect = document.getElementById("class-select");
  const nameSelect = document.getElementById("name-select");

  // Populate class dropdown
  Object.keys(students).sort().forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    classSelect.appendChild(option);
  });

  classSelect.addEventListener("change", () => {
    const selectedClass = classSelect.value;
    const names = students[selectedClass];

    // Clear old name options
    nameSelect.innerHTML = "";
    nameSelect.disabled = false;

    // Populate name dropdown
    names.sort().forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      nameSelect.appendChild(opt);
    });
  });
}

function showStatus(message, success = true) {
  const div = document.getElementById("status");
  div.textContent = message;
  div.style.color = success ? "green" : "red";
}

async function loadConfig(eventCode) {
  const GIST_ID = 'be8732ad8a0fbdd966c3ff00f42a2aeb';
  const filename = `${eventCode}-config.json`;
  const url = `https://gist.githubusercontent.com/dmfadul/${GIST_ID}/raw/${filename}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load config");
  return await res.json();
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
  const turnoDict = {
    "slot1": "Manhã",
    "slot2": "Tarde",
    "slot3": "Noite"
  }

  const { event, session } = getQueryParams();
  const [ day, turno ] = session.split("-");
  const dia = day.replace("day", "dia ");
  console.log("Event:", event, "Session:", session);

  const title = document.getElementById("form-title");

  try {
    const config = await loadConfig(event);
    const students = await loadStudents();
    console.log("students:", students);

    const eventName = config.eventName;
    title.innerHTML = `${eventName}<br>${dia} - ${turnoDict[turno]}`;
    populateClassDropdown(students);
  } catch (err) {
    showStatus("Configuration not found or failed to load.", false);
    document.getElementById("checkin-form").style.display = "none";
    console.error("Error loading config:", err);
    return;
  }

  document.getElementById("checkin-form").addEventListener("submit", function (e) {
    e.preventDefault();
    
    const classCode = document.getElementById("class-select").value;
    const participant = document.getElementById("name-select").value;

    if (!navigator.geolocation) {
      showStatus("Geolocation not supported.", false);
      return;
    }

    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const record = {
        class: classCode,
        name: participant,
        timestamp: new Date().toISOString(),
        location: { lat: latitude, lng: longitude },
        event,
        session
      };
      
      const key = `attendance-${event}-${session}`;
      const prevData = JSON.parse(localStorage.getItem(key) || "[]");
      prevData.push(record);
      const newData = JSON.stringify(prevData, null, 2);
      localStorage.setItem(key, newData);

      // Send to Netlify
      fetch("https://espcendpoint2.netlify.app/.netlify/functions/updateGist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventCode: event,
          sessionCode: session,
          data: record
        })
      })
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          showStatus("Resposta Registrada.");
        } else {
          showStatus("Saved locally, but failed to sync.", false);
          console.error("Sync error:", response);
        }
      })
      .catch(err => {
        showStatus("Saved locally, but failed to sync.", false);
        console.error("Sync error:", err);
      });
    }, error => {
      showStatus("Failed to get GPS location.", false);
    });
  });

  function generateQRCode(url) {
    const qr = new QRious({
      element: document.getElementById('qr-code'),
      value: url,
      size: 200
    });
  
    // Generate download link
    const canvas = document.getElementById('qr-code');
    const link = document.getElementById('download-qr');
    link.href = canvas.toDataURL("image/png");
  }
  
  const pageUrl = window.location.href;
  generateQRCode(pageUrl);
    
});
