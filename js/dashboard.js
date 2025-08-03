console.log("Dashboard JS loaded");

async function loadConfigs() {
  const GIST_ID = 'be8732ad8a0fbdd966c3ff00f42a2aeb';

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();
    const files = data.files;

    const configFiles = Object.keys(files).filter(filename =>
      filename.toLowerCase().includes('config')
    );

    return configFiles.map(filename => ({
      filename,
      eventCode: filename.split('-config')[0],
      content: files[filename].content // optional, in case you want to show preview
    }));
  } catch (err) {
    console.error("Error loading configs:", err);
    return [];
  }
}

function renderConfigLinks(configs) {
  const list = document.getElementById("config-links");
  list.innerHTML = "";

  if (configs.length === 0) {
    list.innerHTML = "<li>Nenhum config file Encontrado.</li>";
    return;
  }

  const baseUrl = window.location.origin + "/attendance-app-course/session/control.html";

  configs.forEach(config => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    a.href = `${baseUrl}?event=${encodeURIComponent(config.eventCode)}`;
    a.textContent = `Control Panel: ${config.eventCode}`;
    a.target = "_blank";
    a.className = "d-block mb-2 text-primary";

    li.appendChild(a);
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const configs = await loadConfigs();
  renderConfigLinks(configs);
});
