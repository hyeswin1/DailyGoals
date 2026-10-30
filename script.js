/**
 * script.js - DailyGoals Web Application
 * Handles state, localStorage persistence, stepped onboarding,
 * dynamic goals categorization, day-wise gym planner, and health vitals updates.
 */

// ==========================================
// CONSTANTS & LOCAL STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  PROFILE: 'dailygoals_user_profile',
  GOALS: 'dailygoals_goals_list',
  GYM_PLAN: 'dailygoals_gym_plan',
  HEALTH_LOGS: 'dailygoals_health_logs',
  THEME: 'dailygoals_theme_preference',
  LAST_ACTIVE_DATE: 'dailygoals_last_active_date'
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default Workout Split (PPL + Upper/Lower hybrid) if empty
const DEFAULT_GYM_SPLIT = {
  Monday: {
    muscleGroups: ['Chest', 'Triceps'],
    exercises: [
      { id: 'ex-1', name: 'Barbell Flat Bench Press', sets: '4', reps: '8-10', weight: '70kg', completed: false },
      { id: 'ex-2', name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', weight: '24kg', completed: false },
      { id: 'ex-3', name: 'Tricep Rope Pushdowns', sets: '3', reps: '12-15', weight: '25kg', completed: false },
      { id: 'ex-4', name: 'Overhead Cable Extension', sets: '3', reps: '12', weight: '20kg', completed: false }
    ]
  },
  Tuesday: {
    muscleGroups: ['Back', 'Biceps'],
    exercises: [
      { id: 'ex-5', name: 'Lat Pulldowns / Pull-ups', sets: '4', reps: '10', weight: '65kg', completed: false },
      { id: 'ex-6', name: 'Barbell Bent-Over Row', sets: '4', reps: '8-10', weight: '60kg', completed: false },
      { id: 'ex-7', name: 'Incline Dumbbell Bicep Curls', sets: '3', reps: '12', weight: '14kg', completed: false },
      { id: 'ex-8', name: 'Hammer Curls', sets: '3', reps: '12-15', weight: '16kg', completed: false }
    ]
  },
  Wednesday: {
    muscleGroups: ['Legs / Quads', 'Core / Abs'],
    exercises: [
      { id: 'ex-9', name: 'Barbell Back Squats', sets: '4', reps: '8', weight: '90kg', completed: false },
      { id: 'ex-10', name: 'Romanian Deadlifts (RDL)', sets: '3', reps: '10', weight: '80kg', completed: false },
      { id: 'ex-11', name: 'Leg Extensions', sets: '3', reps: '15', weight: '45kg', completed: false },
      { id: 'ex-12', name: 'Hanging Leg Raises', sets: '3', reps: '15', weight: 'Bodyweight', completed: false }
    ]
  },
  Thursday: {
    muscleGroups: ['Shoulders', 'Triceps'],
    exercises: [
      { id: 'ex-13', name: 'Seated Dumbbell Shoulder Press', sets: '4', reps: '8-10', weight: '22kg', completed: false },
      { id: 'ex-14', name: 'Dumbbell Lateral Raises', sets: '4', reps: '15', weight: '10kg', completed: false },
      { id: 'ex-15', name: 'Face Pulls (Rear Delts)', sets: '3', reps: '15', weight: '30kg', completed: false },
      { id: 'ex-16', name: 'Dips / Skull Crushers', sets: '3', reps: '12', weight: 'Bodyweight', completed: false }
    ]
  },
  Friday: {
    muscleGroups: ['Back', 'Chest'],
    exercises: [
      { id: 'ex-17', name: 'Incline Barbell Bench Press', sets: '4', reps: '8', weight: '65kg', completed: false },
      { id: 'ex-18', name: 'Chest-Supported T-Bar Row', sets: '4', reps: '10', weight: '50kg', completed: false },
      { id: 'ex-19', name: 'Cable Pec Flys', sets: '3', reps: '15', weight: '15kg', completed: false }
    ]
  },
  Saturday: {
    muscleGroups: ['Legs / Quads', 'Core / Abs'],
    exercises: [
      { id: 'ex-20', name: 'Leg Press', sets: '4', reps: '12', weight: '160kg', completed: false },
      { id: 'ex-21', name: 'Walking Dumbbell Lunges', sets: '3', reps: '12/leg', weight: '18kg', completed: false },
      { id: 'ex-22', name: 'Plank Holds & Cable Crunches', sets: '3', reps: '60s / 15', weight: 'Bodyweight', completed: false }
    ]
  },
  Sunday: {
    muscleGroups: ['Rest Day'],
    exercises: []
  }
};

// ==========================================
// APPLICATION STATE
// ==========================================
let AppState = {
  profile: null,
  goals: [],
  gymPlan: {},
  healthLogs: [],
  currentGoalFilter: 'all', // 'all' | 'exercise' | 'productivity' | 'nutrition'
  selectedGymDay: 'Monday',
  todayName: 'Monday',
  currentDateString: ''
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadDataFromStorage(); // Must load before initDateInfo so the new-day reset has data to act on
  initDateInfo();

  if (!AppState.profile || !AppState.profile.name) {
    // Show onboarding flow
    showOnboarding();
  } else {
    // Show main dashboard
    showDashboard();
  }

  // Refresh lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Schedule automatic midnight reset of all goals & gym checks
  scheduleMidnightReset();
});

