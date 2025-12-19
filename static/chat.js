/* ===========================================================
   SAFE DOM ELEMENTS
   =========================================================== */
const historyBtn = document.getElementById("history-btn");
const historySidebar = document.getElementById("history-sidebar");
const list = document.getElementById("history-list");
const newChatBtnTop = document.getElementById("new-chat-top-btn");

const chatbox = document.getElementById("chatbox");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const langSelect = document.getElementById("lang");

const plusBtn = document.getElementById("plus-btn");
const uploadMenu = document.getElementById("upload-menu");
const fileInput = document.getElementById("file-input");

const micBtn = document.getElementById("mic-btn");
const recordBar = document.getElementById("record-bar");
const cancelBtn = document.getElementById("cancel-rec");
const confirmBtn = document.getElementById("confirm-rec");
const waveCanvas = document.getElementById("wave-canvas");

/* Check critical elements */
if (!chatbox || !chatForm || !userInput || !langSelect) {
    console.error("Missing required DOM elements. Chat may not work.");
}


/* ===========================================================
   SIDEBAR TOGGLE
   =========================================================== */
historyBtn.onclick = () => {
    historySidebar.classList.toggle("open");

    const open = historySidebar.classList.contains("open");
    historyBtn.classList.toggle("sidebar-open", open);
    newChatBtnTop.classList.toggle("sidebar-open", open);
};


/* ===========================================================
   HISTORY STORAGE
   =========================================================== */
let history = [];
try {
    history = JSON.parse(localStorage.getItem("mk-history") || "[]");
} catch {
    history = [];
}

function saveChat(userMsg, botMsg) {
    if (!userMsg) return;

    const title = userMsg.substring(0, 28) + (userMsg.length > 28 ? "..." : "");

    history.push({ title, user: userMsg, bot: botMsg });

    localStorage.setItem("mk-history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (!list) return;

    list.innerHTML = "";

    history.forEach((h, i) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.dataset.index = i;

        item.innerHTML = `<p class="history-title">${escapeHtml(h.title)}</p>`;

        item.onclick = () => {
            chatbox.innerHTML = `
                <div class="user-msg"><span class="msg">${escapeHtml(h.user)}</span></div>
                <div class="bot-msg"><span class="msg">${simpleFormat(h.bot)}</span></div>
            `;
        };

        list.appendChild(item);
    });
}

renderHistory();


/* ===========================================================
   NEW CHAT BUTTON (CLEAR ONLY)
   =========================================================== */
if (newChatBtnTop) {
    newChatBtnTop.onclick = () => {
        chatbox.innerHTML = "";
        setGreeting();
        userInput.value = "";
    };
}


/* ===========================================================
   FORMAT BOT TEXT
   =========================================================== */
