export function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayKey(weekIndex, dayIndex) {
  return `${weekIndex}-${dayIndex}`;
}

export function isDayComplete(progress, weekIndex, dayIndex) {
  return Boolean(progress.completions.days[getDayKey(weekIndex, dayIndex)]);
}

export function getDayDoneDate(progress, weekIndex, dayIndex) {
  return progress.completions.days[getDayKey(weekIndex, dayIndex)] || null;
}

export function isWeekComplete(progress, weekIndex) {
  return Boolean(progress.completions.weeks[String(weekIndex)]);
}

export function getWeekDoneDate(progress, weekIndex) {
  return progress.completions.weeks[String(weekIndex)] || null;
}

export function isSameDay(dateKey, todayKey = getTodayKey()) {
  return Boolean(dateKey) && dateKey === todayKey;
}

function clampCurrent(program, progress) {
  if (!program.length) {
    progress.current.weekIndex = 0;
    progress.current.dayIndex = 0;
    return;
  }

  progress.current.weekIndex = Math.max(0, Math.min(progress.current.weekIndex, program.length - 1));

  const weekDays = program[progress.current.weekIndex]?.days?.length || 1;
  progress.current.dayIndex = Math.max(0, Math.min(progress.current.dayIndex, weekDays - 1));
}

function ensureCompletedWeekMarkers(program, progress) {
  for (let w = 0; w < program.length; w++) {
    if (isWeekComplete(progress, w)) continue;

    const totalDays = program[w].days.length;
    let allDone = true;
    let lastDate = null;

    for (let d = 0; d < totalDays; d++) {
      const doneDate = getDayDoneDate(progress, w, d);
      if (!doneDate) {
        allDone = false;
        break;
      }
      lastDate = doneDate;
    }

    if (allDone && lastDate) {
      progress.completions.weeks[String(w)] = lastDate;
    }
  }
}

export function normalizeProgress(program, progress, todayKey = getTodayKey()) {
  clampCurrent(program, progress);
  ensureCompletedWeekMarkers(program, progress);

  if (!program.length) return progress;

  const { weekIndex, dayIndex } = progress.current || { weekIndex: 0, dayIndex: 0 };

  if (
    program[weekIndex] &&
    program[weekIndex].days &&
    program[weekIndex].days[dayIndex] &&
    !isDayComplete(progress, weekIndex, dayIndex)
  ) {
    return progress;
  }

  for (let w = 0; w < program.length; w++) {
    const days = program[w].days;

    for (let d = 0; d < days.length; d++) {
      if (!isDayComplete(progress, w, d)) {
        progress.current = { weekIndex: w, dayIndex: d };
        return progress;
      }
    }

    progress.completions.weeks[String(w)] =
      getDayDoneDate(progress, w, days.length - 1) || todayKey;
  }

  const lastWeekIndex = program.length - 1;
  const lastDayIndex = program[lastWeekIndex].days.length - 1;
  progress.current = { weekIndex: lastWeekIndex, dayIndex: lastDayIndex };
  return progress;
}

export function isAllComplete(program, progress) {
  return Object.keys(progress.completions.weeks).length >= program.length;
}

export function isCurrentDayLockedToday(progress, todayKey = getTodayKey()) {
  const { weekIndex, dayIndex } = progress.current;
  return isSameDay(getDayDoneDate(progress, weekIndex, dayIndex), todayKey);
}

export function isCurrentWeekLockedToday(progress, todayKey = getTodayKey()) {
  const { weekIndex } = progress.current;
  return isSameDay(getWeekDoneDate(progress, weekIndex), todayKey);
}

export function hasAnyCompletionToday(progress, todayKey = getTodayKey()) {
  return Object.values(progress.completions.days).some(date => date === todayKey);
}

export function completeCurrentDay(program, progress, todayKey = getTodayKey()) {
  const { weekIndex, dayIndex } = progress.current;
  progress.completions.days[getDayKey(weekIndex, dayIndex)] = todayKey;

  const totalDays = program[weekIndex].days.length;
  const isLastDay = dayIndex === totalDays - 1;

  if (isLastDay) {
    progress.completions.weeks[String(weekIndex)] = todayKey;
  }

  return progress;
}

export function advancePosition(program, progress, todayKey = getTodayKey()) {

  if (isAllComplete(program, progress)) {
    return { type: "allComplete" };
  }

  const { weekIndex, dayIndex } = progress.current;
  const currentWeekDays = program[weekIndex].days.length;

  if (dayIndex < currentWeekDays - 1) {
    progress.current = { weekIndex, dayIndex: dayIndex + 1 };
    return { type: "moved" };
  }

  if (weekIndex < program.length - 1) {
    progress.current = { weekIndex: weekIndex + 1, dayIndex: 0 };
    return { type: "moved" };
  }

  return { type: "allComplete" };
}