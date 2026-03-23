import {
  getCurrentWeek,
  getCurrentDay,
  getCurrentScene,
  getEntryProgressText,
  hasSavedProgress,
  getJourneyProgress,
  getMapIndex,
  getCompletedWeeksCount,
  getVisibleTaskPhase,
  getParentNote,
  getWeekBadgePath
} from "../core/selectors.js";

const completeSound = new Audio("assets/sounds/tamam.mp3");
completeSound.preload = "auto";

const finalSound = new Audio("assets/sounds/final.mp3");
finalSound.preload = "auto";

let celebrationTimer = null;

function qs(id) {
  return document.getElementById(id);
}

function setSceneVisible(visible) {
  const display = visible ? "" : "none";
  qs("bg").style.display = display;
  qs("findik").style.display = display;
  document.querySelector(".dost").style.display = display;
  qs("journeyBar").style.display = visible ? "" : "none";
}

function showOnlyScreen(view) {
  qs("taskScreen").hidden = view !== "task";
  qs("mapScreen").hidden = view !== "map";
  qs("badgeScreen").hidden = view !== "badges";
  qs("aboutScreen").hidden = view !== "about";
}

function updateNav(view) {
  document.querySelectorAll(".navBtn").forEach(btn => {
    btn.classList.toggle("isActive", btn.dataset.tab === view);
  });
}

function playCompleteSound() {
  try {
    completeSound.pause();
    completeSound.currentTime = 0;
    completeSound.play().catch(() => {});
  } catch {}
}

function playFinalSound() {
  try {
    finalSound.pause();
    finalSound.currentTime = 0;
    finalSound.play().catch(() => {});
  } catch {}
}

function tebrikRain() {
  const count = 120;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("img");
    p.src = "assets/images/tebrik.png";
    p.className = "tebrikParticle";
    p.style.left = Math.random() * 100 + "vw";

    const size = 18 + Math.random() * 20;
    p.style.width = size + "px";

    const duration = 2 + Math.random() * 2;
    p.style.animationDuration = duration + "s";
    p.style.animationDelay = Math.random() * 0.5 + "s";

    document.body.appendChild(p);

    setTimeout(() => p.remove(), duration * 1000);
  }
}

function openParentNote(program, state) {
  const popup = document.createElement("div");
  popup.className = "notePopup";
  popup.innerHTML = `
    <div class="notePopupCard">
      <div class="noteTitle">Ebeveyn Notu</div>
      <div class="noteText">${getParentNote(program, state)}</div>
      <button class="noteClose">Kapat</button>
    </div>
  `;
  document.body.appendChild(popup);
  popup.querySelector(".noteClose").onclick = () => popup.remove();
}

function renderJourney(program, state) {
  const journeyBar = qs("journeyBar");
  if (state.ui.view !== "task") {
    journeyBar.innerHTML = "";
    return;
  }

  const { progress, totalDays } = getJourneyProgress(program, state);
  const badge = state.progress.current.weekIndex + 1;
  const lastIndex = totalDays - 1;

  let html = "";
  for (let i = 0; i < totalDays; i++) {
    let img;

    if (i === lastIndex) {
      img = progress >= totalDays ? `r${badge}.png` : `r${badge}g.png`;
    } else {
      img = i < progress ? "p2.png" : "p1.png";
    }

    html += `<img src="assets/images/${img}" class="paw">`;
  }

  journeyBar.innerHTML = html;
}

function renderMap(program, state) {
  qs("mapScreen").innerHTML = `<img src="assets/images/m${getMapIndex(program, state)}.png" class="mapBg">`;
}

function getBadgeChecklistKey(weekIndex) {
  return `badgeChecklist_${weekIndex}`;
}

function getSavedBadgeChecklist(weekIndex, checklist) {
  const raw = localStorage.getItem(getBadgeChecklistKey(weekIndex));
  if (!raw) return new Array(checklist.length).fill(false);

  try {
    const parsed = JSON.parse(raw);
    return checklist.map((_, i) => !!parsed[i]);
  } catch {
    return new Array(checklist.length).fill(false);
  }
}

function saveBadgeChecklist(weekIndex, values) {
  localStorage.setItem(getBadgeChecklistKey(weekIndex), JSON.stringify(values));
}

