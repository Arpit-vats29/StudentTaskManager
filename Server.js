const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database
const db = new DatabaseSync("tasks.db");

// Create tasks table
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER DEFAULT 0
    )
`);

// Get all tasks
app.get("/api/tasks", (req, res) => {
    try {
        const tasks = db
            .prepare("SELECT * FROM tasks ORDER BY id DESC")
            .all();

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});

// Add a task
app.post("/api/tasks", (req, res) => {
    try {
        const { title, subject, dueDate, priority } = req.body;

        if (!title || !subject || !dueDate || !priority) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO tasks
                (title, subject, dueDate, priority)
                VALUES (?, ?, ?, ?)
            `)
            .run(title, subject, dueDate, priority);

        const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(result.lastInsertRowid);

        res.status(201).json(task);

    } catch (error) {
        res.status(500).json({
            message: "Failed to add task"
        });
    }
});

// Update a task
app.put("/api/tasks/:id", (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, dueDate, priority } = req.body;

        if (!title || !subject || !dueDate || !priority) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const result = db
            .prepare(`
                UPDATE tasks
                SET title = ?,
                    subject = ?,
                    dueDate = ?,
                    priority = ?
                WHERE id = ?
            `)
            .run(title, subject, dueDate, priority, id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(id);

        res.json(task);

    } catch (error) {
        res.status(500).json({
            message: "Failed to update task"
        });
    }
});

// Mark task as completed or pending
app.patch("/api/tasks/:id/status", (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        const result = db
            .prepare(`
                UPDATE tasks
                SET completed = ?
                WHERE id = ?
            `)
            .run(completed ? 1 : 0, id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(id);

        res.json(task);

    } catch (error) {
        res.status(500).json({
            message: "Failed to update task status"
        });
    }
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
    try {
        const { id } = req.params;

        const result = db
            .prepare("DELETE FROM tasks WHERE id = ?")
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete task"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Student Task Manager running on port ${PORT}`);
});
