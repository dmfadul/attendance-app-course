document.getElementById("editor-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const eventName = document.getElementById("event-name").value.trim();
    const discCode = document.getElementById("event-code").value.trim();
    const eventDate = document.getElementById("class-date").value.trim();
    const eventPeriod = document.getElementById("class-period").value.trim();
    const turmaOptions = document.getElementById("turmas-select").selectedOptions;
    const selectedTurmas = Array.from(turmaOptions).map(opt => opt.value);
   
    const linksList = document.getElementById("generated-links");
    linksList.innerHTML = ""; // Clear previous
  
    const eventCode = discCode + "-" + eventDate + "-" + eventPeriod;
    const baseUrl = window.location.origin + "/attendance-app-course/session/form.html";
  
    const sessionId = `${eventDate}-${eventPeriod}`;
    const fullUrl = `${baseUrl}?event=${encodeURIComponent(eventCode)}`;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = fullUrl;
    a.textContent = `Session: ${eventName} - ${sessionId}`;
    a.target = "_blank";
    li.appendChild(a);
    linksList.appendChild(li);

  
    // Optionally export config or store locally
    const config = {      
      discCode,
      eventName,
      eventDate,
      eventPeriod,
      selectedTurmas,      
      generatedAt: new Date().toISOString()
    };
    console.log("Config object:", eventCode);

    // Store in localStorage for now
    // localStorage.setItem(`config-${eventCode}`, JSON.stringify(config, null, 2));

    // Send config to Netlify backend
    fetch("https://espcendpoint2.netlify.app/.netlify/functions/updateConfig", {
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
  
