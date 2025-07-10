const express =  require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const crypto = require('crypto');
const app = express();
const port = 5000;
const prisma = require('./lib/prisma');
const bcrypt = require('bcrypt');
const isAuthenticated = require('./middleware/authMiddlware');
app.use(cors({
  origin: 'https://task-manager-server-sand.vercel.app', // or your deployed frontend URL
  credentials: true // Important for sending cookies
}));
app.use(express.json());
app.use(cookieParser())

const todoRoutes = require('./routes/todo');
app.use('/api/todos', todoRoutes);






app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
 

app.listen(port, async ()=>{
    console.log(`Server is running on http://localhost:${port}`);
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }


    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); 

    await prisma.session.create({
      data: {
        id: sessionToken, 
        userId: user.id,
        expires:expiresAt,
      },
    });


    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      expires: expiresAt,
      sameSite:'None'
    });

    return res.status(200).json({ message: 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/logout', async (req, res) => {
  const token = req.cookies?.session_token;

  if (!token) {
    return res.status(400).json({ error: 'No session token provided.' });
  }

  try {
    await prisma.session.delete({
      where: { id: token },
    });

    // Clear cookie
    res.clearCookie('session_token');

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
