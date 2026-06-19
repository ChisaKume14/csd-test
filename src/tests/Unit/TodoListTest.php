<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use App\Services\TodoList;

class TodoListTest extends TestCase
{
    /**
     * Todoを追加できることをテストする
     */
    #[Test]
    public function it_can_add_a_todo()
    {
        // Arrange
        $todoList = new TodoList();

        // Act
        $todoList->add('買い物に行く');

        // Assert
        $todos = $todoList->getAll();
        $this->assertCount(1, $todos);
        $this->assertEquals('買い物に行く', $todos[0]['title']);
    }
}