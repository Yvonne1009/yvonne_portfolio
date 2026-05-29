const form = document.querySelector('#todoForm');
const input = document.querySelector('#todoInput');
const list = document.querySelector('#todoList');
const countText = document.querySelector('#countText');
const clearDone = document.querySelector('#clearDone');
const filterButtons = document.querySelectorAll('.filters button');
let todos = JSON.parse(localStorage.getItem('yvonne_todos') || '[]');
let filter = 'all';

function save(){ localStorage.setItem('yvonne_todos', JSON.stringify(todos)); }
function render(){
  list.innerHTML = '';
  const shown = todos.filter(t => filter === 'all' || (filter === 'active' && !t.done) || (filter === 'done' && t.done));
  shown.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.done ? 'done' : ''}`;
    li.innerHTML = `<span>${todo.text}</span><div class="actions"><button data-act="toggle">${todo.done ? '還原' : '完成'}</button><button data-act="delete">刪除</button></div>`;
    li.querySelector('[data-act="toggle"]').onclick = () => { todo.done = !todo.done; save(); render(); };
    li.querySelector('[data-act="delete"]').onclick = () => { todos = todos.filter(t => t.id !== todo.id); save(); render(); };
    list.appendChild(li);
  });
  countText.textContent = `${todos.length} 個任務，${todos.filter(t=>!t.done).length} 個未完成`;
}
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  todos.unshift({ id: Date.now(), text, done:false });
  input.value=''; save(); render();
});
filterButtons.forEach(btn => btn.onclick = () => {
  filterButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); filter = btn.dataset.filter; render();
});
clearDone.onclick = () => { todos = todos.filter(t => !t.done); save(); render(); };
render();
