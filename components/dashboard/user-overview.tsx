import { format, subDays, parseISO } from "date-fns";
import { getWorkoutSessions } from "@/actions/workout-actions";
import { getDietEntries, getMacroTargets, getDietHistory } from "@/actions/diet-actions";
import { getCardioHistory } from "@/actions/cardio-actions";
import { getCurrentUser } from "@/actions/user-actions";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export async function UserOverview() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [sessionsResult, dietResult, targetsResult, historyResult, cardioHistoryResult, userResult] =
    await Promise.all([
      getWorkoutSessions(30),
      getDietEntries(today),
      getMacroTargets(),
      getDietHistory(7),
      getCardioHistory(7),
      getCurrentUser(),
    ]);

  const sessions = sessionsResult.success ? sessionsResult.data : [];
  const dietEntries = dietResult.success ? dietResult.data : [];
  const targets = targetsResult.success ? targetsResult.data : null;
  const dietHistory = historyResult.success ? historyResult.data : [];
  const cardioHistory = cardioHistoryResult.success ? cardioHistoryResult.data : [];
  const preferences = userResult.success ? userResult.data.preferences : undefined;

  // Build last-7-days date keys
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));

  // Training: sessions per day last 7 days
  const sessionsByDay = new Map<string, number>();
  for (const s of sessions) {
    const key = format(parseISO(s.date), "yyyy-MM-dd");
    if (last7.includes(key)) {
      sessionsByDay.set(key, (sessionsByDay.get(key) ?? 0) + 1);
    }
  }

  const trainingChartData = last7.map((d) => ({
    day: format(parseISO(d), "EEE"),
    sessions: sessionsByDay.get(d) ?? 0,
  }));

  // Macro chart data
  const macroChartData = dietHistory.map((d) => ({
    day: format(parseISO(d.date), "EEE"),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
    calories: Math.round(d.calories),
    target: targets?.calories ?? 0,
  }));

  // Cardio chart data
  const cardioChartData = cardioHistory.map((d) => ({
    day: format(parseISO(d.date), "EEE"),
    minutes: d.totalMinutes,
  }));

  // Stats
  const workoutsThisWeek = last7.reduce((sum, d) => sum + (sessionsByDay.get(d) ?? 0), 0);
  const todayKcal = dietEntries.reduce((s, e) => s + e.calories, 0);
  const todayProtein = dietEntries.reduce((s, e) => s + e.protein, 0);
  const cardioThisWeek = cardioHistory.reduce((s, d) => s + d.sessionCount, 0);

  // Streak: consecutive days with at least one workout session going back from today
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const key = format(subDays(new Date(), i), "yyyy-MM-dd");
    const hasSessions = sessions.some((s) => format(parseISO(s.date), "yyyy-MM-dd") === key);
    if (!hasSessions) break;
    streak++;
  }

  const recentSessions = sessions.slice(0, 3);
  const weekStart = format(subDays(new Date(), 6), "MMM d");
  const weekEnd = format(new Date(), "MMM d");

  return (
    <DashboardLayout
      data={{
        trainingChartData,
        macroChartData,
        cardioChartData,
        workoutsThisWeek,
        todayKcal,
        todayProtein,
        cardioThisWeek,
        streak,
        calorieTarget: targets?.calories ?? 0,
        proteinTarget: targets?.protein ?? 0,
        recentSessions,
        weekStart,
        weekEnd,
      }}
      initialWidgets={preferences?.dashboardWidgets}
    />
  );
}
