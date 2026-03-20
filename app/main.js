import { program } from "../data/program.js";
import { createStore } from "../core/store.js";
import { renderApp } from "../ui/render.js";
import { normalizeProgress, isAllComplete, isCurrentWeekLockedToday, hasAnyCompletionToday } from "../core/progression.js";

const { state, dispatch } = createStore(program);
window.__app = { program, state, dispatch };  //geçici

function rerender() {
  renderApp(program, state, dispatch);
}

function bindGlobalEvents() {
  document.querySelectorAll(".navBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      dispatch({ type: "SET_VIEW", view: btn.dataset.tab });
      rerender();
    });
  });

  document.getElementById("entryMainBtn").addEventListener("click", () => {
    normalizeProgress(program, state.progress);

  const forceLockedInfo =
  !isAllComplete(program, state.progress) &&
  !isCurrentWeekLockedToday(state.progress) &&
  hasAnyCompletionToday(state.progress);

    dispatch({ type: "START", forceLockedInfo });
    document.getElementById("entryScreen").hidden = true;
    document.getElementById("app").hidden = false;
    rerender();
  });

  document.getElementById("howToBtn").addEventListener("click", () => {
    document.getElementById("howToModal").hidden = false;
  });

  document.getElementById("closeHowToBtn").addEventListener("click", () => {
    document.getElementById("howToModal").hidden = true;
  });

  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    document.getElementById("resetModal").hidden = false;
  });

  document.getElementById("cancelResetBtn").addEventListener("click", () => {
    document.getElementById("resetModal").hidden = true;
  });

  document.getElementById("confirmResetBtn").addEventListener("click", () => {
    dispatch({ type: "RESET" });
    document.getElementById("resetModal").hidden = true;
    document.getElementById("app").hidden = true;
    document.getElementById("entryScreen").hidden = false;
    rerender();
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}

window.addEventListener("load", () => {
  bindGlobalEvents();
  rerender();

  const splash = document.getElementById("splash");
  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.transition = "0.5s";

    setTimeout(() => {
      splash.remove();
      document.getElementById("app").hidden = true;
      document.getElementById("entryScreen").hidden = false;
      rerender();
    }, 500);
  }, 2500);

  registerServiceWorker();
});
