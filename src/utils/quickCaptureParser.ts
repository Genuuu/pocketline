import { Priority, TaskCategory, TransactionType, AccountType, ProjectHorizon } from '../types';

export type QuickCaptureKind = 'task' | 'expense' | 'income' | 'transfer' | 'plan' | 'note' | 'unknown';

export interface ParsedQuickCapture {
  kind: QuickCaptureKind;
  raw: string;
  task?: {
    title: string;
    priority: Priority;
    category: TaskCategory;
    dueDate: string;
    isFocusTop3: boolean;
  };
  transaction?: {
    amount: number;
    type: TransactionType;
    category: string;
    account: AccountType;
    note: string;
    date: string;
    isReimbursable: boolean;
    projectName?: string;
  };
  plan?: {
    title: string;
    horizon: ProjectHorizon;
    targetDate: string;
    budget?: number;
    category: string;
  };
  note?: {
    content: string;
    category: string;
  };
}

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseQuickCapture(input: string): ParsedQuickCapture {
  const raw = input.trim();
  if (!raw) {
    return { kind: 'unknown', raw: '' };
  }

  // 1. Expense shorthand: starts with $ or -$ (e.g. "$45.50 Lunch #food [card]")
  const expenseMatch = raw.match(/^([$-])\s*(\d+(?:\.\d{1,2})?)(.*)$/i);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[2]);
    const remainder = expenseMatch[3].trim();
    return parseTransaction(remainder, amount, 'expense', raw);
  }

  // Income shorthand: starts with +$ (e.g. "+$2500 Client retainer #freelance [bank]")
  const incomeMatch = raw.match(/^\+\s*\$?(\d+(?:\.\d{1,2})?)(.*)$/i);
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1]);
    const remainder = incomeMatch[2].trim();
    return parseTransaction(remainder, amount, 'income', raw);
  }

  // 2. Explicit Plan/Roadmap: "!plan Robot Arm @2026-12-01 $1200 #hardware"
  if (raw.startsWith('!plan') || raw.startsWith('/plan')) {
    const content = raw.replace(/^[!/]plan\s*/i, '').trim();
    return parsePlan(content, raw);
  }

  // 3. Scratchpad / Brain dump note: "!note" or "!dump"
  if (raw.startsWith('!note') || raw.startsWith('/note') || raw.startsWith('!dump') || raw.startsWith('/dump')) {
    const content = raw.replace(/^[!/](note|dump)\s*/i, '').trim();
    let category = 'Idea';
    const catMatch = content.match(/#(\w+)/);
    if (catMatch) {
      category = catMatch[1];
    }
    const cleanContent = content.replace(/#\w+/, '').trim();
    return {
      kind: 'note',
      raw,
      note: {
        content: cleanContent || content,
        category,
      },
    };
  }

  // 4. Tasks: default or "!task ..." or "/task ..."
  const taskContent = raw.replace(/^[!/]task\s*/i, '').trim();
  return parseTask(taskContent, raw);
}

function parseTask(content: string, raw: string): ParsedQuickCapture {
  let text = content;

  // Priority: !p:high, !p:med, !p:low or !high, !med, !low
  let priority: Priority = 'med';
  const pMatch = text.match(/(?:!p:(!?high|med|low)|!(high|med|low))/i);
  if (pMatch) {
    const val = (pMatch[1] || pMatch[2]).toLowerCase() as Priority;
    priority = val;
    text = text.replace(pMatch[0], '').trim();
  }

  // Category: #personal, #work, #academic, #projects
  let category: TaskCategory = 'personal';
  const catMatch = text.match(/#(personal|work|academic|projects)/i);
  if (catMatch) {
    category = catMatch[1].toLowerCase() as TaskCategory;
    text = text.replace(catMatch[0], '').trim();
  } else {
    // any arbitrary hashtag
    const genericHash = text.match(/#(\w+)/);
    if (genericHash) {
      const tag = genericHash[1].toLowerCase();
      if (tag === 'work' || tag === 'job') category = 'work';
      else if (tag === 'school' || tag === 'study' || tag === 'academic') category = 'academic';
      else if (tag === 'project' || tag === 'projects' || tag === 'build') category = 'projects';
      text = text.replace(genericHash[0], '').trim();
    }
  }

  // Due date: @today, @tomorrow, @YYYY-MM-DD
  let dueDate = getTodayDateString();
  const dateMatch = text.match(/@(today|tomorrow|\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    const dateVal = dateMatch[1].toLowerCase();
    if (dateVal === 'today') {
      dueDate = getTodayDateString(0);
    } else if (dateVal === 'tomorrow') {
      dueDate = getTodayDateString(1);
    } else {
      dueDate = dateVal;
    }
    text = text.replace(dateMatch[0], '').trim();
  }

  // Top 3 Focus flag: +focus or !top3
  let isFocusTop3 = false;
  if (/(\+focus|!top3|!focus)/i.test(text)) {
    isFocusTop3 = true;
    text = text.replace(/(\+focus|!top3|!focus)/gi, '').trim();
  }

  // Clean remaining text
  const cleanTitle = text.replace(/\s+/g, ' ').trim() || 'New Task';

  return {
    kind: 'task',
    raw,
    task: {
      title: cleanTitle,
      priority,
      category,
      dueDate,
      isFocusTop3,
    },
  };
}

function parseTransaction(content: string, amount: number, type: TransactionType, raw: string): ParsedQuickCapture {
  let text = content;

  // Account: [cash], [bank], [card], [main], [personal], [savings]
  let account: AccountType = 'card';
  const accMatch = text.match(/\[([a-zA-Z0-9_-]+)\]/i);
  if (accMatch) {
    account = accMatch[1].toLowerCase() as AccountType;
    text = text.replace(accMatch[0], '').trim();
  }

  // Category: #food, #groceries, #tech, #housing, etc.
  let category = type === 'income' ? 'Income' : 'General';
  const catMatch = text.match(/#(\w+)/);
  if (catMatch) {
    category = catMatch[1].charAt(0).toUpperCase() + catMatch[1].slice(1).toLowerCase();
    text = text.replace(catMatch[0], '').trim();
  }

  // Reimbursable: ?reimburse or ?pending
  let isReimbursable = false;
  if (/\?(reimburse|pending|owed)/i.test(text)) {
    isReimbursable = true;
    text = text.replace(/\?(reimburse|pending|owed)/gi, '').trim();
  }

  // Project link: @project:Name or @proj:Name
  let projectName: string | undefined;
  const projMatch = text.match(/@(project|proj):([a-zA-Z0-9_-]+)/i);
  if (projMatch) {
    projectName = projMatch[2];
    text = text.replace(projMatch[0], '').trim();
  }

  const cleanNote = text.replace(/\s+/g, ' ').trim() || (type === 'income' ? 'Logged Income' : 'Logged Expense');

  return {
    kind: type,
    raw,
    transaction: {
      amount,
      type,
      category,
      account,
      note: cleanNote,
      date: getTodayDateString(),
      isReimbursable,
      projectName,
    },
  };
}

function parsePlan(content: string, raw: string): ParsedQuickCapture {
  let text = content;

  // Target date: @YYYY-MM-DD or @tomorrow etc.
  let targetDate = getTodayDateString(30); // default 30 days ahead
  const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    targetDate = dateMatch[1];
    text = text.replace(dateMatch[0], '').trim();
  }

  // Budget: $1200
  let budget: number | undefined;
  const budgetMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (budgetMatch) {
    budget = parseFloat(budgetMatch[1]);
    text = text.replace(budgetMatch[0], '').trim();
  }

  // Category: #hardware, #software, #personal, #career
  let category = 'Project';
  const catMatch = text.match(/#(\w+)/);
  if (catMatch) {
    category = catMatch[1];
    text = text.replace(catMatch[0], '').trim();
  }

  // Horizon: default short-term unless #longterm or > 90 days
  let horizon: ProjectHorizon = 'short-term';
  if (/#(longterm|long-term)/i.test(text)) {
    horizon = 'long-term';
    text = text.replace(/#(longterm|long-term)/gi, '').trim();
  }

  const cleanTitle = text.replace(/\s+/g, ' ').trim() || 'New Roadmap Project';

  return {
    kind: 'plan',
    raw,
    plan: {
      title: cleanTitle,
      horizon,
      targetDate,
      budget,
      category,
    },
  };
}