// ==========================================
// MIDNIGHT AUTO-RESET SCHEDULER
// ==========================================
/**
 * Schedules a daily reset at midnight (00:00:00) so completed goals and gym
 * exercise checks are automatically cleared at the start of every new day,
 * even if the page stays open overnight.
 */
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, 0, 0, 0         // 00:00:00.000
  );
  const msUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    // Perform the reset as a new day begins
    loadDataFromStorage();          // Ensure AppState is in sync with storage
    resetDailyGoalChecksForNewDay();

    // Update displayed date info and re-render dashboard if it is visible
    initDateInfo();
    if (AppState.profile && AppState.profile.name) {
      showDashboard();
    }

    showToast('🌅 New day started — goals reset to incomplete!', 'info');

    // Set up recurring reset every 24 hours for as long as the tab stays open
    setInterval(() => {
      loadDataFromStorage();
      resetDailyGoalChecksForNewDay();
      initDateInfo();
      if (AppState.profile && AppState.profile.name) {
        showDashboard();
      }
      showToast('🌅 New day started — goals reset to incomplete!', 'info');
    }, 24 * 60 * 60 * 1000);

  }, msUntilMidnight);
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  if (window.lucide) lucide.createIcons();
}

function initDateInfo() {
  const now = new Date();
  const dayIndex = now.getDay();
  AppState.todayName = DAYS_OF_WEEK[dayIndex];
  AppState.selectedGymDay = AppState.todayName;

  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  AppState.currentDateString = now.toLocaleDateString('en-US', options);

  // Check if date changed to reset daily goal checks if desired
  // Use local date (YYYY-MM-DD) so midnight in the user's timezone triggers correctly
  const todayDateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
  const lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE);
  
  if (lastActiveDate && lastActiveDate !== todayDateKey) {
    // Rolled over to a new day - reset goal checked states for the fresh day
    resetDailyGoalChecksForNewDay();
  }
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, todayDateKey);
}

// ==========================================
// LOCAL STORAGE MANAGEMENT
// ==========================================
function loadDataFromStorage() {
  try {
    const rawProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (rawProfile) AppState.profile = JSON.parse(rawProfile);

    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (rawGoals) {
      AppState.goals = JSON.parse(rawGoals);
    } else {
      AppState.goals = [];
    }

    const rawGym = localStorage.getItem(STORAGE_KEYS.GYM_PLAN);
    if (rawGym) {
      AppState.gymPlan = JSON.parse(rawGym);
    } else {
      AppState.gymPlan = JSON.parse(JSON.stringify(DEFAULT_GYM_SPLIT));
      localStorage.setItem(STORAGE_KEYS.GYM_PLAN, JSON.stringify(AppState.gymPlan));
    }

    const rawHealthLogs = localStorage.getItem(STORAGE_KEYS.HEALTH_LOGS);
    if (rawHealthLogs) {
      AppState.healthLogs = JSON.parse(rawHealthLogs);
    } else {
      AppState.healthLogs = [];
    }
  } catch (e) {
    console.error('Error loading data from localStorage', e);
  }
}

function saveProfileToStorage() {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(AppState.profile));
}

function saveGoalsToStorage() {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(AppState.goals));
}

function saveGymPlanToStorage() {
  localStorage.setItem(STORAGE_KEYS.GYM_PLAN, JSON.stringify(AppState.gymPlan));
}

function saveHealthLogsToStorage() {
  localStorage.setItem(STORAGE_KEYS.HEALTH_LOGS, JSON.stringify(AppState.healthLogs));
}

// ==========================================
// ONBOARDING FLOW LOGIC
// ==========================================
function showOnboarding() {
  document.getElementById('onboarding-flow').classList.remove('hidden');
  document.getElementById('main-dashboard').classList.add('hidden');
  goToOnboardingStep(1);
}

function goToOnboardingStep(stepNumber) {
  // Hide all steps
  document.getElementById('onboard-step-1').classList.add('hidden');
  document.getElementById('onboard-step-2').classList.add('hidden');
  document.getElementById('onboard-step-3').classList.add('hidden');

  // Update dots
  const dots = ['step-dot-1', 'step-dot-2', 'step-dot-3'];
  dots.forEach((dotId, idx) => {
    const el = document.getElementById(dotId);
    if (idx + 1 === stepNumber) {
      el.className = 'w-8 h-2 rounded-full bg-brand-500 transition-all duration-300';
    } else if (idx + 1 < stepNumber) {
      el.className = 'w-4 h-2 rounded-full bg-emerald-500 transition-all duration-300';
    } else {
      el.className = 'w-2 h-2 rounded-full bg-slate-700 transition-all duration-300';
    }
  });

  // Show target step
  const activeStep = document.getElementById(`onboard-step-${stepNumber}`);
  if (activeStep) {
    activeStep.classList.remove('hidden');
  }

  // Pre-fill fields if we have partial profile
  if (stepNumber === 2 && AppState.profile) {
    if (AppState.profile.weight) document.getElementById('input-weight').value = AppState.profile.weight;
    if (AppState.profile.height) document.getElementById('input-height').value = AppState.profile.height;
    if (AppState.profile.allergies) document.getElementById('input-allergies').value = AppState.profile.allergies;
  }

  if (window.lucide) lucide.createIcons();
}

