const STORAGE_KEY = "yvonne_expense_records";
const BUDGET_KEY = "yvonne_monthly_budget";

const sampleRecords = [
  {
    id: 1716984000001,
    date: new Date().toISOString().slice(0, 8) + "03",
    type: "income",
    category: "薪資",
    amount: 48000,
    account: "銀行",
    note: "五月薪資",
  },
  {
    id: 1716984000002,
    date: new Date().toISOString().slice(0, 8) + "05",
    type: "expense",
    category: "居家",
    amount: 12800,
    account: "轉帳",
    note: "房租",
  },
  {
    id: 1716984000003,
    date: new Date().toISOString().slice(0, 8) + "11",
    type: "expense",
    category: "餐飲",
    amount: 2450,
    account: "信用卡",
    note: "外食與咖啡",
  },
  {
    id: 1716984000004,
    date: new Date().toISOString().slice(0, 8) + "16",
    type: "expense",
    category: "交通",
    amount: 980,
    account: "悠遊卡",
    note: "通勤儲值",
  },
];

let records = loadRecords();
let editingId = null;

const $ = (selector) => document.querySelector(selector);
const formatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return formatter.format(Number(value) || 0);
}

function loadRecords() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (Array.isArray(saved)) return normalizeRecords(saved);

  const legacy = JSON.parse(localStorage.getItem("yvonne_records") || "null");
  if (Array.isArray(legacy) && legacy.length) return normalizeRecords(legacy);

  return sampleRecords;
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function normalizeRecords(list) {
  return list.map((record) => ({
    id: record.id || Date.now() + Math.random(),
    date: record.date || today(),
    type: record.type === "income" ? "income" : "expense",
    category: record.category || "未分類",
    amount: Number(record.amount) || 0,
    account: record.account || "",
    note: record.note || "",
  }));
}

function getBudget() {
  return Number(localStorage.getItem(BUDGET_KEY) || 0);
}

function getFilters() {
  return {
    month: $("#monthFilter").value,
    type: $("#typeFilter").value,
    search: $("#searchInput").value.trim().toLowerCase(),
  };
}