function renderBadges(program, state) {
  const rows = [3, 2, 3, 2, 3];
  let week = 1;
  const completedWeeks = getCompletedWeeksCount(state);
  const finalBadge = completedWeeks >= 13 ? "rfinal.png" : "rfinalg.png";

  let html = `
    <div class="badgeOnlyBg"></div>
    <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; box-sizing:border-box;">
      <div style="display:flex; justify-content:center; margin-bottom:40px;">
<img src="assets/images/${finalBadge}" data-final-badge="1" style="width:120px; cursor:pointer;">      </div>
  `;

  rows.forEach(count => {
    html += `<div style="display:flex; justify-content:center; gap:18px;">`;

    for (let i = 0; i < count; i++) {
      const earned = week <= completedWeeks;
      const img = earned ? `r${week}.png` : `r${week}g.png`;
      html += `
        <img
          src="assets/images/${img}"
          data-week="${week}"
          style="width:60px;height:60px;cursor:pointer;"
        >
      `;
      week++;
    }

    html += `</div>`;
  });

  html += `</div>`;
  qs("badgeScreen").innerHTML = html;

  qs("badgeScreen").querySelectorAll("[data-week]").forEach(badge => {
    badge.onclick = () => {
  const weekIndex = Number(badge.dataset.week) - 1;
  const weekData = program[weekIndex];
  if (!weekData) return;

  const isEarned = weekIndex + 1 <= completedWeeks;

  if (!isEarned) {
  const popup = document.createElement("div");
  popup.className = "notePopup";
  popup.innerHTML = `
    <div class="notePopupCard">
      <img
        src="assets/images/r${weekIndex + 1}g.png"
        style="width:72px; display:block; margin:0 auto 12px;"
      >
      <div class="noteTitle">${weekData.weekBadgeTitle}</div>
      <div class="noteText" style="margin-bottom:12px;">
        Bu rozet hafta tamamlanınca açılır.
      </div>
      <button class="noteClose">Kapat</button>
    </div>
  `;
  document.body.appendChild(popup);
  popup.querySelector(".noteClose").onclick = () => popup.remove();
  return;
}

const savedChecks = getSavedBadgeChecklist(weekIndex, weekData.checklist);

const popup = document.createElement("div");
popup.className = "notePopup";
popup.innerHTML = `
  <div class="notePopupCard">
    <img
      src="assets/images/r${weekIndex + 1}.png"
      style="width:72px; display:block; margin:0 auto 12px;"
    >
    <div class="noteTitle">${weekData.weekBadgeTitle}</div>

    <div class="noteText" style="margin-bottom:6px; font-weight:700;">Çocuğa Mesaj</div>

    <div class="noteText" style="margin-bottom:12px;">
  ${weekData.weekBadgeDescription}
</div>

    <div class="noteText" style="margin:12px 0 8px; font-weight:700;">Ebeveyn İçin</div>

    <div class="noteText" style="text-align:left;">
      ${weekData.checklist.map((item, i) => `
        <label style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
          <input type="checkbox" data-check-index="${i}" ${savedChecks[i] ? "checked" : ""}>
          <span>${item}</span>
        </label>
      `).join("")}
    </div>

    <button class="noteClose">Kapat</button>
  </div>
`;

  document.body.appendChild(popup);

  const syncChecklist = () => {
    const values = [...popup.querySelectorAll("[data-check-index]")].map(input => input.checked);
    saveBadgeChecklist(weekIndex, values);
  };

  popup.querySelectorAll("[data-check-index]").forEach(input => {
    input.onchange = syncChecklist;
  });

  popup.querySelector(".noteClose").onclick = () => popup.remove();
};
  });

  const finalBadgeEl = qs("badgeScreen").querySelector("[data-final-badge]");

if (finalBadgeEl) {
  finalBadgeEl.onclick = () => {
    const isFinalEarned = completedWeeks >= 13;

    const popup = document.createElement("div");
    popup.className = "notePopup";

    if (!isFinalEarned) {
      popup.innerHTML = `
        <div class="notePopupCard">
          <img
            src="assets/images/rfinalg.png"
            style="width:96px; display:block; margin:0 auto 12px;"
          >
          <div class="noteTitle">Değer Kaşifi</div>
          <div class="noteText" style="margin-bottom:12px;">
  Bu rozet tüm haftalar tamamlanınca açılır.
</div>
          <button class="noteClose">Kapat</button>
        </div>
      `;
    } else {
      popup.innerHTML = `
        <div class="notePopupCard">
          <img
            src="assets/images/rfinal.png"
            style="width:96px; display:block; margin:0 auto 12px;"
          >
          <div class="noteTitle">Değer Kaşifi</div>

          <div class="noteText" style="margin-bottom:6px; font-weight:700;">Çocuğa Mesaj</div>
          <div class="noteText" style="margin-bottom:12px;">
            Tüm değerleri adım adım keşfettin. Artık sen bir Değer Kaşifisin.
          </div>

          <div class="noteText" style="margin:12px 0 8px; font-weight:700;">Ebeveyne Mesaj</div>
          <div class="noteText" style="margin-bottom:12px;">
            Tebrikler. Çocuğunuz bu yolculuğu tamamlayarak Değer Kaşifi rozeti kazandı.
          </div>

          <button class="noteClose">Kapat</button>
        </div>
      `;
    }

    document.body.appendChild(popup);
    popup.querySelector(".noteClose").onclick = () => popup.remove();
  };
}
}

