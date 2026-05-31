const users = [
  {
    id: 1,
    name: "Yvonne Wu",
    email: "yvonne@example.com",
    role: "Admin",
    active: true,
    spent: 48600,
    joined: "2026-05-18",
  },
  {
    id: 2,
    name: "林明軒",
    email: "ming@example.com",
    role: "Editor",
    active: true,
    spent: 28900,
    joined: "2026-04-27",
  },
  {
    id: 3,
    name: "陳庭安",
    email: "ting@example.com",
    role: "Support",
    active: true,
    spent: 17400,
    joined: "2026-03-12",
  },
  {
    id: 4,
    name: "張浩宇",
    email: "hao@example.com",
    role: "Viewer",
    active: false,
    spent: 8200,
    joined: "2026-02-05",
  },
];

const orders = [
  { id: "ORD-1048", customer: "Yvonne Wu", amount: 6800, status: "待出貨" },
  { id: "ORD-1047", customer: "林明軒", amount: 4200, status: "付款確認" },
  { id: "ORD-1046", customer: "陳庭安", amount: 3200, status: "已完成" },
];

const activities = [
  "Yvonne Wu 更新系統權限",
  "林明軒 新增一筆訂單備註",
  "陳庭安 回覆客服訊息",
  "張浩宇 帳號已暫停使用",
];

const state = {
  keyword: "",
  filter: "all",
  sortKey: "name",
  sortDirection: 1,
};

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const tbody = document.querySelector("#tbody");
const keyword = document.querySelector("#keyword");
const emptyState = document.querySelector("#emptyState");
const memberForm = document.querySelector("#memberForm");
const memberId = document.querySelector("#memberId");
const nameInput = document.querySelector("#nameInput");
const emailInput = document.querySelector("#emailInput");
const roleInput = document.querySelector("#roleInput");
const statusInput = document.querySelector("#statusInput");
const spentInput = document.querySelector("#spentInput");
const formTitle = document.querySelector("#formTitle");
const toast = document.querySelector("#toast");

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getFilteredUsers() {
  return users
    .filter((user) => {
      const text = `${user.name} ${user.email} ${user.role}`.toLowerCase();
      const matchesKeyword = text.includes(state.keyword);
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "active" && user.active) ||
        (state.filter === "inactive" && !user.active) ||
        (state.filter === "admin" && user.role === "Admin");

      return matchesKeyword && matchesFilter;
    })
    .sort((a, b) => {
      const valueA = a[state.sortKey];
      const valueB = b[state.sortKey];

      if (typeof valueA === "number") {
        return (valueA - valueB) * state.sortDirection;
      }

      return String(valueA).localeCompare(String(valueB), "zh-Hant") * state.sortDirection;
    });
}

function renderUsers() {
  const rows = getFilteredUsers();

  tbody.innerHTML = rows
    .map(
      (user) => `
        <tr>
          <td>
            <div class="member">
              <span class="avatar">${getInitials(user.name)}</span>
              <div>
                <strong>${user.name}</strong>
                <span>加入日 ${user.joined}</span>
              </div>
            </div>
          </td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td><span class="badge ${user.active ? "" : "off"}">${user.active ? "啟用" : "停用"}</span></td>
          <td>${currency.format(user.spent)}</td>
          <td>
            <div class="row-actions">
              <button class="action-button" type="button" data-action="edit" data-id="${user.id}">編輯</button>
              <button class="action-button danger" type="button" data-action="delete" data-id="${user.id}">刪除</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  emptyState.hidden = rows.length > 0;
}

function renderMetrics() {
  const activeMembers = users.filter((user) => user.active).length;
  const revenue = users.reduce((sum, user) => sum + user.spent, 0);
  const pendingOrders = orders.filter((order) => order.status !== "已完成").length;

  document.querySelector("#revenueValue").textContent = currency.format(revenue);
  document.querySelector("#memberValue").textContent = String(activeMembers);
  document.querySelector("#pendingValue").textContent = String(pendingOrders);
}

function renderOrders() {
  document.querySelector("#orderList").innerHTML = orders
    .map(
      (order) => `
        <article class="order-item">
          <div>
            <strong>${order.id}</strong>
            <span>${order.customer}</span>
          </div>
          <div>
            <strong>${currency.format(order.amount)}</strong>
            <span>${order.status}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTimeline() {
  document.querySelector("#timeline").innerHTML = activities
    .map(
      (activity, index) => `
        <li>
          <strong>${activity}</strong>
          <p>${index + 1} 小時前</p>
        </li>
      `,
    )
    .join("");
}

function resetForm() {
  memberForm.reset();
  memberId.value = "";
  roleInput.value = "Viewer";
  statusInput.value = "active";
  spentInput.value = "0";
  formTitle.textContent = "新增會員";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderAll() {
  renderUsers();
  renderMetrics();
  renderOrders();
  renderTimeline();
}

keyword.addEventListener("input", (event) => {
  state.keyword = event.target.value.trim().toLowerCase();
  renderUsers();
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter.active").classList.remove("active");
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderUsers();
  });
});

document.querySelectorAll(".sort-button").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.sort;
    state.sortDirection = state.sortKey === key ? state.sortDirection * -1 : 1;
    state.sortKey = key;
    renderUsers();
  });
});

tbody.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return;

  if (button.dataset.action === "delete") {
    const [removed] = users.splice(index, 1);
    activities.unshift(`${removed.name} 已從會員清單移除`);
    renderAll();
    showToast("會員已刪除");
    return;
  }

  const user = users[index];
  memberId.value = user.id;
  nameInput.value = user.name;
  emailInput.value = user.email;
  roleInput.value = user.role;
  statusInput.value = user.active ? "active" : "inactive";
  spentInput.value = user.spent;
  formTitle.textContent = "編輯會員";
  nameInput.focus();
});

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: memberId.value ? Number(memberId.value) : Date.now(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    role: roleInput.value,
    active: statusInput.value === "active",
    spent: Number(spentInput.value),
    joined: new Date().toISOString().slice(0, 10),
  };

  const existingIndex = users.findIndex((user) => user.id === payload.id);

  if (existingIndex >= 0) {
    payload.joined = users[existingIndex].joined;
    users[existingIndex] = payload;
    activities.unshift(`${payload.name} 的會員資料已更新`);
    showToast("會員資料已更新");
  } else {
    users.unshift(payload);
    activities.unshift(`${payload.name} 已加入會員清單`);
    showToast("會員已新增");
  }

  resetForm();
  renderAll();
});

document.querySelector("#resetFormBtn").addEventListener("click", resetForm);

document.querySelector("#openFormBtn").addEventListener("click", () => {
  resetForm();
  nameInput.focus();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const lines = getFilteredUsers().map(
    (user) => `${user.name}, ${user.email}, ${user.role}, ${user.active ? "啟用" : "停用"}`,
  );
  console.info(["姓名, Email, 角色, 狀態", ...lines].join("\n"));
  showToast("目前清單已輸出到 Console");
});

resetForm();
renderAll();
