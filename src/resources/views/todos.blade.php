<!DOCTYPE html>
<html lang="ja" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>TaskFlow — プレミアム・タスク管理</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <style>
        body {
            font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
        }
        /* カスタムのスクロールバー */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.6);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.3);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.5);
        }
    </style>
</head>
<body class="h-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">

    <!-- 背景装飾のグラデーションオーブ -->
    <div class="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none z-0"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none z-0"></div>

    <!-- メインコンテンツ -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-24">
        <div class="w-full max-w-xl">
            
            <!-- ヘッダー -->
            <div class="text-center mb-10">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-3">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    MySQL Database Persistence
                </div>
                <h1 class="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                    TaskFlow
                </h1>
                <p class="text-slate-400 mt-2 text-sm md:text-base font-light">
                    データを安全に永続化する、洗練されたタスク管理システム
                </p>
            </div>

            <!-- アプリカード -->
            <div class="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-950/20">
                
                <!-- 新規追加フォーム -->
                <form id="todo-form" class="flex gap-2 mb-8">
                    <div class="relative flex-1">
                        <input 
                            type="text" 
                            id="todo-input"
                            placeholder="新しくタスクを追加しますか？" 
                            class="w-full px-5 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 transition-all duration-300 text-sm md:text-base"
                            required
                            maxlength="255"
                        >
                    </div>
                    <button 
                        type="submit"
                        class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer"
                    >
                        <span>追加</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </form>

                <!-- フィルタータブ -->
                <div class="flex border-b border-slate-800/80 pb-3 mb-6 gap-6 text-sm font-medium">
                    <button id="filter-all" class="text-indigo-400 border-b-2 border-indigo-500 pb-2 px-1 transition-all duration-200 cursor-pointer">
                        すべて (<span id="count-all">0</span>)
                    </button>
                    <button id="filter-active" class="text-slate-400 hover:text-slate-200 pb-2 px-1 transition-all duration-200 cursor-pointer">
                        未完了 (<span id="count-active">0</span>)
                    </button>
                    <button id="filter-completed" class="text-slate-400 hover:text-slate-200 pb-2 px-1 transition-all duration-200 cursor-pointer">
                        完了 (<span id="count-completed">0</span>)
                    </button>
                </div>

                <!-- ローディング状態 -->
                <div id="loading" class="flex flex-col items-center justify-center py-12 text-slate-500">
                    <svg class="animate-spin h-8 w-8 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-xs tracking-wider">データを読み込み中...</p>
                </div>

                <!-- 空状態 -->
                <div id="empty-state" class="hidden flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                    <div class="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 mb-4 text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408-.67 1.947a.75.75 0 0 1-1.397-.133l-1.976-6.108a.75.75 0 0 1 .414-.946L5.3 8.35a.75.75 0 0 1 .946.414l1.976 6.108A.75.75 0 0 1 7.8 15.82z" />
                        </svg>
                    </div>
                    <h3 class="text-slate-300 font-semibold mb-1">タスクがありません</h3>
                    <p class="text-xs max-w-xs leading-relaxed">新しいタスクを追加して、今日の作業を始めましょう。</p>
                </div>

                <!-- タスクリスト -->
                <ul id="todo-list" class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    <!-- JavaScriptで動的生成 -->
                </ul>

            </div>

            <!-- フッター情報 -->
            <div class="text-center mt-6 text-xs text-slate-600">
                <p>MySQL + Laravel でデータは永続的に保護されています。</p>
            </div>
        </div>
    </main>

    <!-- フッター -->
    <footer class="relative z-10 py-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm text-center text-xs text-slate-500">
        <p>© 2026 TaskFlow. All rights reserved.</p>
    </footer>

</body>
</html>
