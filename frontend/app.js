const STORAGE_KEY = "vieXLSX.v2.tasks";
const CATEGORY_KEY = "vieXLSX.v2.categories";
function toISODate(date) { const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }
function startOfWeek(date) { const d = new Date(date); const offset = (d.getDay() + 6) % 7; d.setDate(d.getDate() - offset); return d; }
const WEEKDAYS_VI = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatTodayLabel(language) {
  const d = todayDate; const day = String(d.getDate()).padStart(2, "0"); const month = String(d.getMonth() + 1).padStart(2, "0");
  return language === "en" ? `${WEEKDAYS_EN[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${day}, ${d.getFullYear()}` : `${WEEKDAYS_VI[d.getDay()]}, ${day} tháng ${month}, ${d.getFullYear()}`;
}
const todayDate = new Date();
const today = toISODate(todayDate);
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

const seedTasks = [
  { id: 1, title: "Hoàn thiện proposal cho khách hàng", description: "Chốt phần ngân sách và timeline triển khai.", status: "in_progress", priority: "high", due_date: "2026-09-05", category: "work", tags: "important, meeting", created_time: "2026-09-01T09:15:00", completed_time: "" },
  { id: 2, title: "Review pull request #42", description: "Kiểm tra phần đồng bộ Excel và cập nhật nhận xét.", status: "todo", priority: "high", due_date: "2026-09-05", category: "work", tags: "urgent", created_time: "2026-09-02T14:20:00", completed_time: "" },
  { id: 3, title: "Đặt lịch khám sức khỏe", description: "Chọn một khung giờ buổi sáng tuần sau.", status: "todo", priority: "normal", due_date: "2026-09-08", category: "personal", tags: "", created_time: "2026-09-03T10:00:00", completed_time: "" },
  { id: 4, title: "Gửi biên bản cuộc họp tuần", description: "Tổng hợp action items và gửi cho team.", status: "done", priority: "normal", due_date: "2026-09-04", category: "work", tags: "meeting", created_time: "2026-08-29T09:00:00", completed_time: "2026-09-04T16:30:00" },
  { id: 5, title: "Mua cây xanh cho bàn làm việc", description: "", status: "done", priority: "low", due_date: "2026-09-02", category: "home", tags: "", created_time: "2026-08-30T13:12:00", completed_time: "2026-09-02T18:00:00" },
  { id: 6, title: "Chuẩn bị slide demo v2", description: "Tập trung vào flow xuất workbook.", status: "todo", priority: "normal", due_date: "2026-09-12", category: "work", tags: "important", created_time: "2026-09-04T08:20:00", completed_time: "" }
];

