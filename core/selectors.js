import {
  getTodayKey,
  getDayDoneDate,
  getWeekDoneDate,
  isDayComplete,
  isWeekComplete,
  isSameDay,
  isAllComplete,
  isCurrentDayLockedToday,
  isCurrentWeekLockedToday
} from "./progression.js";

export function getCurrentWeek(program, state) {
  return program[state.progress.current.weekIndex];
}

export function getCurrentDay(program, state) {
  const week = getCurrentWeek(program, state);
  return week.days[state.progress.current.dayIndex];
}

export function getCurrentScene(program, state) {
  const completedWeeks = Object.keys(state.progress.completions.weeks).length;

  let weekIndex = state.progress.current.weekIndex;

  if (state.ui.phase === "weekComplete") {
    weekIndex = Math.min(completedWeeks, program.length - 1);
  }

  const weekNumber = weekIndex + 1;

  return {
    background: `assets/images/w${weekNumber}.png`,
    friend: `assets/images/dost${weekNumber}.png`
  };
}

export function getEntryProgressText(program, state) {
  if (isAllComplete(program, state.progress)) {
    return {
      top: "Tüm değer yolculukları tamamlandı.",
      bottom: "İstersen baştan başlayabilirsin."
    };
  }

  const week = getCurrentWeek(program, state);
  const day = getCurrentDay(program, state);

  if (isCurrentWeekLockedToday(state.progress)) {
    return {
      top: `${week.week}. haftayı tamamladın.`,
      bottom: "Yarın yeni hafta seni bekliyor."
    };
  }

  if (isCurrentDayLockedToday(state.progress)) {
    return {
      top: `${week.week}. haftadasın. Bugünkü etkinlik tamamlandı.`,
      bottom: "Yarın yeni bir etkinlik seni bekliyor."
    };
  }

  return {
    top: `${week.week}. haftadasın. Bugün ${day.day}. gün.`,
    bottom: `${day.title} seni bekliyor.`
  };
}

export function hasSavedProgress(program, progress) {
  if (progress.current.weekIndex > 0 || progress.current.dayIndex > 0) return true;
  if (Object.keys(progress.completions.days).length > 0) return true;
  if (Object.keys(progress.completions.weeks).length > 0) return true;
  return false;
}

export function getJourneyProgress(program, state) {
  const weekIndex = state.progress.current.weekIndex;
  const totalDays = program[weekIndex]?.days?.length || 0;
  const todayKey = getTodayKey();

  let progress = 0;
  for (let i = 0; i < totalDays; i++) {
    if (isDayComplete(state.progress, weekIndex, i)) {
      progress++;
    }
  }

  if (isWeekComplete(state.progress, weekIndex) || isSameDay(getWeekDoneDate(state.progress, weekIndex), todayKey)) {
    progress = totalDays;
  }

  return { progress, totalDays };
}

export function getMapIndex(program, state) {
  if (state.ui.phase === "finalComplete") return program.length + 1;

  const completedWeeks = Object.keys(state.progress.completions.weeks).length;
  return Math.min(completedWeeks, program.length - 1) + 1;
}

export function getCompletedWeeksCount(state) {
  return Object.keys(state.progress.completions.weeks).length;
}

export function getVisibleTaskPhase(program, state) {
  if (state.ui.phase === "weekComplete") return "weekComplete";
  if (state.ui.phase === "lockedInfo") return "lockedInfo";
  if (state.ui.phase === "finalComplete") return "finalComplete";
  return state.ui.phase;
}

export function getParentNote(program, state) {
  return getCurrentDay(program, state).parentNote || "Ebeveyn notu sonra eklenecektir.";
}

export function getWeekBadgePath(state) {
  return `assets/images/r${state.progress.current.weekIndex + 1}.png`;
}

export function getCurrentWeekDoneToday(state) {
  return isCurrentWeekLockedToday(state.progress);
}

export function getCurrentDayDoneToday(state) {
  return isCurrentDayLockedToday(state.progress);
}

export function getCurrentDoneDate(state) {
  const { weekIndex, dayIndex } = state.progress.current;
  return getDayDoneDate(state.progress, weekIndex, dayIndex);
}