function renderAbout() {
  qs("aboutScreen").innerHTML = `
    <div class="aboutWrap">
      <div class="aboutHero">
        <img src="assets/images/findik.png" class="aboutFindik" alt="Fındık">
        <div class="aboutBubble">
          Merhaba! Ben Fındık.<br>
          Bu yolculukta sana eşlik edeceğim.
        </div>
      </div>

      <div class="aboutHeader">
        <h2 class="aboutTitle">DEĞER KAŞİFLERİ</h2>
        <p class="aboutDesc">
          Değer Kaşifleri, Fındık’la birlikte çıkılan küçük bir keşif yolculuğudur. Bu yolculukta çocuklar; sevgi, saygı, sorumluluk ve daha birçok değeri, her gün okudukları hikayeler ve yaptıkları minicik uygulamalarla tanır, hisseder ve yaşamın içinde deneyimler.
        </p>
      </div>

      <div class="aboutCard">
        <h3>Nasıl Kullanılır?</h3>
        <ul>
          <li>Her gün önce kısa bir hikaye okunur.</li>
          <li>Sonra hikayeye eşlik eden uygulama birlikte yapılır.</li>
          <li>Günlük akış yaklaşık 5 dakika sürer.</li>
          <li>Hafta tamamlanınca rozet kazanılır.</li>
        </ul>
      </div>

      <div class="aboutCard">
        <h3>Yolculuk Yapısı</h3>
        <ul>
          <li>13 haftalık bir değer yolculuğu vardır.</li>
          <li>Her haftada 7 günlük bir akış bulunur.</li>
          <li>Her gün hikaye ve uygulama birlikte ilerler.</li>
          <li>Her hafta bir değer adım adım keşfedilir.</li>
        </ul>
      </div>

      <div class="aboutCard">
        <h3>Amaç</h3>
        <p>Çocukların değerleri hikayeler ve uygulamalar aracılığıyla tanımalarını, hissetmelerini ve günlük yaşamda deneyimlemelerini desteklemek.</p>
      </div>

      <div class="aboutCard aboutDev" style="text-align:center;">
        <h3>Geliştirici</h3>
        <p>Çağatay TOKGÖZ</p>
        <p>Psikolojik Danışman</p>
      </div>
    </div>
  `;
}