function simpleFormat(text) {
    if (!text) return "";
    let html = escapeHtml(text);

    html = html.replace(/###\s*([0-9]+)\.\s*(.*?)(\n|$)/g,
        `<div style="margin:10px 0 6px;font-weight:600;font-size:16px;">$1. $2</div>`
    );

    html = html.replace(/(?:^|\n)(?:\* |- )(.+)(?=\n|$)/g,
        `<div style="margin-left:14px;margin-bottom:4px;">• $1</div>`
    );

    html = html.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`);

    return html.replace(/\n/g, "<br>");
}

function escapeHtml(str) {
    return str.replace(/[&<>"]/g, t => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[t]));
}


/* ===========================================================
   GREETING
   =========================================================== */
function setGreeting() {
    chatbox.innerHTML = "";

    const txt = langSelect.value === "ne"
        ? "Namastey 👋 Mah mero kishan hjr ko kasari help garam?"
        : "Hey 👋 I'm Mero Kisan. How can I help you today?";

    const bot = document.createElement("div");
    bot.className = "bot-msg";
    bot.innerHTML = `<span class="msg">${txt}</span>`;
    chatbox.appendChild(bot);
}

setGreeting();
langSelect.addEventListener("change", setGreeting);


/* ===========================================================
   FILE UPLOAD MENU
   =========================================================== */
if (plusBtn) {
    plusBtn.onclick = () => uploadMenu.classList.toggle("hidden");

    document.addEventListener("click", (e) => {
        if (!plusBtn.contains(e.target) && !uploadMenu.contains(e.target)) {
            uploadMenu.classList.add("hidden");
        }
    });

    document.getElementById("upload-photo").onclick = () => fileInput.click();
    document.getElementById("open-camera").onclick = () => {
        fileInput.setAttribute("capture", "camera");
        fileInput.click();
    };
    fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) return;

        // 1️⃣ Show the image in chat
        const reader = new FileReader();
        reader.onload = () => {
            const div = document.createElement("div");
            div.className = "user-msg";
            div.innerHTML = `<img src="${reader.result}" class="uploaded-img">`;
            chatbox.appendChild(div);
            chatbox.scrollTop = chatbox.scrollHeight;
        };
        reader.readAsDataURL(file);

        // 2️⃣ Send image to backend for AI analysis
        const fd = new FormData();
        fd.append("image", file);
        fd.append("lang", langSelect.value);

        fetch("/analyze-image", { method: "POST", body: fd })
            .then(res => res.text())
            .then(bot => {
                const b = document.createElement("div");
                b.className = "bot-msg";
                b.innerHTML = `<span class="msg">${simpleFormat(bot)}</span>`;
                chatbox.appendChild(b);
                chatbox.scrollTop = chatbox.scrollHeight;

                // Save in history too
                saveChat("[Image sent]", bot);
            })
            .catch(err => {
                const b = document.createElement("div");
                b.className = "bot-msg";
                b.innerHTML = `<span class="msg">⚠️ Error analyzing image.</span>`;
                chatbox.appendChild(b);
            });
    };



}

/* ===========================================================
   SEND MESSAGE
   =========================================================== */
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const msg = userInput.value.trim();
    if (!msg) return;
    userInput.value = "";

    const u = document.createElement("div");
    u.className = "user-msg";
    u.innerHTML = `<span class="msg">${escapeHtml(msg)}</span>`;
    chatbox.appendChild(u);

    // NEW WORKING CODE
    const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: msg,
            lang: langSelect.value,
            user_id: localStorage.getItem("user_id")
        })
    });

    const data = await res.json();

    // ✅ STORE user_id ONCE
    if (data.user_id && !localStorage.getItem("user_id")) {
        localStorage.setItem("user_id", data.user_id);
    }

    const bot = data.reply;


    const b = document.createElement("div");
    b.className = "bot-msg";
    b.innerHTML = `<span class="msg">${simpleFormat(bot)}</span>`;
    chatbox.appendChild(b);

    chatbox.scrollTop = chatbox.scrollHeight;

    saveChat(msg, bot);
});




/* ===========================================================
   VOICE RECOGNITION + VISUALIZER
   =========================================================== */
let recognition, audioStream, audioCtx, analyser, dataArray, rafId;

function initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
        let finalText = "";
        let interim = "";

        for (let i = 0; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
        }

        userInput.value = finalText + interim;
    };

    recognition.onend = () => {
        stopVisualizer();
        hideRecord();
    };
}
initRecognition();

async function startAudio() {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new AudioContext();
    const src = audioCtx.createMediaStreamSource(audioStream);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    dataArray = new Uint8Array(analyser.fftSize);
    src.connect(analyser);

    drawWave();
}

function drawWave() {
    const ctx = waveCanvas.getContext("2d");

    function loop() {
        analyser.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

        const barWidth = waveCanvas.width / 70;
        let x = 0;

        for (let i = 0; i < 70; i++) {
            let v = dataArray[i] / 128 - 1;
            let h = Math.abs(v * 40);
            ctx.fillStyle = "white";
            ctx.fillRect(x, 23 - h / 2, barWidth - 2, h);
            x += barWidth;
        }

        rafId = requestAnimationFrame(loop);
    }
    loop();
}

function stopVisualizer() {
    if (rafId) cancelAnimationFrame(rafId);
}

function showRecord() {
    recordBar.classList.remove("hidden");
    chatForm.classList.add("hidden");
}

function hideRecord() {
    recordBar.classList.add("hidden");
    chatForm.classList.remove("hidden");
}

/* Mic button */
micBtn.onclick = async () => {
    if (!recognition) initRecognition();

    recognition.lang = langSelect.value === "ne" ? "ne-NP" : "en-US";

    showRecord();
    await startAudio();

    try { recognition.start(); } catch { }
};

cancelBtn.onclick = () => {
    recognition.stop();
    stopVisualizer();
    stopAudio();
    userInput.value = "";
    hideRecord();
};

confirmBtn.onclick = () => {
    recognition.stop();
    stopVisualizer();
    stopAudio();
    hideRecord();
    userInput.focus();
};