let tasks = load(STORAGE_KEY, seedTasks);
let categories = load(CATEGORY_KEY, ["work", "personal", "home"]);
let currentView = "overview";
let activeStatus = "all";
let activeCategory = "all";
let editingId = null;
let serverOnline = false;
let appConfig = {};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const statusLabels = { todo: "Chưa làm", in_progress: "Đang làm", done: "Hoàn tất", review: "Đang review" };
const priorityLabels = { high: "Cao", normal: "Bình thường", low: "Thấp" };
const translations = {
  vi: { overview: "Tổng quan", tasks: "Công việc", today: "Hôm nay", upcoming: "Sắp tới", settings: "Cài đặt", newTask: "Công việc mới", all: "Tất cả", todo: "Chưa làm", inProgress: "Đang làm", done: "Hoàn tất", review: "Đang review", progress: "Tiến độ tuần này", active: "Đang thực hiện", due: "Đến hạn hôm nay", weekDone: "Hoàn tất tuần này", save: "Lưu công việc", cancel: "Hủy", workspace: "Workspace", categories: "Danh mục", synced: "Đã đồng bộ Excel", offline: "Chưa kết nối backend", focus: "Tiêu điểm hôm nay", focusEmpty: "Chọn một việc để bắt đầu", board: "Bảng công việc", month: "Tháng 09", week: "Công việc tuần này", filter: "Bộ lọc", create: "Tạo công việc", todoList: "Todo list", inReview: "In Review", recent: "Công việc gần đây", priority: "Việc ưu tiên", attention: "Cần chú ý", activity: "Hoạt động gần đây", allTasks: "Tất cả công việc", taskLibrary: "Task library", search: "Tìm theo tên, mô tả, tag...", clearDone: "Dọn việc đã xong", settingsTitle: "Cài đặt", settingsIntro: "Điều chỉnh cách vieXLSX hoạt động cho bạn.", workspaceName: "Tên workspace", autosave: "Tự động lưu Excel", showActivity: "Hiện hoạt động", showStats: "Hiện thống kê", export: "Xuất JSON", personalization: "Personalization", add: "Thêm", todayIntro: "Những việc cần được xử lý trong ngày.", upcomingIntro: "Giữ nhịp chủ động cho những ngày kế tiếp.", title: "Tên công việc", description: "Mô tả", status: "Trạng thái", priorityLabel: "Độ ưu tiên", dueDate: "Hạn hoàn thành", category: "Danh mục", tags: "Tags", emptyPriority: "Bạn đã hoàn tất mọi việc", emptyPriorityCopy: "Một khoảng thở rất xứng đáng.", emptyRecent: "Chưa có công việc", emptyRecentCopy: "Tạo task đầu tiên để bắt đầu.", emptySearch: "Không tìm thấy công việc", emptySearchCopy: "Thử đổi bộ lọc hoặc thêm task mới.", emptyToday: "Lịch hôm nay đang trống", emptyTodayCopy: "Một ngày nhẹ nhàng cũng là một kế hoạch tốt.", emptyUpcoming: "Chưa có việc sắp tới", emptyUpcomingCopy: "Bạn đang đi trước lịch trình.", emptyBoard: "Chưa có công việc", noDue: "Không có việc quá hạn", overdue: "việc đã quá hạn", dueLabel: "Quá hạn · ", notDue: "Chưa đặt hạn", deleted: "Đã xóa công việc trong Excel" },
  en: { overview: "Overview", tasks: "Tasks", today: "Today", upcoming: "Upcoming", settings: "Settings", newTask: "New task", all: "All", todo: "To do", inProgress: "In progress", done: "Done", review: "In review", progress: "Weekly progress", active: "In progress", due: "Due today", weekDone: "Completed this week", save: "Save task", cancel: "Cancel", workspace: "Workspace", categories: "Categories", synced: "Excel synced", offline: "Backend offline", focus: "Today's focus", focusEmpty: "Choose a task to begin", board: "Board", month: "September", week: "This week's tasks", filter: "Filters", create: "Create task", todoList: "Todo list", inReview: "In review", recent: "Recent tasks", priority: "Priority tasks", attention: "Needs attention", activity: "Recent activity", allTasks: "All tasks", taskLibrary: "Task library", search: "Search by title, description, tag...", clearDone: "Clear completed", settingsTitle: "Settings", settingsIntro: "Adjust how vieXLSX works for you.", workspaceName: "Workspace name", autosave: "Auto-save Excel", showActivity: "Show activity", showStats: "Show statistics", export: "Export JSON", personalization: "Personalization", add: "Add", todayIntro: "Tasks that need attention today.", upcomingIntro: "Stay ahead of your upcoming work.", title: "Task title", description: "Description", status: "Status", priorityLabel: "Priority", dueDate: "Due date", category: "Category", tags: "Tags", emptyPriority: "All tasks are complete", emptyPriorityCopy: "A well-earned breather.", emptyRecent: "No tasks yet", emptyRecentCopy: "Create your first task to begin.", emptySearch: "No tasks found", emptySearchCopy: "Try changing the filters or add a new task.", emptyToday: "Today is clear", emptyTodayCopy: "A lighter day is a good plan too.", emptyUpcoming: "No upcoming tasks", emptyUpcomingCopy: "You are ahead of schedule.", emptyBoard: "No tasks", noDue: "No overdue tasks", overdue: "overdue", dueLabel: "Overdue · ", notDue: "No due date", deleted: "Task deleted from Excel" }
};

function tr(key) { return (translations[appConfig.language || "vi"] || translations.vi)[key] || key; }
function statusText(status) { return { todo: tr("todo"), in_progress: tr("inProgress"), done: tr("done"), review: tr("review") }[status] || status; }
function priorityText(priority) { return { high: appConfig.language === "en" ? "High" : "Cao", normal: appConfig.language === "en" ? "Normal" : "Bình thường", low: appConfig.language === "en" ? "Low" : "Thấp" }[priority] || priority; }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

function applyUsername() {
  const username = appConfig.username || "Kadu";
  $("#usernameLabel").textContent = username;
  $("#profileAvatar").textContent = username.slice(0, 1).toUpperCase();
  $("#usernameInput").value = username;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Backend request failed");
  return body;
}

