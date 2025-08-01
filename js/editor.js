document.getElementById("editor-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const eventName = document.getElementById("event-name").value.trim();
    const eventCode = document.getElementById("event-code").value.trim();
    const numDays = parseInt(document.getElementById("num-days").value);
    const sessionsPerDay = parseInt(document.getElementById("sessions-per-day").value);
    const participantsRaw = document.getElementById("participants").value.trim();
  
    const participants = participantsRaw.split("\n").map(name => name.trim()).filter(Boolean);
  
    const linksList = document.getElementById("generated-links");
    linksList.innerHTML = ""; // Clear previous
  
    const baseUrl = window.location.origin + "/attendance-app/session/form.html";
  
    for (let day = 1; day <= numDays; day++) {
      for (let session = 1; session <= sessionsPerDay; session++) {
        const sessionId = `day${day}-slot${session}`;
        const fullUrl = `${baseUrl}?event=${encodeURIComponent(eventCode)}&session=${encodeURIComponent(sessionId)}`;
  
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = fullUrl;
        a.textContent = `Session: ${eventName} - ${sessionId}`;
        a.target = "_blank";
        li.appendChild(a);
        linksList.appendChild(li);
      }
    }
  
    // Optionally export config or store locally
    const config = {
      eventCode,
      eventName,
      numDays,
      sessionsPerDay,
      participants,
      generatedAt: new Date().toISOString()
    };
    console.log("Generated config:", participants);
    console.log("Config object:", eventCode);

    // Store in localStorage for now
    // localStorage.setItem(`config-${eventCode}`, JSON.stringify(config, null, 2));

    // Send config to Netlify backend
    fetch("https://espcendpoint.netlify.app/.netlify/functions/updateConfig", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ eventCode, config })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Config synced to Gist:", data);
    })
    .catch(err => {
      console.error("Error syncing config:", err);
    });
  });
  