function finishOnboarding() {
  const name = document.getElementById('input-name').value.trim();
  const weight = parseFloat(document.getElementById('input-weight').value) || 70;
  const height = parseFloat(document.getElementById('input-height').value) || 175;
  const allergies = document.getElementById('input-allergies').value.trim() || 'None';
  const fitnessGoal = document.getElementById('input-fitness-goal').value;

  if (!name) {
    showToast('Please provide your name', 'error');
    goToOnboardingStep(1);
    return;
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const bmi = calculateBMI(weight, height);

  // Set Profile
  AppState.profile = {
    name,
    weight,
    height,
    allergies,
    fitnessGoal,
    lastUpdated: todayIso
  };
  saveProfileToStorage();

  // Save initial Health Log entry
  AppState.healthLogs = [{
    date: todayIso,
    weight,
    height,
    bmi,
    allergies,
    note: 'Initial Onboarding Measurement'
  }];
  saveHealthLogsToStorage();

  // Collect checked starter goals from Step 3
  const checkedBoxes = document.querySelectorAll('#onboard-step-3 input[type="checkbox"]:checked');
  const initialGoals = [];
  checkedBoxes.forEach((cb, index) => {
    initialGoals.push({
      id: 'goal-' + Date.now() + '-' + index,
      title: cb.value,
      category: cb.dataset.category,
      notes: 'Daily priority',
      completed: false
    });
  });

  AppState.goals = initialGoals;
  saveGoalsToStorage();

  showToast(`Welcome aboard, ${name}! Your dashboard is ready.`, 'success');
  showDashboard();
}

function restartOnboarding() {
  closeModal('modal-profile-details');
  if (AppState.profile) {
    document.getElementById('input-name').value = AppState.profile.name || '';
    document.getElementById('input-weight').value = AppState.profile.weight || '';
    document.getElementById('input-height').value = AppState.profile.height || '';
    document.getElementById('input-allergies').value = AppState.profile.allergies || '';
  }
  showOnboarding();
}

// ==========================================
// DASHBOARD RENDERING & MANAGEMENT
// ==========================================
function showDashboard() {
  document.getElementById('onboarding-flow').classList.add('hidden');
  document.getElementById('main-dashboard').classList.remove('hidden');

  renderHeaderAndHero();
  renderGoals();
  renderGymDayTabs();
  renderSelectedGymDayWorkout();

  if (window.lucide) lucide.createIcons();
}

function renderHeaderAndHero() {
  const profile = AppState.profile || { name: 'Champion', weight: 70, height: 175, allergies: 'None' };
  
  // Header greeting
  document.getElementById('header-user-name').textContent = profile.name.split(' ')[0] || profile.name;
  
  // Avatar initials
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';
  document.getElementById('user-avatar-initials').textContent = initials;
  document.getElementById('profile-modal-avatar').textContent = initials;

  // Date and badges
  document.getElementById('current-day-badge').textContent = `Today: ${AppState.todayName}`;
  document.getElementById('hero-date-string').textContent = AppState.currentDateString;

  // Health Quick Stats Widget
  document.getElementById('quick-weight-val').textContent = profile.weight || '--';
  document.getElementById('quick-height-val').textContent = profile.height || '--';
  
  const bmiVal = calculateBMI(profile.weight, profile.height);
  document.getElementById('quick-bmi-val').textContent = `${bmiVal} (${getBMICategory(bmiVal)})`;
  document.getElementById('quick-allergies-val').textContent = profile.allergies || 'None';
  
  if (profile.lastUpdated) {
    document.getElementById('health-last-updated').textContent = `Logged: ${profile.lastUpdated}`;
  }

  // Update Progress %
  updateGoalsProgressStats();
}

function updateGoalsProgressStats() {
  const total = AppState.goals.length;
  const completed = AppState.goals.filter(g => g.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Progress Bar & Percentage
  const bar = document.getElementById('hero-progress-bar-fill');
  const pctEl = document.getElementById('hero-completion-pct');
  const countEl = document.getElementById('hero-completed-count');
  const tagEl = document.getElementById('hero-completion-tag');

  if (bar) bar.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (countEl) countEl.textContent = `${completed} of ${total} tasks finished`;

  if (tagEl) {
    if (pct === 100 && total > 0) {
      tagEl.textContent = 'All Completed! 🔥';
      tagEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40';
    } else if (pct > 50) {
      tagEl.textContent = 'Over Halfway Done ⚡';
      tagEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30';
    } else {
      tagEl.textContent = 'In Progress ⏳';
      tagEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-700/60 text-slate-300 border border-slate-600';
    }
  }

  // Mini breakdown for 3 categories
  const categories = ['exercise', 'productivity', 'nutrition'];
  categories.forEach(cat => {
    const catGoals = AppState.goals.filter(g => g.category === cat);
    const catDone = catGoals.filter(g => g.completed).length;
    const catEl = document.getElementById(`stat-cat-${cat}`);
    if (catEl) {
      catEl.textContent = `${catDone}/${catGoals.length}`;
    }
  });

  const activePill = document.getElementById('active-goals-pill');
  if (activePill) {
    activePill.textContent = `${completed}/${total} Done`;
  }
}

// ==========================================
// GOALS ENGINE & 3 CATEGORIES
// ==========================================
function filterGoals(category) {
  AppState.currentGoalFilter = category;

  // Update filter pill UI
  const buttons = document.querySelectorAll('.filter-pill-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById(`filter-${category}-btn`);
  if (activeBtn) activeBtn.classList.add('active');

  renderGoals();
}

function renderGoals() {
  const container = document.getElementById('goals-container');
  const emptyState = document.getElementById('goals-empty-state');
  if (!container) return;

  container.innerHTML = '';

  const filter = AppState.currentGoalFilter;
  const filteredGoals = filter === 'all' 
    ? AppState.goals 
    : AppState.goals.filter(g => g.category === filter);

  if (filteredGoals.length === 0) {
    emptyState.classList.remove('hidden');
    container.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    container.classList.remove('hidden');

    filteredGoals.forEach(goal => {
      const card = createGoalCardElement(goal);
      container.appendChild(card);
    });
  }

  updateGoalsProgressStats();
  if (window.lucide) lucide.createIcons();
}

function createGoalCardElement(goal) {
  const card = document.createElement('div');
  const isDone = goal.completed;

  // Category styling
  const catStyles = {
    exercise: {
      badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      icon: 'dumbbell',
      label: 'Exercise'
    },
    productivity: {
      badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      icon: 'zap',
      label: 'Productivity'
    },
    nutrition: {
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      icon: 'salad',
      label: 'Nutrition'
    }
  };

  const style = catStyles[goal.category] || catStyles.productivity;

  card.className = `p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border ${
    isDone 
      ? 'border-emerald-300/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10' 
      : 'border-slate-200/80 dark:border-slate-800'
  } shadow-card transition-all duration-200 hover:shadow-md flex flex-col justify-between group ${
    isDone ? 'goal-completed' : ''
  }`;

  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeClass}">
          <i data-lucide="${style.icon}" class="w-3 h-3"></i>
          <span>${style.label}</span>
        </span>
        <button 
          type="button" 
          onclick="deleteGoal('${goal.id}')" 
          class="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
          title="Delete Goal"
        >
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <div class="flex items-start gap-3">
        <button 
          type="button" 
          onclick="toggleGoalComplete('${goal.id}')" 
          class="mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition checkbox-pulse flex-shrink-0 ${
            isDone 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
          }"
        >
          ${isDone ? '<i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>' : ''}
        </button>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm text-slate-900 dark:text-white leading-snug goal-title break-words">
            ${escapeHtml(goal.title)}
          </h4>
          ${goal.notes ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${escapeHtml(goal.notes)}</p>` : ''}
        </div>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
      <span class="flex items-center gap-1">
        <i data-lucide="clock" class="w-3 h-3"></i> Daily Goal
      </span>
      <span class="font-medium ${isDone ? 'text-emerald-500 font-semibold' : 'text-slate-400'}">
        ${isDone ? 'Done today ✓' : 'Pending'}
      </span>
    </div>
  `;

  return card;
}

function toggleGoalComplete(goalId) {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (!goal) return;

  goal.completed = !goal.completed;
  saveGoalsToStorage();
  renderGoals();

  if (goal.completed) {
    showToast(`Completed: ${goal.title}`, 'success');

    // Check if all goals are now completed for celebratory confetti!
    const total = AppState.goals.length;
    const completed = AppState.goals.filter(g => g.completed).length;
    if (total > 0 && completed === total) {
      triggerConfetti();
      showToast('🎉 Outstanding! You completed 100% of your daily goals!', 'success');
    }
  }
}

function deleteGoal(goalId) {
  AppState.goals = AppState.goals.filter(g => g.id !== goalId);
  saveGoalsToStorage();
  renderGoals();
  showToast('Goal removed', 'info');
}

function openAddGoalModal() {
  document.getElementById('form-new-goal').reset();
  openModal('modal-add-goal');
}

function handleCreateGoal(e) {
  e.preventDefault();
  const category = document.querySelector('input[name="goalCategory"]:checked').value;
  const title = document.getElementById('new-goal-title').value.trim();
  const notes = document.getElementById('new-goal-notes').value.trim();

  if (!title) return;

  const newGoal = {
    id: 'goal-' + Date.now(),
    title,
    category,
    notes,
    completed: false
  };

  AppState.goals.push(newGoal);
  saveGoalsToStorage();
  closeModal('modal-add-goal');
  renderGoals();
  showToast('New daily goal added!', 'success');
}

function resetDailyProgress() {
  if (confirm("Reset today's goal completion status so you can start fresh?")) {
    AppState.goals.forEach(g => g.completed = false);
    
    // Also reset today's gym exercises checkbox status
    const todayPlan = AppState.gymPlan[AppState.todayName];
    if (todayPlan && todayPlan.exercises) {
      todayPlan.exercises.forEach(ex => ex.completed = false);
      saveGymPlanToStorage();
      renderSelectedGymDayWorkout();
    }

    saveGoalsToStorage();
    renderGoals();
    showToast("Today's checks have been reset", 'info');
  }
}

function resetDailyGoalChecksForNewDay() {
  if (AppState.goals && AppState.goals.length > 0) {
    AppState.goals.forEach(g => g.completed = false);
    saveGoalsToStorage();
  }
  // Reset workout completion for every day
  if (AppState.gymPlan) {
    Object.keys(AppState.gymPlan).forEach(day => {
      if (AppState.gymPlan[day].exercises) {
        AppState.gymPlan[day].exercises.forEach(ex => ex.completed = false);
      }
    });
    saveGymPlanToStorage();
  }
}

// ==========================================
// DAY-WISE GYM PLANNER (Req 3 & 4)
// ==========================================
function renderGymDayTabs() {
  const container = document.getElementById('gym-day-tabs');
  if (!container) return;

  container.innerHTML = '';
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  weekDays.forEach(day => {
    const isToday = day === AppState.todayName;
    const isSelected = day === AppState.selectedGymDay;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `gym-day-tab flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
      isSelected 
        ? 'active bg-brand-600 text-white shadow-md' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
    }`;

    btn.onclick = () => selectGymDay(day);

    btn.innerHTML = `
      <span>${day.substring(0, 3)}</span>
      ${isToday ? `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-500'}"></span>` : ''}
    `;

    container.appendChild(btn);
  });
}

function selectGymDay(day) {
  AppState.selectedGymDay = day;
  renderGymDayTabs();
  renderSelectedGymDayWorkout();
}

function renderSelectedGymDayWorkout() {
  const selectedDay = AppState.selectedGymDay;
  const isToday = selectedDay === AppState.todayName;
  const dayPlan = AppState.gymPlan[selectedDay] || { muscleGroups: ['Rest Day'], exercises: [] };

  // Update Title & Badge
  document.getElementById('gym-selected-day-name').textContent = `${selectedDay}'s Workout`;
  const todayBadge = document.getElementById('gym-is-today-badge');
  if (todayBadge) {
    todayBadge.style.display = isToday ? 'inline-block' : 'none';
  }

  // Muscle groups badges
  const muscleContainer = document.getElementById('gym-muscle-badges');
  muscleContainer.innerHTML = '';

  const muscles = dayPlan.muscleGroups && dayPlan.muscleGroups.length > 0 
    ? dayPlan.muscleGroups 
    : ['Rest Day'];

  muscles.forEach(m => {
    const badge = document.createElement('span');
    const isRest = m.toLowerCase().includes('rest');
    badge.className = `px-2.5 py-1 rounded-lg text-xs font-bold ${
      isRest 
        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' 
        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
    }`;
    badge.textContent = m;
    muscleContainer.appendChild(badge);
  });

  // Exercises list
  const exercisesContainer = document.getElementById('gym-exercises-list');
  const emptyState = document.getElementById('gym-empty-state');
  const countBadge = document.getElementById('gym-exercise-count');

  const exercises = dayPlan.exercises || [];
  countBadge.textContent = `${exercises.length} Exercises`;

  if (exercises.length === 0 || muscles.includes('Rest Day')) {
    exercisesContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');

    if (muscles.includes('Rest Day')) {
      document.getElementById('gym-empty-title').textContent = 'Scheduled Rest & Recovery Day';
      document.getElementById('gym-empty-desc').textContent = 'Rest allows muscles to repair and grow stronger. Stay hydrated and prioritize nutrition!';
    } else {
      document.getElementById('gym-empty-title').textContent = 'No Exercises Configured Yet';
      document.getElementById('gym-empty-desc').textContent = `Click below to add exercises and targeted muscle groups for ${selectedDay}.`;
    }
  } else {
    emptyState.classList.add('hidden');
    exercisesContainer.classList.remove('hidden');
    exercisesContainer.innerHTML = '';

    exercises.forEach((ex, idx) => {
      const item = document.createElement('div');
      item.className = `p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        ex.completed 
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-80' 
          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
      }`;

      item.innerHTML = `
        <div class="flex items-center gap-3">
          <button 
            type="button" 
            onclick="toggleExerciseCompleted('${selectedDay}', '${ex.id}')"
            class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition checkbox-pulse flex-shrink-0 ${
              ex.completed 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
            }"
            title="Tick off exercise"
          >
            ${ex.completed ? '<i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>' : ''}
          </button>

          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#${idx + 1}</span>
              <h5 class="font-bold text-sm text-slate-900 dark:text-white ${ex.completed ? 'line-through text-slate-400' : ''}">
                ${escapeHtml(ex.name)}
              </h5>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Sets: <strong class="text-slate-700 dark:text-slate-300">${escapeHtml(ex.sets)}</strong></span>
              <span>•</span>
              <span>Reps: <strong class="text-slate-700 dark:text-slate-300">${escapeHtml(ex.reps)}</strong></span>
              ${ex.weight ? `<span>•</span><span>Load: <strong class="text-brand-600 dark:text-brand-400">${escapeHtml(ex.weight)}</strong></span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 text-xs">
          <span class="px-2 py-0.5 rounded-full font-semibold ${
            ex.completed 
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
              : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
          }">
            ${ex.completed ? 'Completed ✓' : 'Ready'}
          </span>
        </div>
      `;

      exercisesContainer.appendChild(item);
    });
  }

  if (window.lucide) lucide.createIcons();
}

function toggleExerciseCompleted(day, exerciseId) {
  const dayPlan = AppState.gymPlan[day];
  if (!dayPlan || !dayPlan.exercises) return;

  const exercise = dayPlan.exercises.find(e => e.id === exerciseId);
  if (!exercise) return;

  exercise.completed = !exercise.completed;
  saveGymPlanToStorage();
  renderSelectedGymDayWorkout();

  if (exercise.completed) {
    showToast(`Checked off: ${exercise.name}`, 'success');
  }
}

// GYM PLANNER FORM MODAL
function openGymPlannerFormModal() {
  const targetDay = AppState.selectedGymDay;
  document.getElementById('gym-form-day-select').value = targetDay;
  loadGymPlannerFormForDay(targetDay);
  openModal('modal-gym-planner');
}

function loadGymPlannerFormForDay(day) {
  const dayPlan = AppState.gymPlan[day] || { muscleGroups: [], exercises: [] };

  // Set muscle checkboxes
  const checkboxes = document.querySelectorAll('.muscle-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = dayPlan.muscleGroups && dayPlan.muscleGroups.includes(cb.value);
  });

  // Render Exercise Rows
  const rowsContainer = document.getElementById('exercise-rows-container');
  rowsContainer.innerHTML = '';

  if (dayPlan.exercises && dayPlan.exercises.length > 0) {
    dayPlan.exercises.forEach(ex => {
      addExerciseInputRow(ex.name, ex.sets, ex.reps, ex.weight);
    });
  } else {
    // Add 2 blank rows for convenience
    addExerciseInputRow();
    addExerciseInputRow();
  }

  if (window.lucide) lucide.createIcons();
}

function addExerciseInputRow(name = '', sets = '3', reps = '10-12', weight = '') {
  const container = document.getElementById('exercise-rows-container');
  const row = document.createElement('div');
  row.className = 'exercise-form-row grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 items-center';

  row.innerHTML = `
    <div class="col-span-12 sm:col-span-5">
      <input 
        type="text" 
        placeholder="Exercise Name (e.g. Incline Bench)" 
        value="${escapeHtml(name)}" 
        class="input-ex-name w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
        required
      >
    </div>
    <div class="col-span-4 sm:col-span-2">
      <input 
        type="text" 
        placeholder="Sets (3)" 
        value="${escapeHtml(sets)}" 
        class="input-ex-sets w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
      >
    </div>
    <div class="col-span-4 sm:col-span-2">
      <input 
        type="text" 
        placeholder="Reps (10-12)" 
        value="${escapeHtml(reps)}" 
        class="input-ex-reps w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
      >
    </div>
    <div class="col-span-3 sm:col-span-2">
      <input 
        type="text" 
        placeholder="Weight (kg)" 
        value="${escapeHtml(weight)}" 
        class="input-ex-weight w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
      >
    </div>
    <div class="col-span-1 flex justify-center">
      <button 
        type="button" 
        onclick="this.closest('.exercise-form-row').remove()" 
        class="p-1 text-slate-400 hover:text-rose-500 transition"
        title="Remove Row"
      >
        <i data-lucide="trash" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `;

  container.appendChild(row);
  if (window.lucide) lucide.createIcons();
}

function toggleRestDayOption(restCheckbox) {
  if (restCheckbox.checked) {
    // Uncheck other muscle groups
    document.querySelectorAll('.muscle-checkbox').forEach(cb => {
      if (cb !== restCheckbox) cb.checked = false;
    });
    // Clear rows
    document.getElementById('exercise-rows-container').innerHTML = '';
  }
}

function setDayAsRestDay() {
  document.querySelectorAll('.muscle-checkbox').forEach(cb => {
    cb.checked = cb.value === 'Rest Day';
  });
  document.getElementById('exercise-rows-container').innerHTML = '';
  showToast('Marked as Rest Day', 'info');
}

function handleSaveGymDayRoutine(e) {
  e.preventDefault();
  const targetDay = document.getElementById('gym-form-day-select').value;
  
  // Selected muscle groups
  const checkedMuscles = Array.from(document.querySelectorAll('.muscle-checkbox:checked')).map(cb => cb.value);
  const muscleGroups = checkedMuscles.length > 0 ? checkedMuscles : ['Rest Day'];

  // Exercises
  const rows = document.querySelectorAll('.exercise-form-row');
  const exercises = [];

  rows.forEach((row, idx) => {
    const name = row.querySelector('.input-ex-name').value.trim();
    const sets = row.querySelector('.input-ex-sets').value.trim() || '3';
    const reps = row.querySelector('.input-ex-reps').value.trim() || '10';
    const weight = row.querySelector('.input-ex-weight').value.trim() || '';

    if (name) {
      exercises.push({
        id: 'ex-' + Date.now() + '-' + idx,
        name,
        sets,
        reps,
        weight,
        completed: false
      });
    }
  });

  // Save in State & LocalStorage
  AppState.gymPlan[targetDay] = {
    muscleGroups,
    exercises
  };
  saveGymPlanToStorage();

  closeModal('modal-gym-planner');
  AppState.selectedGymDay = targetDay;
  renderGymDayTabs();
  renderSelectedGymDayWorkout();
  showToast(`Routine saved for ${targetDay}!`, 'success');
}

// PRESET SPLIT APPLICATION
function openPresetSplitModal() {
  openModal('modal-preset-splits');
}

function applySplitPreset(type) {
  if (confirm(`Apply this workout preset? This will configure routines for Monday through Sunday.`)) {
    if (type === 'ppl') {
      AppState.gymPlan = JSON.parse(JSON.stringify(DEFAULT_GYM_SPLIT));
    } else if (type === 'upper_lower') {
      AppState.gymPlan = {
        Monday: {
          muscleGroups: ['Chest', 'Back', 'Shoulders', 'Triceps'],
          exercises: [
            { id: 'ul-1', name: 'Barbell Bench Press', sets: '4', reps: '8', weight: '75kg', completed: false },
            { id: 'ul-2', name: 'Barbell Row', sets: '4', reps: '8', weight: '65kg', completed: false },
            { id: 'ul-3', name: 'Overhead Shoulder Press', sets: '3', reps: '10', weight: '45kg', completed: false },
            { id: 'ul-4', name: 'Tricep Rope Extension', sets: '3', reps: '12', weight: '25kg', completed: false }
          ]
        },
        Tuesday: {
          muscleGroups: ['Legs / Quads', 'Core / Abs'],
          exercises: [
            { id: 'ul-5', name: 'Barbell Squat', sets: '4', reps: '8', weight: '90kg', completed: false },
            { id: 'ul-6', name: 'Romanian Deadlift', sets: '3', reps: '10', weight: '80kg', completed: false },
            { id: 'ul-7', name: 'Leg Press', sets: '3', reps: '12', weight: '140kg', completed: false },
            { id: 'ul-8', name: 'Hanging Leg Raises', sets: '3', reps: '15', weight: '', completed: false }
          ]
        },
        Wednesday: { muscleGroups: ['Rest Day'], exercises: [] },
        Thursday: {
          muscleGroups: ['Chest', 'Back', 'Biceps'],
          exercises: [
            { id: 'ul-9', name: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '26kg', completed: false },
            { id: 'ul-10', name: 'Lat Pulldowns', sets: '4', reps: '10', weight: '60kg', completed: false },
            { id: 'ul-11', name: 'Dumbbell Lateral Raises', sets: '4', reps: '15', weight: '10kg', completed: false },
            { id: 'ul-12', name: 'Bicep Barbell Curls', sets: '3', reps: '12', weight: '30kg', completed: false }
          ]
        },
        Friday: {
          muscleGroups: ['Legs / Quads', 'Core / Abs'],
          exercises: [
            { id: 'ul-13', name: 'Bulgarian Split Squats', sets: '3', reps: '10/leg', weight: '16kg', completed: false },
            { id: 'ul-14', name: 'Hamstring Leg Curls', sets: '4', reps: '12', weight: '45kg', completed: false },
            { id: 'ul-15', name: 'Calf Raises', sets: '4', reps: '15', weight: '70kg', completed: false }
          ]
        },
        Saturday: { muscleGroups: ['Rest Day'], exercises: [] },
        Sunday: { muscleGroups: ['Rest Day'], exercises: [] }
      };
    } else if (type === 'bro_split') {
      AppState.gymPlan = {
        Monday: { muscleGroups: ['Chest'], exercises: [{ id: 'b-1', name: 'Flat Bench Press', sets: '4', reps: '8-10', weight: '70kg', completed: false }, { id: 'b-2', name: 'Incline DB Press', sets: '3', reps: '10', weight: '24kg', completed: false }] },
        Tuesday: { muscleGroups: ['Back'], exercises: [{ id: 'b-3', name: 'Deadlifts', sets: '4', reps: '6', weight: '110kg', completed: false }, { id: 'b-4', name: 'Pull-ups', sets: '4', reps: '8', weight: 'BW', completed: false }] },
        Wednesday: { muscleGroups: ['Shoulders'], exercises: [{ id: 'b-5', name: 'Military Overhead Press', sets: '4', reps: '8', weight: '45kg', completed: false }, { id: 'b-6', name: 'Lateral Raises', sets: '4', reps: '15', weight: '10kg', completed: false }] },
        Thursday: { muscleGroups: ['Legs / Quads'], exercises: [{ id: 'b-7', name: 'Back Squats', sets: '4', reps: '8', weight: '95kg', completed: false }, { id: 'b-8', name: 'Leg Extensions', sets: '3', reps: '15', weight: '50kg', completed: false }] },
        Friday: { muscleGroups: ['Biceps', 'Triceps'], exercises: [{ id: 'b-9', name: 'Barbell Curls', sets: '4', reps: '10', weight: '30kg', completed: false }, { id: 'b-10', name: 'Dips / Cable Pushdowns', sets: '4', reps: '12', weight: '', completed: false }] },
        Saturday: { muscleGroups: ['Core / Abs'], exercises: [{ id: 'b-11', name: 'Planks & Hanging Knee Raises', sets: '3', reps: '60s', weight: '', completed: false }] },
        Sunday: { muscleGroups: ['Rest Day'], exercises: [] }
      };
    }

    saveGymPlanToStorage();
    closeModal('modal-preset-splits');
    renderGymDayTabs();
    renderSelectedGymDayWorkout();
    showToast('Preset routine applied successfully!', 'success');
  }
}

// ==========================================
// HEALTH INFO UPDATE MODAL (Req 6)
// ==========================================
function openHealthUpdateModal() {
  const profile = AppState.profile || {};
  const todayIso = new Date().toISOString().split('T')[0];

  document.getElementById('update-health-date').value = todayIso;
  document.getElementById('update-weight').value = profile.weight || '';
  document.getElementById('update-height').value = profile.height || '';
  document.getElementById('update-allergies').value = profile.allergies || '';

  renderHealthHistoryPreview();
  openModal('modal-health-update');
}

function handleUpdateHealth(e) {
  e.preventDefault();
  const date = document.getElementById('update-health-date').value;
  const weight = parseFloat(document.getElementById('update-weight').value);
  const height = parseFloat(document.getElementById('update-height').value);
  const allergies = document.getElementById('update-allergies').value.trim() || 'None';

  if (!weight || !height) return;

  const bmi = calculateBMI(weight, height);

  // Update profile
  AppState.profile.weight = weight;
  AppState.profile.height = height;
  AppState.profile.allergies = allergies;
  AppState.profile.lastUpdated = date;
  saveProfileToStorage();

  // Add to health logs
  AppState.healthLogs.unshift({
    date,
    weight,
    height,
    bmi,
    allergies,
    loggedAt: new Date().toISOString()
  });
  saveHealthLogsToStorage();

  closeModal('modal-health-update');
  renderHeaderAndHero();
  showToast(`Updated health vitals for ${date}! BMI: ${bmi}`, 'success');
}

function renderHealthHistoryPreview() {
  const container = document.getElementById('health-history-items');
  if (!container) return;

  container.innerHTML = '';
  if (AppState.healthLogs.length === 0) {
    container.innerHTML = '<span class="text-slate-400 italic">No past logs recorded yet.</span>';
    return;
  }

  AppState.healthLogs.slice(0, 4).forEach(log => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';
    item.innerHTML = `
      <span class="font-medium">${log.date}</span>
      <span class="font-bold text-slate-900 dark:text-white">${log.weight} kg • ${log.height} cm</span>
      <span class="text-emerald-500 font-semibold">BMI: ${log.bmi}</span>
    `;
    container.appendChild(item);
  });
}

function openProfileDetailsModal() {
  const profile = AppState.profile || {};
  document.getElementById('profile-modal-name').textContent = profile.name || 'User';
  document.getElementById('profile-modal-goal').textContent = profile.fitnessGoal || 'General Fitness';
  document.getElementById('profile-modal-weight').textContent = `${profile.weight || '--'} kg`;
  document.getElementById('profile-modal-height').textContent = `${profile.height || '--'} cm`;
  document.getElementById('profile-modal-allergies').textContent = profile.allergies || 'None';

  openModal('modal-profile-details');
}

// ==========================================
// UTILITIES & HELPERS
// ==========================================
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal Weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Close modals when clicking backdrop
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('backdrop-blur-sm') && e.target.id.startsWith('modal-')) {
    e.target.classList.add('hidden');
  }
});

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white border border-slate-700'
  };

  toast.className = `px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold pointer-events-auto transform transition-all duration-300 animate-fadeIn ${
    typeStyles[type] || typeStyles.info
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Confetti celebration trigger
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// Complete factory reset confirmation
function confirmResetAllData() {
  if (confirm("Are you sure you want to clear ALL saved data (profile, goals, gym schedule)? You will be returned to the onboarding screen.")) {
    localStorage.clear();
    location.reload();
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
