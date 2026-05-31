const form = document.querySelector('#todoForm');
const input = document.querySelector('#todoInput');
const priorityInput = document.querySelector('#priorityInput');
const list = document.querySelector('#todoList');
const countText = document.querySelector('#countText');
const clearDone = document.querySelector('#clearDone');
const emptyState = document.querySelector('#emptyState');
const filterButtons = document.querySelectorAll('.filters button');

const priorityLabels = {
  high: '高優先',
  medium: '中優先',
  low: '低優先',
};

let todos = JSON.parse(localStorage.getItem('yvonne_todos') || '[]').map(todo => ({
  priority: 'medium',
  ...todo,
}));
let filter = 'all';

function save() {
  localStorage.setItem('yvonne_todos', JSON.stringify(todos));
}

function getShownTodos() {
  return todos.filter(todo => (
    filter === 'all' ||
    (filter === 'active' && !todo.done) ||
    (filter === 'done' && todo.done)
  ));
}

function updateSummary() {
  const activeCount = todos.filter(todo => !todo.done).length;
  countText.textContent = `${todos.length} 個任務，${activeCount} 個未完成`;
}

function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item priority-${todo.priority} ${todo.done ? 'done' : ''}`;

  const content = document.createElement('div');
  content.className = 'todo-content';

  const checkbox = document.createElement('button');
  checkbox.className = 'status-button';
  checkbox.type = 'button';
  checkbox.textContent = todo.done ? '✓' : '';
  checkbox.setAttribute('aria-label', todo.done ? '標示為未完成' : '標示為完成');
  checkbox.addEventListener('click', () => {
    todo.done = !todo.done;
    save();
    render();
  });

  const textWrap = document.createElement('div');
  textWrap.className = 'todo-text-wrap';

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.text;

  const meta = document.createElement('span');
  meta.className = 'todo-meta';
  meta.textContent = priorityLabels[todo.priority];

  textWrap.append(text, meta);
  content.append(checkbox, textWrap);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = '編輯';
  editButton.addEventListener('click', () => {
    const nextText = window.prompt('修改任務內容', todo.text);
    if (!nextText) return;

    const trimmedText = nextText.trim();
    if (!trimmedText) return;

    todo.text = trimmedText;
    save();
    render();
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = '刪除';
  deleteButton.addEventListener('click', () => {
    todos = todos.filter(item => item.id !== todo.id);
    save();
    render();
  });

  actions.append(editButton, deleteButton);
  li.append(content, actions);

  return li;
}

function render() {
  list.innerHTML = '';

  const shownTodos = getShownTodos();
  shownTodos.forEach(todo => {
    list.appendChild(createTodoItem(todo));
  });

  emptyState.hidden = shownTodos.length > 0;
  clearDone.disabled = todos.every(todo => !todo.done);
  updateSummary();
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  todos.unshift({
    id: Date.now(),
    text,
    priority: priorityInput.value,
    done: false,
  });

  input.value = '';
  priorityInput.value = 'medium';
  input.focus();
  save();
  render();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  });
});

clearDone.addEventListener('click', () => {
  todos = todos.filter(todo => !todo.done);
  save();
  render();
});

render();
