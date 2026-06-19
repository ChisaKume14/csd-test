import './bootstrap';

// CSRFトークンをAxiosのデフォルトヘッダーに設定
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const loadingEl = document.getElementById('loading');
    const emptyStateEl = document.getElementById('empty-state');
    
    // フィルターボタン
    const filterAllBtn = document.getElementById('filter-all');
    const filterActiveBtn = document.getElementById('filter-active');
    const filterCompletedBtn = document.getElementById('filter-completed');
    
    // カウンター
    const countAllEl = document.getElementById('count-all');
    const countActiveEl = document.getElementById('count-active');
    const countCompletedEl = document.getElementById('count-completed');

    // アプリ状態
    let todos = [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'

    // APIからデータを取得
    async function fetchTodos() {
        showLoading(true);
        try {
            const response = await window.axios.get('/api/todos');
            todos = response.data;
            render();
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            alert('データの読み込みに失敗しました。接続状況を確認してください。');
        } finally {
            showLoading(false);
        }
    }

    // タスクを追加
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (!title) return;

        // ボタンのローディング状態
        const submitBtn = todoForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        try {
            const response = await window.axios.post('/api/todos', { title });
            const newTodo = response.data;
            
            // 状態の更新
            todos.unshift(newTodo);
            todoInput.value = '';
            
            // 描画 & アニメーション適用用の関数
            render(newTodo.id);
        } catch (error) {
            console.error('タスクの追加に失敗しました:', error);
            alert('タスクの追加に失敗しました。入力内容を確認してください。');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    // タスクの完了状態の切り替え
    async function toggleTodo(id, completed) {
        try {
            const response = await window.axios.patch(`/api/todos/${id}`, { completed });
            const updatedTodo = response.data;
            
            // 状態の更新
            todos = todos.map(t => t.id === id ? updatedTodo : t);
            
            // リストの要素を直接アニメーション
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                const textEl = el.querySelector('.todo-title');
                const checkboxEl = el.querySelector('input[type="checkbox"]');
                
                checkboxEl.checked = updatedTodo.completed;
                if (updatedTodo.completed) {
                    textEl.classList.add('line-through', 'text-slate-500');
                    textEl.classList.remove('text-slate-200');
                    el.classList.add('bg-slate-950/40');
                    el.classList.remove('bg-slate-900/40');
                } else {
                    textEl.classList.remove('line-through', 'text-slate-500');
                    textEl.classList.add('text-slate-200');
                    el.classList.remove('bg-slate-950/40');
                    el.classList.add('bg-slate-900/40');
                }
            }
            
            updateCounters();
            
            // もし現在のフィルターに合わなくなったら非表示にする（少し遅延させて滑らかに）
            if (currentFilter !== 'all') {
                setTimeout(() => {
                    render();
                }, 400);
            }
        } catch (error) {
            console.error('タスクの更新に失敗しました:', error);
            alert('タスクの更新に失敗しました。');
            render(); // ロールバックのために再描画
        }
    }

    // タスクの削除
    async function deleteTodo(id) {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (!el) return;

        // 削除前アニメーション
        el.classList.add('opacity-0', 'translate-x-4', 'scale-95');
        el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        try {
            await window.axios.delete(`/api/todos/${id}`);
            
            // アニメーション完了後にDOMから削除し、状態を更新
            setTimeout(() => {
                todos = todos.filter(t => t.id !== id);
                render();
            }, 300);
        } catch (error) {
            console.error('タスクの削除に失敗しました:', error);
            alert('タスクの削除に失敗しました。');
            el.classList.remove('opacity-0', 'translate-x-4', 'scale-95');
        }
    }

    // UIの描画
    function render(highlightId = null) {
        // カウンターの更新
        updateCounters();

        // フィルター適用
        const filtered = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        // リスト表示の制御
        if (filtered.length === 0) {
            todoList.innerHTML = '';
            emptyStateEl.classList.remove('hidden');
            return;
        }
        emptyStateEl.classList.add('hidden');

        // リスト構築
        todoList.innerHTML = filtered.map(todo => {
            const isCompleted = todo.completed;
            const isNew = todo.id === highlightId;
            
            return `
                <li 
                    data-id="${todo.id}" 
                    class="group flex items-center justify-between p-4 rounded-2xl border border-slate-800/60 transition-all duration-300 ${
                        isCompleted ? 'bg-slate-950/40' : 'bg-slate-900/40'
                    } ${isNew ? 'opacity-0 scale-95 -translate-y-2' : ''}"
                >
                    <div class="flex items-center gap-4 flex-1">
                        <label class="relative flex items-center justify-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                class="sr-only peer"
                                ${isCompleted ? 'checked' : ''}
                                data-action="toggle"
                            >
                            <span class="w-6 h-6 rounded-lg border-2 border-slate-700 bg-slate-950 peer-checked:bg-gradient-to-br peer-checked:from-indigo-500 peer-checked:to-purple-500 peer-checked:border-transparent transition-all duration-300 flex items-center justify-center">
                                <svg class="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                        </label>
                        <span class="todo-title text-sm md:text-base transition-all duration-300 break-all select-none ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }">
                            ${escapeHtml(todo.title)}
                        </span>
                    </div>
                    <button 
                        data-action="delete"
                        class="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        title="タスクを削除"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </li>
            `;
        }).join('');

        // イベントのデリゲーション
        const items = todoList.querySelectorAll('li');
        items.forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // トグル処理
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                toggleTodo(id, e.target.checked);
            });

            // 削除処理
            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => {
                deleteTodo(id);
            });

            // 新規追加要素のアニメーション実行
            if (id === highlightId) {
                // requestAnimationFrame を利用してクラス適用をトリガー
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        item.classList.remove('opacity-0', 'scale-95', '-translate-y-2');
                        item.classList.add('opacity-100', 'scale-100', 'translate-y-0');
                    }, 50);
                });
            }
        });
    }

    // カウンターの集計とUI更新
    function updateCounters() {
        const total = todos.length;
        const active = todos.filter(t => !t.completed).length;
        const completed = total - active;

        countAllEl.textContent = total;
        countActiveEl.textContent = active;
        countCompletedEl.textContent = completed;
    }

    // ローディング表示切り替え
    function showLoading(show) {
        if (show) {
            loadingEl.classList.remove('hidden');
        } else {
            loadingEl.classList.add('hidden');
        }
    }

    // HTMLエスケープ（XSS対策）
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // フィルターの切り替え
    function setFilter(filter) {
        currentFilter = filter;
        
        // アクティブボタンのスタイル制御
        [filterAllBtn, filterActiveBtn, filterCompletedBtn].forEach(btn => {
            btn.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-500');
            btn.classList.add('text-slate-400', 'hover:text-slate-200');
        });

        let activeBtn;
        if (filter === 'all') activeBtn = filterAllBtn;
        else if (filter === 'active') activeBtn = filterActiveBtn;
        else if (filter === 'completed') activeBtn = filterCompletedBtn;

        activeBtn.classList.remove('text-slate-400', 'hover:text-slate-200');
        activeBtn.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-500');

        render();
    }

    filterAllBtn.addEventListener('click', () => setFilter('all'));
    filterActiveBtn.addEventListener('click', () => setFilter('active'));
    filterCompletedBtn.addEventListener('click', () => setFilter('completed'));

    // 初期データのロード
    fetchTodos();
});
