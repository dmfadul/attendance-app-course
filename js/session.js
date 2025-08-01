console.log("JS file loaded 2");

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    event: params.get('event'),
    session: params.get('session')
  };
}

function populateNamesDropdown(participants_raw) {
  const select = document.getElementById('name-select');

  const participants = [...new Set(participants_raw.filter(p => typeof p === 'string'))].sort();

  participants.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function showStatus(message, success = true) {
  const div = document.getElementById("status");
  div.textContent = message;
  div.style.color = success ? "green" : "red";
}

async function loadConfig(eventCode) {
  const GIST_ID = 'e2c98b8850cffdd04f61d8cbeaa0d04f';
  const filename = `${eventCode}-config.json`;
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

  const title = document.getElementById("form-title");

  try {
    const config = await loadConfig(event);
    const eventName = config.eventName;
    title.innerHTML = `${eventName}<br>${dia} - ${turnoDict[turno]}`;
    populateNamesDropdown(config.participants);
  } catch (err) {
    showStatus("Configuration not found or failed to load.", false);
    document.getElementById("checkin-form").style.display = "none";
    return;
  }

  document.getElementById("checkin-form").addEventListener("submit", function (e) {
    e.preventDefault();
    
    const participant = document.getElementById("name-select").value;
    const email = document.getElementById("email-input").value;
    const cargo = document.getElementById("function-select").value;


    if (!navigator.geolocation) {
      showStatus("Geolocation not supported.", false);
      return;
    }

    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      const record = {
        name: participant,
        email: email,
        cargo: cargo,
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
      fetch("https://espcendpoint.netlify.app/.netlify/functions/updateGist", {
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