async function refreshFromServer(showError = false) {
  try {
    const body = await apiRequest("/api/tasks");
    const nextTasks = body.tasks || [];
    const changed = JSON.stringify(nextTasks) !== JSON.stringify(tasks);
    tasks = nextTasks;
    serverOnline = true;
    if (changed || showError) render();
    persist();
  } catch (error) {
    const wasOnline = serverOnline;
    serverOnline = false;
    persist();
    if (showError || wasOnline) showToast("Backend chưa sẵn sàng, đang dùng cache");
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function formatDate(value) {
  if (!value) return tr("notDue");
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(appConfig.language === "en" ? "en-US" : "vi-VN", { day: "2-digit", month: "2-digit" });
}

function isOverdue(task) { return task.status !== "done" && task.due_date && task.due_date < today; }
function categoryLabel(category) { return category ? category.charAt(0).toUpperCase() + category.slice(1) : (appConfig.language === "en" ? "Uncategorized" : "Không phân loại"); }
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function renderCategories() {
  const counts = Object.fromEntries(categories.map((category) => [category, tasks.filter((task) => (task.category || "").toLowerCase() === category.toLowerCase()).length]));
  $("#categoryList").innerHTML = categories.map((category, index) => `<button class="category-item ${activeCategory === category ? "selected" : ""}" data-category="${escapeHtml(category)}"><span class="category-dot ${index % 3 === 1 ? "c1" : index % 3 === 2 ? "c2" : ""}"></span><span>${escapeHtml(categoryLabel(category))}</span><strong>${counts[category] || 0}</strong></button>`).join("");
  $("#settingsCategories").innerHTML = categories.map((category) => `<span class="tag">${escapeHtml(categoryLabel(category))}</span>`).join("");
  $("#taskCategory").innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(categoryLabel(category))}</option>`).join("");
  $("#categoryFilter").innerHTML = `<option value="all">${tr("all")} ${appConfig.language === "en" ? "categories" : "danh mục"}</option>` + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(categoryLabel(category))}</option>`).join("");
  $("#categoryFilter").value = activeCategory;
}

function taskRow(task, compact = false, index = 0) {
  const tag = task.tags ? task.tags.split(",")[0].trim() : "";
  const delay = Math.min(index, 8) * 28;
  return `<div class="task-row" data-task-id="${task.id}" style="animation-delay:${delay}ms">
    <button class="task-check ${task.status === "done" ? "done" : ""}" data-action="toggle" aria-label="Đánh dấu ${escapeHtml(task.title)}">${CHECK_SVG}</button>
    <span class="priority-marker ${task.priority}"></span>
    <div class="task-main"><div class="task-title ${task.status === "done" ? "done" : ""}">${escapeHtml(task.title)}</div><div class="task-meta"><span>${escapeHtml(categoryLabel(task.category))}</span>${tag ? `<span class="tag">${escapeHtml(tag)}</span>` : ""}${compact ? "" : `<span class="status-badge ${task.status}">${statusText(task.status)}</span>`}</div></div>
    <span class="task-date ${isOverdue(task) ? "overdue" : ""}">${isOverdue(task) ? `<span class="overdue-label">${tr("dueLabel")}</span>` : ""}${formatDate(task.due_date)}</span>
    <div class="task-actions"><button class="row-action" data-action="open" title="Xem chi tiết"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></button><button class="row-action" data-action="delete" title="Xóa"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
  </div>`;
}

function boardCard(task, index) {
  const tag = task.tags ? task.tags.split(",")[0].trim() : "task";
  return `<article class="kanban-card card-${task.priority}" data-task-id="${task.id}" style="animation-delay:${Math.min(index, 8) * 35}ms"><div class="kanban-card-top"><span class="kanban-tag">${escapeHtml(tag)}</span><span><button class="card-menu" data-action="open" aria-label="${tr("tasks")}">•••</button><button class="card-delete" data-action="delete" aria-label="${tr("deleted")}">×</button></span></div><button class="kanban-title" data-action="open">${escapeHtml(task.title)}</button>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ""}<div class="kanban-progress"><span style="width:${task.status === "done" ? 100 : task.status === "in_progress" ? 58 : 24}%"></span></div><div class="kanban-card-footer"><span>${task.status === "done" ? tr("done") : formatDate(task.due_date)}</span><span class="kanban-avatar">${escapeHtml((task.category || "K").slice(0, 1).toUpperCase())}</span></div></article>`;
}

function renderBoard() {
  const columns = [["todo", tr("todoList")], ["in_progress", tr("inProgress")], ["done", tr("done")]];
  $("#kanbanBoard").innerHTML = columns.map(([key, title]) => {
    const items = tasks.filter((task) => task.status === key);
    return `<section class="kanban-column column-${key}"><div class="kanban-column-head"><strong>${title}</strong><span>${items.length}</span><button class="column-add" data-board-add="${key}" aria-label="${tr("create")}">+</button><button class="column-menu" aria-label="${tr("board")}">•••</button></div><div class="kanban-cards">${items.length ? items.map(boardCard).join("") : `<div class="kanban-empty">${tr("emptyBoard")}</div>`}</div></section>`;
  }).join("");
}

