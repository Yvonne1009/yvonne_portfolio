const tabs = document.querySelectorAll('.tabs button');
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const authCard = document.querySelector('#authCard');
const dashboard = document.querySelector('#dashboard');
const welcome = document.querySelector('#welcome');
let users = JSON.parse(localStorage.getItem('yvonne_users') || '[]');
if(!users.length){ users.push({name:'Demo User', email:'demo@mail.com', password:'123456'}); localStorage.setItem('yvonne_users', JSON.stringify(users)); }
function showDashboard(user){authCard.classList.add('hidden');dashboard.classList.remove('hidden');welcome.textContent=`歡迎回來，${user.name}！這裡可以延伸成會員中心或後台首頁。`;}
tabs.forEach(tab=>tab.onclick=()=>{tabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active');loginForm.classList.toggle('hidden',tab.dataset.tab!=='login');registerForm.classList.toggle('hidden',tab.dataset.tab!=='register');});
loginForm.onsubmit=e=>{e.preventDefault();const email=loginEmail.value.trim();const password=loginPassword.value;const user=users.find(u=>u.email===email&&u.password===password);loginMsg.textContent=user?'':'帳號或密碼錯誤，可試 demo@mail.com / 123456';if(user)showDashboard(user);};
registerForm.onsubmit=e=>{e.preventDefault();const name=regName.value.trim();const email=regEmail.value.trim();const password=regPassword.value;if(!name||!email||password.length<6){regMsg.textContent='請輸入姓名、Email，密碼至少 6 碼';return;}if(users.some(u=>u.email===email)){regMsg.textContent='這個 Email 已註冊';return;}users.push({name,email,password});localStorage.setItem('yvonne_users',JSON.stringify(users));regMsg.style.color='#2f7a45';regMsg.textContent='註冊成功，請切回登入';};
logout.onclick=()=>{dashboard.classList.add('hidden');authCard.classList.remove('hidden');};
