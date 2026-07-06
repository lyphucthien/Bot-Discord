function openLink(url) {
    window.open(url, "_blank", "noopener,noreferrer");
}

const socket = io();

document.addEventListener("visibilitychange", () => {
    socket.emit("visibility", document.visibilityState === "visible");
});
socket.emit("visibility", document.visibilityState === "visible");

const defaultSettings = {
    theme: "dark",
    animation: true,
    blur: true,
    accent: "#3b82f6",
    showPingChart: true,
    showRamChart: true,
    music: false,
    compact: false,
    timeFormat: "24h"
};

let settings = JSON.parse(localStorage.getItem("dashboardSettings")) || defaultSettings;

function saveSettings() {
    localStorage.setItem("dashboardSettings", JSON.stringify(settings));
}

let pingChart;
let ramChart;

let pingData = [];
let ramData = [];

// Playlist giờ được nạp từ /playlist.json thay vì hardcode trong file này
let playlist = [];

let currentSong = 0;
let isShuffle = false;
let isRepeat = false;
let audio;

const MUSIC_KEY = "dashboardMusic";

function saveMusicState() {
    if (!audio) return;

    localStorage.setItem(
        MUSIC_KEY,
        JSON.stringify({
            song: currentSong,
            time: audio.currentTime,
            volume: audio.volume,
            shuffle: isShuffle,
            repeat: isRepeat
        })
    );
}

function loadMusicState() {
    if (!playlist.length) return;

    const saved = localStorage.getItem(MUSIC_KEY);
    if (!saved) {
        loadTrack(currentSong);
        return;
    }

    try {
        const data = JSON.parse(saved);

        currentSong = data.song ?? 0;
        isShuffle = data.shuffle ?? false;
        isRepeat = data.repeat ?? false;

        audio.volume = data.volume ?? 0.5;
        loadTrack(currentSong);

        audio.onloadedmetadata = () => {
            audio.currentTime = data.time ?? 0;
        };

        document.getElementById("volume").value = (audio.volume * 100);

        audio.loop = isRepeat;

        document.getElementById("shuffleBtn").style.opacity = isShuffle ? "1" : "0.4";
        document.getElementById("repeatBtn").style.opacity = isRepeat ? "1" : "0.4";
    } catch (e) {
        console.error(e);
    }
}

function loadTrack(index) {
    const song = playlist[index];
    if (!song || !audio) return;

    document.getElementById("songTitle").innerText = song.title;
    document.getElementById("artist").innerText = song.artist;
    document.getElementById("cover").src = song.cover;

    audio.src = song.src;
    audio.load();

    const progressBar = document.getElementById("progressBar");
    const currentTime = document.getElementById("currentTime");
    const duration = document.getElementById("duration");

    progressBar.value = 0;
    currentTime.innerText = "0:00";
    duration.innerText = "0:00";

    audio.onloadedmetadata = () => {
        duration.innerText = formatTime(audio.duration);
    };
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
}

pingChart = new Chart(document.getElementById("pingChart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            data: [],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,.15)",
            fill: true,
            tension: .35,
            pointRadius(ctx) {
                const i = ctx.dataIndex;
                const d = ctx.dataset.data;
                if (i === 0) return 0;
                return d[i] !== d[i - 1] ? 4 : 0;
            },
            pointHoverRadius: 6,
            pointHitRadius: 15
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { beginAtZero: true }
        }
    }
});

ramChart = new Chart(document.getElementById("ramChart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,.15)",
            fill: true,
            tension: .35,
            pointRadius(ctx) {
                const i = ctx.dataIndex;
                const d = ctx.dataset.data;
                if (i === 0) return 0;
                return d[i] !== d[i - 1] ? 4 : 0;
            },
            pointHoverRadius: 6,
            pointHitRadius: 15
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { beginAtZero: true }
        }
    }
});

socket.on("uptimeBlock", (v) => {
    const blocks = document.getElementById("uptimeBlocks");
    if (!blocks) return;

    const div = document.createElement("div");
    div.className = "block " + (v.online ? "onlineBlock" : "offlineBlock");

    const date = new Date(v.time);
    div.title = (v.online ? "Online" : "Offline") + " • " +
        date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    blocks.appendChild(div);
});