function animateCount(el, value) {
  const from = Number(el.dataset.count || 0);
  const to = Number(value) || 0;
  el.dataset.count = to;
  if (from === to) { el.textContent = el.dataset.suffix ? `${to}${el.dataset.suffix}` : String(to); return; }
  const duration = 420;
  const start = performance.now();
  const suffix = el.dataset.suffix || "";
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(from + (to - from) * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderOverview() {
  const completed = tasks.filter((task) => task.status === "done").length;
  const active = tasks.filter((task) => task.status !== "done").length;
  const dueToday = tasks.filter((task) => task.due_date === today && task.status !== "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  renderBoard();
  $("#navTaskCount").textContent = tasks.length;
  $("#progressValue").dataset.suffix = "%"; animateCount($("#progressValue"), progress);
  $("#progressBar").style.width = `${progress}%`;
  $("#progressCaption").textContent = appConfig.language === "en" ? `${completed} / ${tasks.length} tasks complete` : `${completed} / ${tasks.length} công việc hoàn thành`;
  animateCount($("#activeValue"), active);
  animateCount($("#todayValue"), dueToday);
  $("#overdueCaption").textContent = overdue ? `${overdue} ${tr("overdue")}` : tr("noDue");
  const focus = tasks.find((task) => task.status !== "done" && task.priority === "high") || tasks.find((task) => task.status !== "done");
  $("#focusText").textContent = focus ? focus.title : tr("emptyPriority");
  $("#focusButton").dataset.taskId = focus ? focus.id : "";
  const priorities = tasks.filter((task) => task.status !== "done").sort(prioritySort).slice(0, 4);
  $("#priorityTasks").innerHTML = priorities.length ? priorities.map((task, i) => taskRow(task, true, i)).join("") : emptyState(tr("emptyPriority"), tr("emptyPriorityCopy"));
  const recent = [...tasks].sort((a, b) => b.created_time.localeCompare(a.created_time)).slice(0, 4);
  $("#recentTasks").innerHTML = recent.length ? recent.map((task, i) => taskRow(task, false, i)).join("") : emptyState(tr("emptyRecent"), tr("emptyRecentCopy"));
  const weekStart = startOfWeek(todayDate);
  const dayCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); const iso = toISODate(d);
    return tasks.filter((task) => (task.completed_time || "").slice(0, 10) === iso).length;
  });
  const todayIndex = (todayDate.getDay() + 6) % 7;
  const maxCount = Math.max(1, ...dayCounts);
  $("#activityChart").innerHTML = dayCounts.map((count, index) => `<span class="chart-bar ${index === todayIndex ? "highlight" : ""}" style="height:${count ? Math.max(12, Math.round((count / maxCount) * 100)) : 4}%; animation-delay:${index * 45}ms" title="${count}"></span>`).join("");
  const completedThisWeek = dayCounts.reduce((sum, count) => sum + count, 0);
  $("#weekDoneValue").dataset.suffix = ""; animateCount($("#weekDoneValue"), completedThisWeek);
  $("#weekDoneCaption").textContent = completedThisWeek
    ? (appConfig.language === "en" ? `${completedThisWeek} task${completedThisWeek === 1 ? "" : "s"} done` : `${completedThisWeek} việc đã hoàn tất`)
    : (appConfig.language === "en" ? "No tasks done yet" : "Chưa có việc hoàn tất");
}

function prioritySort(a, b) { return ({ high: 0, normal: 1, low: 2 }[a.priority] - { high: 0, normal: 1, low: 2 }[b.priority]) || a.due_date.localeCompare(b.due_date); }
function emptyState(title, copy) { return `<div class="empty-state"><strong>${title}</strong>${copy}</div>`; }

function filteredTasks() {
  const query = $("#searchInput")?.value.toLowerCase().trim() || "";
  const sort = $("#sortSelect")?.value || "priority";
  let result = tasks.filter((task) => activeStatus === "all" || task.status === activeStatus).filter((task) => activeCategory === "all" || (task.category || "").toLowerCase() === activeCategory.toLowerCase()).filter((task) => !query || [task.title, task.description, task.category, task.tags].join(" ").toLowerCase().includes(query));
  if (sort === "priority") result.sort(prioritySort);
  if (sort === "due_date") result.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  if (sort === "created_time") result.sort((a, b) => b.created_time.localeCompare(a.created_time));
  if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "vi"));
  return result;
}

