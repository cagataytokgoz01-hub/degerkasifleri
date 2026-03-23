const STORAGE_KEY = "degerKasifleriState";
const STORAGE_VERSION = 1;

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function emptyProgress() {
  return {
    version: STORAGE_VERSION,
    current: { weekIndex: 0, dayIndex: 0 },
    completions: {
      days: {},
      weeks: {}
    }
  };
}

function migrateLegacyState(program) {
  const progress = emptyProgress();
  let hasLegacyData = false;

  const currentWeek = Number(localStorage.getItem("currentWeek") || 0);
  const currentDay = Number(localStorage.getItem("currentDay") || 0);
  const completedWeek = Number(localStorage.getItem("completedWeek") || 0);

  if (currentWeek > 0 || currentDay > 0 || completedWeek > 0) {
    hasLegacyData = true;
  }

  for (let w = 0; w < program.length; w++) {
    for (let d = 0; d < program[w].days.length; d++) {
      if (localStorage.getItem(`done_w${w}_d${d}`) === "1") {
        hasLegacyData = true;
        progress.completions.days[`${w}-${d}`] = localStorage.getItem(`doneDate_w${w}_d${d}`) || getTodayKey();
      }
    }

    const weekDoneDate = localStorage.getItem(`weekDoneDate_w${w}`);
    if (weekDoneDate) {
      hasLegacyData = true;
      progress.completions.weeks[String(w)] = weekDoneDate;
    }
  }

  if (!hasLegacyData) {
    return emptyProgress();
  }

  progress.current.weekIndex = Math.max(0, Math.min(currentWeek, program.length - 1));

  const currentWeekDays = program[progress.current.weekIndex]?.days?.length || 1;
  progress.current.dayIndex = Math.max(0, Math.min(currentDay, currentWeekDays - 1));

  if (completedWeek > 0) {
    for (let w = 0; w < Math.min(completedWeek, program.length); w++) {
      if (!progress.completions.weeks[String(w)]) {
        const lastDayIndex = (program[w]?.days?.length || 1) - 1;
        progress.completions.weeks[String(w)] =
          progress.completions.days[`${w}-${lastDayIndex}`] || getTodayKey();
      }
    }
  }

  return progress;
}

export function loadProgress(program) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw);

  if (
    parsed &&
    parsed.version === STORAGE_VERSION &&
    parsed.current &&
    parsed.completions &&
    typeof parsed.completions.days === "object" &&
    typeof parsed.completions.weeks === "object"
  ) {
    return parsed;
  }

  return migrateLegacyState(program);
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("currentWeek");
  localStorage.removeItem("currentDay");
  localStorage.removeItem("completedWeek");

  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith("done_w") ||
      key.startsWith("doneDate_w") ||
      key.startsWith("weekDoneDate_w")
    ) {
      localStorage.removeItem(key);
    }
  });
}