socket.on("history", data => {
    pingData = data.ping || [];
    ramData = data.ram || [];

    pingChart.data.labels = pingData.map((_, i) => i);
    pingChart.data.datasets[0].data = pingData;
    pingChart.update();

    ramChart.data.labels = ramData.map((_, i) => i);
    ramChart.data.datasets[0].data = ramData;
    ramChart.update();

    const blocks = document.getElementById("uptimeBlocks");
    if (!blocks) return;

    blocks.innerHTML = "";

    (data.uptime || []).forEach(v => {
        const div = document.createElement("div");
        const isOnline = v.online;

        div.className = "block " + (isOnline ? "onlineBlock" : "offlineBlock");

        const date = new Date(v.time);
        const formatted = date.toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        div.title = (isOnline ? "Online" : "Offline") + " • " + formatted;
        blocks.appendChild(div);
    });
});

socket.on("stats", (data) => {
    if (!data) return;

    const ping = document.getElementById("ping");
    const ram = document.getElementById("ram");
    const cpu = document.getElementById("cpu");
    const time = document.getElementById("time");
    const uptime = document.getElementById("uptime");

    ping.classList.remove("good", "warning", "danger", "shake");
    ram.classList.remove("good", "warning", "danger", "glow");
    cpu.classList.remove("good", "warning", "danger", "pulse");

    ping.classList.remove("loading-spinner");
    ram.classList.remove("loading-spinner");
    cpu.classList.remove("loading-spinner");
    time.classList.remove("loading-spinner");
    uptime.classList.remove("loading-spinner");

    ping.innerText = data.ping + " ms";
    ram.innerText = data.ram + " MB";
    cpu.innerText = data.cpu + " %";

    const now = new Date();
    time.innerText = now.toLocaleString("vi-VN", {
        hour12: settings.timeFormat === "12h",
        timeZone: "Asia/Ho_Chi_Minh"
    });

    uptime.innerText = data.uptime;

    ping.classList.add(data.status.ping);
    if (data.status.ping === "danger") ping.classList.add("shake");

    ram.classList.add(data.status.ram);
    if (data.status.ram === "warning") ram.classList.add("glow");
    if (data.status.ram === "danger") ram.classList.add("glow");

    cpu.classList.add(data.status.cpu);
    if (data.status.cpu === "danger") cpu.classList.add("pulse");

    document.getElementById("guilds").innerText = data.guilds;

    // Trạng thái online/offline giờ cập nhật qua socket thay vì render sẵn ở server
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    if (statusDot && statusText) {
        statusDot.classList.toggle("online", data.online);
        statusDot.classList.toggle("offline", !data.online);
        statusText.innerText = data.online ? "ONLINE" : "OFFLINE";
    }

    const botNameEl = document.getElementById("botName");
    if (botNameEl) botNameEl.innerText = "🤖 " + (data.botName || "Bot Lâm Đồng");

    const onlinePercent = document.getElementById("onlinePercent");
    const disconnectCount = document.getElementById("disconnectCount");
    const longestUptime = document.getElementById("longestUptime");
    const lastRestart = document.getElementById("lastRestart");

    if (onlinePercent) onlinePercent.innerText = data.onlinePercent + "%";
    if (disconnectCount) disconnectCount.innerText = data.disconnectCount;
    if (longestUptime) longestUptime.innerText = data.longestUptime;
    if (lastRestart) lastRestart.innerText = data.time;

    pingData.push(data.ping ?? 0);
    ramData.push(data.ram);

    if (ramData.length > 60) ramData.shift();
    if (pingData.length > 60) pingData.shift();

    pingChart.data.labels = pingData.map((_, i) => i);
    pingChart.data.datasets[0].data = pingData;
    pingChart.update("none");

    ramChart.data.labels = ramData.map((_, i) => i);
    ramChart.data.datasets[0].data = ramData;
    ramChart.update("none");

    if (data.version) {
        document.getElementById("version").textContent = "v" + data.version;
        document.getElementById("node").textContent = data.node;
        document.getElementById("discordjs").textContent = "v" + data.discordjs;
        document.getElementById("express").textContent = "v" + data.express;
        document.getElementById("host").textContent = data.host;
    }

    // Cập nhật bảng Bot Info trong modal Settings
    const infoBotName = document.getElementById("infoBotName");
    const botPing = document.getElementById("botPing");
    const botServers = document.getElementById("botServers");
    const botRam = document.getElementById("botRam");
    const botCpu = document.getElementById("botCpu");
    const botUptime = document.getElementById("botUptime");
    const botStatus = document.getElementById("botStatus");

    if (infoBotName) infoBotName.textContent = data.botName || "Discord Bot";
    if (botPing) botPing.textContent = data.ping + " ms";
    if (botServers) botServers.textContent = data.guilds || "0";
    if (botRam) botRam.textContent = data.ram + " MB";
    if (botCpu) botCpu.textContent = data.cpu + " %";
    if (botUptime) botUptime.textContent = data.uptime || "-";
    if (botStatus) {
        botStatus.textContent = data.online ? "🟢 Online" : "🔴 Offline";
        botStatus.style.color = data.online ? "#22c55e" : "#ef4444";
    }
});