function bindTaskEvents(program, state, dispatch, rerender) {
const actionBtn = qs("actionBtn");
const noteBtn = qs("noteBtn");
const backBtn = qs("backBtn");
  const nextBtn = qs("nextBtn");
  const replayBtn = qs("replayBtn");
  const nextWeekBtn = qs("nextWeekBtn");
  const weekReplayBtn = qs("weekReplayBtn");
  const finalBadgeBtn = qs("finalBadgeBtn");
  const finalMapBtn = qs("finalMapBtn");
  const goalBtn = qs("goalBtn");

if (goalBtn) {
  goalBtn.onclick = () => {

    const weekData = getCurrentWeek(program, state);

    const popup = document.createElement("div");
    popup.className = "notePopup";
    popup.innerHTML = `
      <div class="notePopupCard">
        <div class="noteTitle">Haftanın Hedefi</div>
        <div class="noteText">${weekData.parentOutcome}</div>
        <button class="noteClose">Kapat</button>
      </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector(".noteClose").onclick = () => popup.remove();
  };
}

if (actionBtn) {
  actionBtn.onclick = () => {
    const phase = state.ui.phase;

    if (phase === "intro") dispatch({ type: "SET_PHASE", phase: "question" });
    else if (phase === "question") dispatch({ type: "SET_PHASE", phase: "task" });
    else if (phase === "task") dispatch({ type: "COMPLETE_DAY" });

    rerender();
  };
}

  if (noteBtn) {
    noteBtn.onclick = () => openParentNote(program, state);
  }

  if (backBtn) {
    backBtn.onclick = () => {
      dispatch({ type: "SET_PHASE", phase: "question" });
      rerender();
    };
  }

  if (replayBtn) {
  replayBtn.onclick = () => {
    dispatch({ type: "REPLAY_DAY" });
    rerender();
  };
}

if (nextBtn) {
  nextBtn.onclick = () => {
    console.log("NEXT_BTN_CLICK");
    dispatch({ type: "PROCEED" });
    rerender();
  };
}

  if (nextWeekBtn) {
    nextWeekBtn.onclick = () => {
      dispatch({ type: "ADVANCE_WEEK" });
      rerender();
    };
  }

  if (weekReplayBtn) {
    weekReplayBtn.onclick = () => {
      dispatch({ type: "SET_PHASE", phase: "weekComplete" });
      rerender();
    };
  }

  if (finalBadgeBtn) {
    finalBadgeBtn.onclick = () => {
      dispatch({ type: "SET_VIEW", view: "badges" });
      rerender();
    };
  }

  if (finalMapBtn) {
    finalMapBtn.onclick = () => {
      dispatch({ type: "SET_VIEW", view: "map" });
      rerender();
    };
  }

  qs("taskScreen").querySelectorAll(".emoji").forEach(emoji => {
    emoji.onclick = () => {
      dispatch({ type: "AFTER_EMOTION" });
      rerender();
    };
  });
}

function renderTask(program, state, dispatch, rerender) {
  const taskScreen = qs("taskScreen");
  const dayData = getCurrentDay(program, state);
const weekData = getCurrentWeek(program, state);
const phase = state.ui.phase;
const completedWeekIndex = Object.keys(state.progress.completions.weeks).length - 1;
const completedWeek = program[completedWeekIndex] || weekData;
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
    celebrationTimer = null;
  }

  if (phase === "intro") {
    taskScreen.innerHTML = `
  <div class="card">

    <!-- EKLENDİ -->
    <div class="cardTopActions">
      <div></div>
      <div class="noteButton">
        <img src="assets/images/hedef.png" id="goalBtn">
      </div>
    </div>

    <div class="bubbleText">
      ${dayData.day}. GÜN<br><br>
      <strong>${dayData.title}</strong>

      <div style="font-size:14px; opacity:.7; margin-top:6px;">
        Yaklaşık süre: ${weekData.estimatedDailyTime}
      </div>
    </div>

    <button class="primaryBtn" id="actionBtn">Başla</button>
  </div>
`;

  } else if (phase === "question") {
    taskScreen.innerHTML = `
      <div class="card">
        <div class="bubbleText">
          <strong>${dayData.questionTitle}</strong>
          ${dayData.question}
        </div>
<button class="primaryBtn" id="actionBtn">Uygulamaya Geç</button>    `;

} else if (phase === "task") {
  taskScreen.innerHTML = `
    <div class="card">
      <div class="cardTopActions">
        <div class="backButton">
          <img src="assets/images/geri.png" id="backBtn" alt="Geri">
        </div>
        <div class="noteButton">
          <img src="assets/images/not.png" id="noteBtn" alt="Ebeveyn Notu">
        </div>
      </div>

      <div class="bubbleText">
        <strong>${dayData.taskTitle}</strong>
      </div>

      <ol class="taskList">
        ${dayData.task.map(step => `<li>${step}</li>`).join("")}
      </ol>

      <button class="primaryBtn" id="actionBtn">Tamamlandı</button>
    </div>
  `;

    } else if (phase === "celebration") {
    taskScreen.innerHTML = `
      <div class="card">
        <div class="bubbleText">Tebrikler!</div>
      </div>
    `;
    tebrikRain();
    playCompleteSound();

    celebrationTimer = setTimeout(() => {
      dispatch({ type: "SET_PHASE", phase: "emotion" });
      rerender();
    }, 1200);
  } else if (phase === "emotion") {
    taskScreen.innerHTML = `
      <div class="card">
        <div class="bubbleText">Bunu yapınca nasıl hissettin?</div>
        <div class="emojis">
          <img src="assets/images/e1.png" class="emoji">
          <img src="assets/images/e2.png" class="emoji">
          <img src="assets/images/e3.png" class="emoji">
          <img src="assets/images/e4.png" class="emoji">
        </div>
      </div>
    `;
} else if (phase === "done") {
  taskScreen.innerHTML = `
<div class="card">
      <div class="bubbleText">
        ${dayData.day}. GÜN:<br>
        <strong>${dayData.title}</strong>
      </div>

  <div class="noteText" style="margin-top:10px; margin-bottom:16px;">
  Tamamlandı. İstersen devam edebilir ya da etkinliği tekrar açabilirsin.
</div>

<div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:6px;">
  <button
    class="primaryBtn"
    id="replayBtn"
    style="flex:1; min-width:0; padding:10px 8px; background:#F4C542; color:#fff;"
  >
    Tekrar
  </button>

  <button
    class="primaryBtn"
    id="nextBtn"
    style="flex:1; min-width:0; padding:10px 8px;"
  >
    Devam
  </button>
</div>
    </div>
  `;

  } else if (phase === "weekComplete") {
    taskScreen.innerHTML = `
      <div class="card">
        <div class="bubbleText">
          <img src="${getWeekBadgePath(state)}" class="weekBadge">
          <div class="bubbleText">
            <strong>${completedWeek.weekTitle} Tamamlandı!</strong>
          </div>
          ${completedWeek?.farewellText ? `<div class="bubbleText" style="margin-top:10px;">${completedWeek.farewellText}</div>` : ""}
          ${completedWeek?.nextFriendText ? `<div class="bubbleText" style="margin-top:8px;">${completedWeek.nextFriendText}</div>` : ""}
          <button class="primaryBtn" id="nextWeekBtn">Devam</button>
        </div>
      </div>
    `;
  } else if (phase === "finalComplete") {
    qs("findik").style.display = "none";
    document.querySelector(".dost").style.display = "none";
    qs("journeyBar").style.display = "none";
    playFinalSound();

    taskScreen.innerHTML = `
      <div class="card" style="padding-top:14px; padding-bottom:14px;">
        <div class="bubbleText" style="padding-top:0; padding-bottom:0;">
          <img src="assets/images/rfinal.png" class="weekBadge" style="width:54px; margin-bottom:4px; display:block; margin-left:auto; margin-right:auto;">
          <div class="bubbleText" style="margin-top:0; padding:0; line-height:1.3;">
            <strong>Değer Kaşifleri Yolculuğu Tamamlandı!</strong><br>
            Tebrikler, sen artık bir Değer Kaşifisin!
            Fındık'la birlikte tüm yolu tamamladın.
          </div>
          <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
            <button class="primaryBtn" id="finalBadgeBtn" style="width:auto; min-width:118px; padding:10px 12px;">Rozetlere Git</button>
            <button class="primaryBtn" id="finalMapBtn" style="width:auto; min-width:118px; padding:10px 12px;">Haritaya Git</button>
          </div>
        </div>
      </div>
    `;
    
  }
    bindTaskEvents(program, state, dispatch, rerender);
}

function renderEntry(program, state) {
  const started = hasSavedProgress(program, state.progress);
  const progressText = getEntryProgressText(program, state);

  qs("entryText").textContent = started ? progressText.top : "Hikayeler ve uygulamalarla değerleri birlikte keşfedin.";
  qs("entrySubtitle").textContent = started ? progressText.bottom : "";
  qs("entrySubtitle").hidden = !started || !progressText.bottom;
  qs("entryMainBtn").textContent = started ? "Devam Et" : "Yolculuğa Başla";
  qs("resetProgressBtn").hidden = !started;
}

export function renderApp(program, state, dispatch) {
  const rerender = () => renderApp(program, state, dispatch);

  const scene = getCurrentScene(program, state);
  qs("bg").src = scene.background;
  qs("dostImg").src = scene.friend;

  updateNav(state.ui.view);
  showOnlyScreen(state.ui.view);
  renderJourney(program, state);

  if (state.ui.view === "task") {
    setSceneVisible(true);
    renderTask(program, state, dispatch, rerender);
  } else {
    setSceneVisible(false);

    if (state.ui.view === "map") renderMap(program, state);
   if (state.ui.view === "badges") renderBadges(program, state);
    if (state.ui.view === "about") renderAbout();
  }

  renderEntry(program, state);
}
