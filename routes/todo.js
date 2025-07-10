
const isAuthenticated = require('../middleware/authMiddlware');
const prisma = require('../lib/prisma')
const express = require('express');
const router = express.Router();
// Create a new todo
router.post('/', isAuthenticated, async (req, res) => {
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required.' });

  try {
    const todo = await prisma.todo.create({
      data: {
        title,
        userId: req.user.id,
      },
    });
    res.status(201).json(todo);
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// Get all todos for authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(todos);
  } catch (err) {
    console.error('Read todos error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.patch('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo || todo.userId !== req.user.id) {
      return res.status(404).json({ error: 'Todo not found.' });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        isCompleted: !todo.isCompleted,
      },
    });

    res.json(updatedTodo);
  } catch (err) {
    console.error('Toggle todo error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// Delete a todo
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await prisma.todo.deleteMany({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (todo.count === 0) {
      return res.status(404).json({ error: 'Todo not found.' });
    }

    res.json({ message: 'Todo deleted.' });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
