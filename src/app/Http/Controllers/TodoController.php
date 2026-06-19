<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    /**
     * Display the SPA dashboard.
     */
    public function index()
    {
        return view('todos');
    }

    /**
     * Get all todos in JSON format.
     */
    public function getTodos()
    {
        return response()->json(Todo::orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created todo.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'sometimes|required|in:TODO,Inprogress,Instack,Done',
        ]);

        $todo = Todo::create([
            'title' => $validated['title'],
            'status' => $validated['status'] ?? 'TODO',
        ]);

        return response()->json($todo, 201);
    }

    /**
     * Update the specified todo.
     */
    public function update(Request $request, Todo $todo)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|in:TODO,Inprogress,Instack,Done',
        ]);

        $todo->update($validated);

        return response()->json($todo);
    }

    /**
     * Remove the specified todo.
     */
    public function destroy(Todo $todo)
    {
        $todo->delete();
        return response()->json(['success' => true]);
    }
}