function renderTaskLists() {
  const result = filteredTasks();
  $("#listSummary").textContent = appConfig.language === "en" ? `${result.length} tasks` : `${result.length} công việc`;
  $("#allTasks").innerHTML = result.length ? result.map((task, i) => taskRow(task, false, i)).join("") : emptyState(tr("emptySearch"), tr("emptySearchCopy"));
  const dueToday = tasks.filter((task) => task.due_date === today);
  $("#todayTasks").innerHTML = dueToday.length ? dueToday.map((task, i) => taskRow(task, false, i)).join("") : emptyState(tr("emptyToday"), tr("emptyTodayCopy"));
  const upcoming = tasks.filter((task) => task.due_date > today && task.status !== "done").sort((a, b) => a.due_date.localeCompare(b.due_date));
  $("#upcomingTasks").innerHTML = upcoming.length ? upcoming.map((task, i) => taskRow(task, false, i)).join("") : emptyState(tr("emptyUpcoming"), tr("emptyUpcomingCopy"));
}

function render() { renderCategories(); renderOverview(); renderTaskLists(); persist(); }

function openModal(task = null) {
  editingId = task?.id || null;
  $("#modalTitle").textContent = task ? (appConfig.language === "en" ? "Edit task" : "Chỉnh sửa công việc") : (appConfig.language === "en" ? "Create task" : "Tạo công việc");
  $("#taskTitle").value = task?.title || ""; $("#taskDescription").value = task?.description || "";
  $("#taskStatus").value = task?.status || "todo"; $("#taskPriority").value = task?.priority || "normal";
  $("#taskDueDate").value = task?.due_date || today; $("#taskCategory").value = task?.category || categories[0] || ""; $("#taskTags").value = task?.tags || "";
  $("#taskModal").hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => $("#taskTitle").focus(), 0);
}
function closeModal() { $("#taskModal").hidden = true; document.body.style.overflow = ""; }

function openDrawer(id) {
  const task = tasks.find((item) => item.id === Number(id)); if (!task) return;
  $("#drawerContent").innerHTML = `<div class="drawer-title">${escapeHtml(task.title)}</div><p class="drawer-description">${escapeHtml(task.description || (appConfig.language === "en" ? "No description for this task." : "Chưa có mô tả cho công việc này."))}</p><div class="drawer-fields"><div class="drawer-field"><span>${tr("status")}</span><strong>${statusText(task.status)}</strong></div><div class="drawer-field"><span>${tr("priorityLabel")}</span><strong>${priorityText(task.priority)}</strong></div><div class="drawer-field"><span>${tr("dueDate")}</span><strong class="${isOverdue(task) ? "task-date overdue" : ""}">${formatDate(task.due_date)}</strong></div><div class="drawer-field"><span>${tr("category")}</span><strong>${escapeHtml(categoryLabel(task.category))}</strong></div></div><div class="drawer-actions"><button class="button button-primary" data-drawer-edit="${task.id}">${appConfig.language === "en" ? "Edit task" : "Chỉnh sửa công việc"}</button><button class="button button-danger" data-drawer-delete="${task.id}">${appConfig.language === "en" ? "Delete" : "Xóa"}</button></div>`;
  $("#detailDrawer").classList.add("open"); $("#detailDrawer").setAttribute("aria-hidden", "false");
  $("#drawerScrim").hidden = false; requestAnimationFrame(() => $("#drawerScrim").classList.add("show"));
}
function closeDrawer() {
  $("#detailDrawer").classList.remove("open"); $("#detailDrawer").setAttribute("aria-hidden", "true");
  $("#drawerScrim").classList.remove("show"); setTimeout(() => { $("#drawerScrim").hidden = true; }, 260);
}

function openSidebar() { $(".sidebar").classList.add("open"); $("#sidebarScrim").hidden = false; requestAnimationFrame(() => $("#sidebarScrim").classList.add("show")); }
function closeSidebar() { $(".sidebar").classList.remove("open"); $("#sidebarScrim").classList.remove("show"); setTimeout(() => { if (!$(".sidebar").classList.contains("open")) $("#sidebarScrim").hidden = true; }, 260); }

