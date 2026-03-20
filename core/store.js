import { loadProgress, saveProgress, clearProgress } from "./storage.js";
import {
  normalizeProgress,
  completeCurrentDay,
  advancePosition,
  isAllComplete,
  isCurrentWeekLockedToday,
  hasAnyCompletionToday
} from "./progression.js";

export function createStore(program) {
  const state = {
    progress: normalizeProgress(program, loadProgress(program)),
    ui: {
      view: "task",
      phase: "intro"
    }
  };

  function persist() {
    saveProgress(state.progress);
  }

  function reset() {
    clearProgress();
    state.progress = normalizeProgress(program, {
      version: 1,
      current: { weekIndex: 0, dayIndex: 0 },
      completions: { days: {}, weeks: {} }
    });
    state.ui.view = "task";
    state.ui.phase = "intro";
  }

  function dispatch(action) {
    switch (action.type) {

      case "SET_VIEW":
        state.ui.view = action.view;
        return;

      case "SET_PHASE":
        state.ui.phase = action.phase;
        return;

      case "COMPLETE_DAY":
        completeCurrentDay(program, state.progress);
        state.ui.phase = "celebration";
        persist();
        return;

      case "AFTER_EMOTION":
        state.ui.phase = "done";
        return;

      case "START":
        if (isAllComplete(program, state.progress)) {
          state.ui.view = "task";
          state.ui.phase = "finalComplete";
          persist();
          return;
        }

        state.ui.view = "task";

        if (isCurrentWeekLockedToday(state.progress)) {
  state.ui.phase = "weekComplete";
} else if (hasAnyCompletionToday(state.progress) || action.forceLockedInfo) {
  state.ui.phase = "lockedInfo";
} else {
  state.ui.phase = "intro";
}

        persist();
        return;

case "PROCEED": {
  const result = advancePosition(program, state.progress);

  if (isAllComplete(program, state.progress) || result.type === "allComplete") {
    state.ui.phase = "finalComplete";
  } else if (isCurrentWeekLockedToday(state.progress)) {
    state.ui.phase = "weekComplete";
  } else {
    state.ui.phase = "intro";
  }

  persist();
  return;
}

      case "ADVANCE_WEEK": {

const w = state.progress.current.weekIndex;

if (w < program.length - 1) {
  state.progress.current = { weekIndex: w + 1, dayIndex: 0 };
}

        if (isAllComplete(program, state.progress)) {
          state.ui.phase = "finalComplete";
          persist();
          return;
        }

        const result = advancePosition(program, state.progress);

        if (isAllComplete(program, state.progress) || result.type === "allComplete") {
  state.ui.phase = "finalComplete";
} else if (isCurrentWeekLockedToday(state.progress)) {
  state.ui.phase = "weekComplete";
} else if (hasAnyCompletionToday(state.progress)) {
  state.ui.phase = "lockedInfo";
} else {
  state.ui.phase = "intro";
}

        persist();
        return;
      }

      case "RESET":
        reset();
        return;

      default:
        return;
    }
  }

  return { state, dispatch };
}