function filteredRecords() {
  const filters = getFilters();
  return records
    .filter((record) => !filters.month || record.date.startsWith(filters.month))
    .filter((record) => filters.type === "all" || record.type === filters.type)
    .filter((record) => {
      if (!filters.search) return true;
      return [record.category, record.note, record.account]
        .join(" ")
        .toLowerCase()
        .includes(filters.search);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

function sumByType(list, type) {
  return list
    .filter((record) => record.type === type)
    .reduce((sum, record) => sum + Number(record.amount), 0);
}

function renderSummary(list) {
  const income = sumByType(list, "income");
  const expense = sumByType(list, "expense");
  const incomeCount = list.filter((record) => record.type === "income").length;
  const expenseCount = list.filter((record) => record.type === "expense").length;
  const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const selectedMonth = $("#monthFilter").value || currentMonth();
  const daysInMonth = new Date(
    Number(selectedMonth.slice(0, 4)),
    Number(selectedMonth.slice(5, 7)),
    0
  ).getDate();

  $("#income").textContent = money(income);
  $("#expense").textContent = money(expense);
  $("#balance").textContent = money(income - expense);
  $("#dailyAverage").textContent = money(Math.round(expense / daysInMonth));
  $("#incomeCount").textContent = `${incomeCount} 筆收入`;
  $("#expenseCount").textContent = `${expenseCount} 筆支出`;
  $("#savingRate").textContent = `儲蓄率 ${savingRate}%`;
  $("#savingRate").className = savingRate >= 20 ? "healthy" : savingRate < 0 ? "warning" : "";
}

function renderBudget(list) {
  const budget = getBudget();
  const expense = sumByType(list, "expense");
  const percent = budget > 0 ? Math.min(Math.round((expense / budget) * 100), 100) : 0;
  const remaining = budget - expense;

  $("#budgetAmount").textContent = budget > 0 ? money(budget) : "未設定";
  $("#budgetInput").value = budget || "";
  $("#budgetBar").style.width = `${percent}%`;
  $("#budgetBar").style.background = percent >= 90 ? "var(--red)" : percent >= 70 ? "var(--gold)" : "var(--green)";

  if (!budget) {
    $("#budgetHint").textContent = "設定每月預算後可追蹤使用率";
    $("#budgetHint").className = "";
    return;
  }

  $("#budgetHint").textContent =
    remaining >= 0
      ? `已用 ${percent}%，剩餘 ${money(remaining)}`
      : `已超支 ${money(Math.abs(remaining))}`;
  $("#budgetHint").className = remaining >= 0 ? "healthy" : "warning";
}

function renderChart(list) {
  const expenses = list.filter((record) => record.type === "expense");
  const totals = expenses.reduce((result, record) => {
    result[record.category] = (result[record.category] || 0) + Number(record.amount);
    return result;
  }, {});
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((row) => row[1]), 1);
  const total = rows.reduce((sum, row) => sum + row[1], 0);

  $("#chartTotal").textContent = `支出 ${money(total)}`;
  $("#categoryChart").innerHTML = rows.length
    ? rows
        .map(([category, amount]) => {
          const width = Math.max(Math.round((amount / max) * 100), 6);
          const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
          return `
            <div class="bar-row">
              <div class="bar-meta">
                <strong>${escapeHtml(category)}</strong>
                <span>${money(amount)} · ${percent}%</span>
              </div>
              <div class="bar"><span style="width:${width}%"></span></div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty"><strong>尚無支出資料</strong><span>新增支出後會顯示分類比例。</span></div>`;
}

function renderRecords(list) {
  $("#recordCount").textContent = `${list.length} 筆`;
  $("#records").innerHTML = "";
  $("#emptyState").classList.toggle("hidden", list.length > 0);

  list.forEach((record) => {
    const item = document.createElement("li");
    item.className = "record";
    item.innerHTML = `
      <div class="record-main">
        <strong>${record.type === "income" ? "收入" : "支出"}</strong>
        <p>${escapeHtml(record.category)}${record.note ? `：${escapeHtml(record.note)}` : ""}</p>
        <small>${record.date} · ${escapeHtml(record.account || "未指定帳戶")}</small>
      </div>
      <div class="record-actions">
        <span class="amount ${record.type === "income" ? "plus" : "minus"}">
          ${record.type === "income" ? "+" : "-"}${money(record.amount)}
        </span>
        <div class="actions">
          <button class="icon-btn" type="button" data-action="edit" data-id="${record.id}" title="編輯">編輯</button>
          <button class="icon-btn" type="button" data-action="delete" data-id="${record.id}" title="刪除">刪除</button>
        </div>
      </div>
    `;
    $("#records").appendChild(item);
  });
}

function render() {
  const list = filteredRecords();
  renderSummary(list);
  renderBudget(list);
  renderChart(list);
  renderRecords(list);
}

function resetForm() {
  editingId = null;
  $("#recordForm").reset();
  $("#date").value = today();
  $("#type").value = "expense";
  $("#formTitle").textContent = "新增紀錄";
  $("#submitBtn").textContent = "新增紀錄";
  $("#cancelEditBtn").classList.add("hidden");
}

function fillForm(record) {
  editingId = record.id;
  $("#date").value = record.date;
  $("#type").value = record.type;
  $("#category").value = record.category;
  $("#amount").value = record.amount;
  $("#account").value = record.account || "";
  $("#note").value = record.note || "";
  $("#formTitle").textContent = "編輯紀錄";
  $("#submitBtn").textContent = "儲存變更";
  $("#cancelEditBtn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function upsertRecord(event) {
  event.preventDefault();

  const amount = Number($("#amount").value);
  const nextRecord = {
    id: editingId || Date.now(),
    date: $("#date").value,
    type: $("#type").value,
    category: $("#category").value.trim(),
    amount,
    account: $("#account").value.trim(),
    note: $("#note").value.trim(),
  };

  if (!nextRecord.date || !nextRecord.category || amount <= 0) {
    alert("請確認日期、分類與金額都已正確填寫。");
    return;
  }

  records = editingId
    ? records.map((record) => (record.id === editingId ? nextRecord : record))
    : [nextRecord, ...records];

  saveRecords();
  resetForm();
  render();
}

function handleRecordAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const record = records.find((item) => item.id === id);

  if (button.dataset.action === "edit" && record) {
    fillForm(record);
  }

  if (button.dataset.action === "delete") {
    records = records.filter((item) => item.id !== id);
    saveRecords();
    render();
  }
}

function saveBudget() {
  const budget = Math.max(Number($("#budgetInput").value) || 0, 0);
  localStorage.setItem(BUDGET_KEY, String(budget));
  render();
}

function exportCsv() {
  const list = filteredRecords();
  const header = ["日期", "類型", "分類", "金額", "帳戶", "備註"];
  const rows = list.map((record) => [
    record.date,
    record.type === "income" ? "收入" : "支出",
    record.category,
    record.amount,
    record.account || "",
    record.note || "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expense-records-${$("#monthFilter").value || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  $("#recordForm").addEventListener("submit", upsertRecord);
  $("#records").addEventListener("click", handleRecordAction);
  $("#saveBudgetBtn").addEventListener("click", saveBudget);
  $("#exportBtn").addEventListener("click", exportCsv);
  $("#cancelEditBtn").addEventListener("click", resetForm);
  ["monthFilter", "typeFilter", "searchInput"].forEach((id) => {
    $(`#${id}`).addEventListener("input", render);
  });
}

$("#monthFilter").value = currentMonth();
$("#date").value = today();
bindEvents();
saveRecords();
render();