function switchView(view) {
  currentView = view; const titles = { overview: tr("overview"), tasks: tr("allTasks"), today: tr("today"), upcoming: tr("upcoming"), settings: tr("settingsTitle") };
  $$(".nav-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".tab-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
  $("#breadcrumbTitle").textContent = titles[view]; window.scrollTo({ top: 0, behavior: "smooth" });
  closeSidebar();
}

function removeRowThenRefresh(id, after) {
  const row = document.querySelector(`.task-row[data-task-id="${id}"]`);
  if (row) { row.classList.add("leaving"); }
  setTimeout(after, row ? 180 : 0);
}

async function deleteTask(id) {
  const task = tasks.find((item) => item.id === Number(id));
  if (!task || !confirm(`${appConfig.language === "en" ? "Delete" : "Xóa"} “${task.title}”?`)) return;
  try {
    removeRowThenRefresh(id, async () => {
      await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
      await refreshFromServer(); closeDrawer(); showToast("Đã xóa công việc trong Excel");
    });
  } catch (error) { showToast("Không thể xóa, Excel chưa sẵn sàng"); }
}

async function toggleTask(id) {
  const task = tasks.find((item) => item.id === Number(id)); if (!task) return;
  const status = task.status === "done" ? "todo" : "done";
  const checkBtn = document.querySelector(`.task-row[data-task-id="${id}"] .task-check`);
  if (checkBtn) checkBtn.classList.toggle("done", status === "done");
  try {
    await apiRequest(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await refreshFromServer(); showToast(status === "done" ? "Đã hoàn tất và lưu Excel" : "Đã mở lại công việc");
  } catch (error) { showToast("Không thể cập nhật, Excel chưa sẵn sàng"); }
}

$("#taskForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = { title: $("#taskTitle").value.trim(), description: $("#taskDescription").value.trim(), status: $("#taskStatus").value, priority: $("#taskPriority").value, due_date: $("#taskDueDate").value, category: $("#taskCategory").value, tags: $("#taskTags").value.trim(), created_time: new Date().toISOString(), completed_time: "" };
  if (!data.title) return;
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.classList.add("loading");
  try {
    if (editingId) {
      await apiRequest(`/api/tasks/${editingId}`, { method: "PATCH", body: JSON.stringify(data) });
      showToast("Đã cập nhật công việc trong Excel");
    } else {
      await apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(data) });
      showToast("Đã thêm công việc vào Excel");
    }
    closeModal(); await refreshFromServer();
  } catch (error) { showToast("Không thể lưu, hãy kiểm tra backend/Excel"); }
  finally { submitBtn.classList.remove("loading"); }
});

$("#taskModal").addEventListener("click", (event) => { if (event.target === $("#taskModal") || event.target.closest("[data-close-modal]")) closeModal(); });
$("#closeDrawer").addEventListener("click", closeDrawer);
$("#drawerScrim").addEventListener("click", closeDrawer);
$("#mobileNewTask").addEventListener("click", () => openModal());
$("#menuButton").addEventListener("click", () => { $(".sidebar").classList.contains("open") ? closeSidebar() : openSidebar(); });
$("#sidebarScrim").addEventListener("click", closeSidebar);
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]"); if (nav) switchView(nav.dataset.view);
  const boardAdd = event.target.closest("[data-board-add]"); if (boardAdd) { openModal(); $("#taskStatus").value = boardAdd.dataset.boardAdd; }
  const category = event.target.closest("[data-category]"); if (category) { activeCategory = category.dataset.category; switchView("tasks"); renderCategories(); renderTaskLists(); }
  const row = event.target.closest("[data-task-id]"); if (row) { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "toggle") toggleTask(row.dataset.taskId); if (action === "delete") deleteTask(row.dataset.taskId); if (action === "open" || (!action && !event.target.closest("button"))) openDrawer(row.dataset.taskId); }
  const drawerEdit = event.target.closest("[data-drawer-edit]"); if (drawerEdit) { closeDrawer(); openModal(tasks.find((task) => task.id === Number(drawerEdit.dataset.drawerEdit))); }
  const drawerDelete = event.target.closest("[data-drawer-delete]"); if (drawerDelete) deleteTask(drawerDelete.dataset.drawerDelete);
  if (event.target.closest(".sidebar") === null && !event.target.closest("#menuButton") && $(".sidebar").classList.contains("open") && window.innerWidth <= 760) closeSidebar();
});

