<?php

namespace App\Services;

class TodoList
{
    private array $todos = [];

    /**
     * Todoを追加する
     */
    public function add(string $title): void
    {
        $this->todos[] = [
            'title' => $title,
            'completed' => false,
        ];
    }

    /**
     * 全てのTodoを取得する
     */
    public function getAll(): array
    {
        return $this->todos;
    }
}