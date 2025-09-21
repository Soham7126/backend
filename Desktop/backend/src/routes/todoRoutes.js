const express = require('express');
const Todo = require('../models/Todo');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all todos for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create a new todo
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const todo = new Todo({
      userId: req.user.id,
      title,
      description,
      status: status || 'not-started'
    });

    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update a todo
router.patch('/:id', protect, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (title) todo.title = title;
    if (description) todo.description = description;
    if (status) todo.status = status;

    await todo.save();
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/:id', protect, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;