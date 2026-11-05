import { Task, Habit } from '../types';
import { getTodayDateString } from './quickCaptureParser';

export interface RolloverResult {
  updatedTasks: Task[];
  updatedHabits: Habit[];
  rolledOverCount: number;
  clearedDoneCount: number;
  rolloverDate: string;
}

export function performDailyRollover(
  tasks: Task[],
  habits: Habit[],
  todayStr: string = getTodayDateString(),
  archiveOldDone = false
): RolloverResult {
  let rolledOverCount = 0;
  let clearedDoneCount = 0;

  const updatedTasks: Task[] = [];

  for (const task of tasks) {
    // If completed and archiveOldDone is true and it was completed before today
    if (task.status === 'done') {
      if (archiveOldDone && task.completedAt && task.completedAt.split('T')[0] < todayStr) {
        clearedDoneCount++;
        continue; // drop or archive old clutter
      }
      updatedTasks.push(task);
      continue;
    }

    // Incomplete task: check if due date is in the past
    if (task.dueDate && task.dueDate < todayStr) {
      rolledOverCount++;
      updatedTasks.push({
        ...task,
        dueDate: todayStr,
        rolledOver: true,
      });
    } else {
      updatedTasks.push(task);
    }
  }

  // Update habits streaks:
  // If yesterday was completed, streak remains intact.
  // If yesterday was NOT completed and habit was not completed today, calculate current continuous streak.
  const updatedHabits = habits.map((habit) => {
    // Calculate streak based on completed dates
    const sortedDates = [...habit.completedDates].sort().reverse();
    let currentStreak = 0;
    
    // Check consecutive days starting from yesterday or today
    const checkDate = new Date();
    // If today is completed, start from today, else start checking from yesterday
    const todayCompleted = habit.completedDates.includes(todayStr);
    let iter = new Date(checkDate);
    if (!todayCompleted) {
      iter.setDate(iter.getDate() - 1);
    }

    while (true) {
      const iterStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
      if (habit.completedDates.includes(iterStr)) {
        currentStreak++;
        iter.setDate(iter.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      ...habit,
      streak: currentStreak,
    };
  });

  return {
    updatedTasks,
    updatedHabits,
    rolledOverCount,
    clearedDoneCount,
    rolloverDate: todayStr,
  };
}