$("#newTaskButton").addEventListener("click", () => openModal()); $("#newTaskButtonAlt").addEventListener("click", () => openModal()); $("#boardNewTask").addEventListener("click", () => openModal());
$("#boardFilterButton").addEventListener("click", () => { switchView("tasks"); $("#searchInput").focus(); });
$("#focusButton").addEventListener("click", () => { const id = $("#focusButton").dataset.taskId; if (id) openDrawer(id); });
$("#searchInput").addEventListener("input", renderTaskLists); $("#sortSelect").addEventListener("change", renderTaskLists);
$("#categoryFilter").addEventListener("change", (event) => { activeCategory = event.target.value; renderCategories(); renderTaskLists(); });
$$(".filter-pill").forEach((button) => button.addEventListener("click", () => { activeStatus = button.dataset.status; $$(".filter-pill").forEach((item) => item.classList.toggle("active", item === button)); renderTaskLists(); }));
$("#clearCompleted").addEventListener("click", async () => {
  const completed = tasks.filter((task) => task.status === "done");
  if (!completed.length) return showToast("Không có công việc đã xong");
  try {
    await Promise.all(completed.map((task) => apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" })));
    await refreshFromServer(); showToast(`Đã dọn ${completed.length} công việc trong Excel`);
  } catch (error) { showToast("Không thể dọn việc đã xong"); }
});

function downloadData() { const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "vieXLSX-tasks.json"; link.click(); URL.revokeObjectURL(link.href); showToast("Đã xuất dữ liệu JSON"); }
$("#exportButton").addEventListener("click", downloadData); $("#settingsExport").addEventListener("click", downloadData);
$("#refreshActivity").addEventListener("click", () => { renderOverview(); showToast("Đã làm mới hoạt động"); });
$("#addCategoryButton").addEventListener("click", () => { switchView("settings"); $("#newCategoryInput").focus(); });
async function saveConfig(patch) {
  appConfig = { ...appConfig, ...patch };
  try { await apiRequest("/api/config", { method: "POST", body: JSON.stringify(appConfig) }); showToast("Đã lưu cài đặt"); }
  catch (error) { showToast("Không thể lưu cài đặt"); }
}
$("#saveCategory").addEventListener("click", async () => { const input = $("#newCategoryInput"); const value = input.value.trim().toLowerCase(); if (value && !categories.includes(value)) { categories.push(value); input.value = ""; await saveConfig({ category_options: categories }); render(); } });
$("#languageSelect").addEventListener("change", (event) => { appConfig.language = event.target.value; applyLanguage(); render(); saveConfig({ language: appConfig.language }); });
$("#autosaveToggle").addEventListener("change", (event) => saveConfig({ autosave: event.target.checked }));
$("#activityToggle").addEventListener("change", (event) => { $(".activity-card").style.display = event.target.checked ? "" : "none"; saveConfig({ show_activity: event.target.checked }); });
$("#statsToggle").addEventListener("change", (event) => { $("#statsGrid").style.display = event.target.checked ? "" : "none"; saveConfig({ show_stats: event.target.checked }); });
$("#appNameInput").addEventListener("change", (event) => saveConfig({ app_name: event.target.value.trim() || "vieXLSX" }));
$("#usernameInput").addEventListener("change", (event) => { appConfig.username = event.target.value.trim() || "Kadu"; applyUsername(); saveConfig({ username: appConfig.username }); });
function applyLanguage() {
  const language = appConfig.language || "vi"; const text = translations[language];
  const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };
  const setAll = (selector, values) => $$(selector).forEach((element, index) => { if (values[index] !== undefined) element.textContent = values[index]; });
  const navLabels = { overview: text.overview, tasks: text.tasks, today: text.today, upcoming: text.upcoming, settings: text.settings };
  Object.entries(navLabels).forEach(([view, value]) => {
    $$(`.nav-item[data-view="${view}"] span:not(.nav-count)`).forEach((el) => { el.textContent = value; });
    $$(`.tab-item[data-view="${view}"] span`).forEach((el) => { el.textContent = value; });
  });
  setText(".section-label span", text.categories); setText("#breadcrumbTitle", text.overview);
  setText("#todayLabel", formatTodayLabel(language));
  setText("#overviewView h1", language === "en" ? "Welcome back, stay focused." : "Chào Kadu, tập trung nhé.");
  const intro = $("#overviewView .intro-copy"); if (intro) intro.textContent = language === "en" ? "A clear view of the work that matters today." : "Một góc nhìn rõ ràng cho những việc quan trọng nhất hôm nay.";
  setText("#focusButton .focus-copy span", text.focus); setText("#statsGrid .stat-card:nth-child(1) .stat-top span", text.progress); setText("#statsGrid .stat-card:nth-child(2) .stat-top span", text.active); setText("#statsGrid .stat-card:nth-child(3) .stat-top span", text.due); setText("#statsGrid .stat-card:nth-child(4) .stat-top span", text.weekDone);
  setText(".priority-card .eyebrow", text.attention); setText(".priority-card h2", text.priority); setText(".activity-card .eyebrow", text.activity); setText(".activity-card h2", text.activity); setText(".recent-card h2", text.recent);
  setText("#statsGrid .stat-card:nth-child(2) > p", language === "en" ? "tasks needing attention" : "việc cần bạn chú ý");
  setText(".priority-card .text-button", language === "en" ? "View all →" : "Xem tất cả →"); setText(".recent-card .text-button", language === "en" ? "Open list →" : "Mở danh sách →");
  setAll(".chart-labels span", language === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
  setText(".board-month", text.month); setText(".board-heading strong", text.board); setText(".board-subtitle", text.week); setText("#boardFilterButton", text.filter); setText("#boardNewTask", `+ ${text.create}`);
  setText("#tasksView h1", text.allTasks); setText("#tasksView .eyebrow", text.taskLibrary); setText("#tasksView .intro-copy", language === "en" ? "Manage, filter, and update all your work." : "Quản lý, lọc và cập nhật toàn bộ đầu việc của bạn."); setText("#searchInput", ""); $("#searchInput").placeholder = text.search; setText("#clearCompleted", text.clearDone); setAll(".task-columns span", ["", "", language === "en" ? "Task" : "Công việc", language === "en" ? "Due" : "Hạn", ""]);
  $$("#statusFilters .filter-pill").forEach((button) => { button.textContent = { all: text.all, todo: text.todo, in_progress: text.inProgress, done: text.done }[button.dataset.status]; });
  const sortLabels = language === "en" ? ["Highest priority", "Nearest due date", "Recently added", "Name A-Z"] : ["Ưu tiên cao nhất", "Hạn gần nhất", "Mới thêm", "Tên A-Z"];
  $$("#sortSelect option").forEach((option, index) => { option.textContent = sortLabels[index]; });
  setText("#settingsView h1", text.settingsTitle); setText("#settingsView .intro-copy", text.settingsIntro); setText("#settingsCategories + .add-inline button", text.add); setText("#settingsExport", text.export);
  const setSettingRow = (id, title, desc) => { const row = $(`#${id}`)?.closest(".setting-row"); if (!row) return; const h3 = row.querySelector("h3"); const p = row.querySelector("p"); if (h3) h3.textContent = title; if (p) p.textContent = desc; };
  setSettingRow("appNameInput", text.workspaceName, language === "en" ? "Shown in the desktop app." : "Tên hiển thị trên app desktop.");
  setSettingRow("usernameInput", "Username", language === "en" ? "Shown in the sidebar." : "Tên hiển thị ở sidebar.");
  setSettingRow("autosaveToggle", text.autosave, language === "en" ? "Save every change to the workbook." : "Lưu ngay mọi thay đổi vào workbook.");
  setSettingRow("activityToggle", text.showActivity, language === "en" ? "Hide the activity chart." : "Ẩn biểu đồ để giao diện nhẹ hơn.");
  setSettingRow("statsToggle", text.showStats, language === "en" ? "Hide overview statistics." : "Ẩn các thẻ số liệu ở tổng quan.");
  setSettingRow("settingsExport", language === "en" ? "Sync Excel" : "Đồng bộ Excel", language === "en" ? "Export a JSON backup." : "Xuất dữ liệu JSON khi cần backup.");
  setText("#todayView h1", text.today); setText("#todayView .intro-copy", text.todayIntro); setText("#upcomingView h1", text.upcoming); setText("#upcomingView .intro-copy", text.upcomingIntro);
  const fieldLabels = [text.title, text.description, text.status, text.priorityLabel, text.dueDate, text.category, text.tags]; $$("#taskForm .field span").forEach((label, index) => { const marker = label.querySelector("i"); const small = label.querySelector("small"); label.textContent = ""; if (marker) label.append(marker); label.append(document.createTextNode(fieldLabels[index] || "")); if (small) label.append(small); });
  $("#taskDescription").placeholder = language === "en" ? "Add some context..." : "Thêm một chút bối cảnh..."; $("#taskTitle").placeholder = language === "en" ? "Example: Prepare weekly report" : "Ví dụ: Chuẩn bị báo cáo tuần"; $("#taskTags").placeholder = language === "en" ? "important, meeting" : "important, meeting";
  setAll("#taskStatus option", [text.todo, text.inProgress, text.done]); setAll("#taskPriority option", language === "en" ? ["High", "Normal", "Low"] : ["Cao", "Bình thường", "Thấp"]);
  $("#newTaskButton").lastChild.textContent = ` ${text.newTask}`; $("#newTaskButtonAlt").lastChild.textContent = ` ${text.newTask}`;
  $("#languageSelect").value = language;
}
async function startApp() {
  try { appConfig = await apiRequest("/api/config"); categories = appConfig.category_options || categories; } catch (error) { appConfig = { language: "vi" }; }
  applyLanguage();
  $("#appNameInput").value = appConfig.app_name || "vieXLSX"; applyUsername();
  $("#autosaveToggle").checked = appConfig.autosave !== false; $("#activityToggle").checked = appConfig.show_activity !== false; $("#statsToggle").checked = appConfig.show_stats !== false;
  $(".activity-card").style.display = appConfig.show_activity === false ? "none" : ""; $("#statsGrid").style.display = appConfig.show_stats === false ? "none" : "";
  render(); await refreshFromServer(true); setInterval(() => refreshFromServer(), appConfig.autosave === false ? 5000 : 2000);
}
startApp();