function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
    updateThemeButton();
}

function updateThemeButton() {
    const themeBtn = document.getElementById("themeBtn");
    if (!themeBtn) return;

    const theme = document.documentElement.getAttribute("data-theme");
    const map = { dark: "🌙 Dark", light: "☀️ Light", oled: "⚫ OLED" };

    themeBtn.textContent = map[theme] ?? "🌙 Dark";
}

function applySettings() {
    setTheme(settings.theme);

    document.documentElement.style.setProperty("--primary", settings.accent);

    document.body.classList.toggle("no-animation", !settings.animation);
    document.body.classList.toggle("no-blur", !settings.blur);

    const leftCharts = document.querySelector(".left-charts");
    if (leftCharts) leftCharts.style.display = settings.showPingChart ? "" : "none";

    const ramChartCard = document.querySelectorAll(".chart-card")[1];
    if (ramChartCard) ramChartCard.style.display = settings.showRamChart ? "" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
    const themeBtn = document.getElementById("themeBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsModal = document.getElementById("settingsModal");

    const modal = document.getElementById("uptimeModal");
    const closeBtn = document.getElementById("closeModal");
    const uptimeBtn = document.getElementById("uptimeStat");

    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");
    const menuOverlay = document.getElementById("menuOverlay");
    const closeMenu = document.getElementById("closeMenu");

    menuBtn.addEventListener("click", () => {
        document.body.classList.add("menu-open");
        sideMenu.classList.add("show");
        menuOverlay.classList.add("show");

        menuBtn.style.opacity = "0";
        menuBtn.style.transform = "scale(.8)";
        menuBtn.style.pointerEvents = "none";
    });

    function closeSideMenu() {
        document.body.classList.remove("menu-open");
        sideMenu.classList.remove("show");
        menuOverlay.classList.remove("show");

        menuBtn.style.opacity = "1";
        menuBtn.style.transform = "scale(1)";
        menuBtn.style.pointerEvents = "auto";
    }

    closeMenu.addEventListener("click", closeSideMenu);
    menuOverlay.addEventListener("click", closeSideMenu);

    themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        let next;

        if (current === "dark") next = "light";
        else if (current === "light") next = "oled";
        else next = "dark";

        setTheme(next);
    });

    uptimeBtn.addEventListener("click", () => modal.classList.add("show"));
    closeBtn.addEventListener("click", () => modal.classList.remove("show"));

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("show");
    });

    audio = document.getElementById("bgMusic");
    const playBtn = document.getElementById("playMusic");
    const volume = document.getElementById("volume");

    const progressBar = document.getElementById("progressBar");
    const currentTime = document.getElementById("currentTime");
    const duration = document.getElementById("duration");

    audio.ontimeupdate = () => {
        if (!audio.duration) return;

        progressBar.value = audio.currentTime / audio.duration * 100;
        currentTime.innerText = formatTime(audio.currentTime);

        saveMusicState();
    };

    progressBar.oninput = () => {
        audio.currentTime = progressBar.value / 100 * audio.duration;
        saveMusicState();
    };

    let isToggling = false;

    playBtn.onclick = async () => {
        if (isToggling) return;
        isToggling = true;

        try {
            if (audio.paused) {
                await audio.play();
                playBtn.innerHTML = "⏸";
            } else {
                audio.pause();
                playBtn.innerHTML = "▶";
            }
        } catch (err) {
            console.warn(err);
        }

        isToggling = false;
        saveMusicState();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentSong++;
        if (currentSong >= playlist.length) currentSong = 0;

        loadTrack(currentSong);
        audio.play();
        playBtn.innerHTML = "⏸";
        saveMusicState();
    };

    document.getElementById("prevBtn").onclick = () => {
        currentSong--;
        if (currentSong < 0) currentSong = playlist.length - 1;

        loadTrack(currentSong);
        audio.play();
        playBtn.innerHTML = "⏸";
        saveMusicState();
    };

    document.getElementById("shuffleBtn").onclick = () => {
        isShuffle = !isShuffle;
        document.getElementById("shuffleBtn").style.opacity = isShuffle ? "1" : "0.4";
        saveMusicState();
    };

    document.getElementById("repeatBtn").onclick = () => {
        isRepeat = !isRepeat;
        audio.loop = isRepeat;
        document.getElementById("repeatBtn").style.opacity = isRepeat ? "1" : "0.4";
        saveMusicState();
    };

    volume.oninput = () => {
        audio.volume = volume.value / 100;
        saveMusicState();
    };

    audio.onended = () => {
        if (isRepeat) return;

        if (playlist.length <= 1) {
            audio.play();
            return;
        }

        if (isShuffle) {
            currentSong = Math.floor(Math.random() * playlist.length);
        } else {
            currentSong = (currentSong + 1) % playlist.length;
        }

        loadTrack(currentSong);
        audio.play();
        saveMusicState();
    };

    // Nạp playlist từ route tĩnh /playlist.json (bước 3.3)
    try {
        const res = await fetch("/playlist.json");
        playlist = await res.json();
    } catch (err) {
        console.error("❌ Không tải được playlist.json:", err);
        playlist = [];
    }

    loadMusicState();

    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    applySettings();
    updateThemeButton();

    const closeSettings = document.getElementById("closeSettings");
    const themeSelect = document.getElementById("themeSelect");
    const animationToggle = document.getElementById("animationToggle");
    const blurToggle = document.getElementById("blurToggle");
    const accentPicker = document.getElementById("accentPicker");

    const pingChartToggle = document.getElementById("pingChartToggle");
    const ramChartToggle = document.getElementById("ramChartToggle");
    const musicToggle = document.getElementById("musicToggle");

    const timeFormatSelect = document.getElementById("timeFormatSelect");
    const saveBtn = document.getElementById("saveSettings");

    settingsBtn.addEventListener("click", () => {
        themeSelect.value = settings.theme;
        animationToggle.checked = settings.animation;
        blurToggle.checked = settings.blur;
        accentPicker.value = settings.accent;

        pingChartToggle.checked = settings.showPingChart;
        ramChartToggle.checked = settings.showRamChart;
        musicToggle.checked = settings.music;

        timeFormatSelect.value = settings.timeFormat;

        settingsModal.classList.add("show");
    });

    closeSettings.addEventListener("click", () => settingsModal.classList.remove("show"));

    window.addEventListener("click", (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove("show");
    });

    saveBtn.onclick = () => {
        settings.theme = themeSelect.value;
        settings.animation = animationToggle.checked;
        settings.blur = blurToggle.checked;
        settings.accent = accentPicker.value;

        settings.showPingChart = pingChartToggle.checked;
        settings.showRamChart = ramChartToggle.checked;
        settings.music = musicToggle.checked;

        settings.timeFormat = timeFormatSelect.value;

        saveSettings();
        applySettings();
        loadTrack(currentSong);
        settingsModal.classList.remove("show");
    };
});