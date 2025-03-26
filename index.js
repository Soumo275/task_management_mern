require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Debugging: Log frontend URL
console.log("Allowed Frontend URL:", process.env.FRONTEND_URL);

// CORS Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL, // Allow requests only from your frontend
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // Allow cookies & authentication headers
    })
);


// Handle Preflight Requests
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Change '*' to specific frontend URL in production
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.status(200).json({});
    }
    next();
});

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// Schema Definitions
const userSchema = new mongoose.Schema({
    name: String,
    password: String,
});

const taskSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    title: String,
    description: String,
    completed: { type: Boolean, default: false },
    user: String,
});

const User = mongoose.model("User", userSchema);
const Task = mongoose.model("Task", taskSchema);

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.name;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// Routes
app.get("/", (req, res) => {
    res.send("API is running...");
});


// Register User
app.post("/register", async (req, res) => {
    const { name, password } = req.body;
    try {
        const existingUser = await User.findOne({ name });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

app.post("/login", async (req, res) => {
    const { name, password } = req.body;
    console.log("Login request received:", name);  // Log user name

    try {
        const user = await User.findOne({ name });
        console.log("User lookup result:", user);  // Log DB response

        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);  // Log password check

        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("Token generated:", token);  // Log token generation

        res.json({ token, name: user.name });
    } catch (error) {
        console.error("Error logging in:", error);  // Log error details
        res.status(500).json({ message: "Error logging in", error });
    }
});


// Get User's Tasks
app.get("/tasks", authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tasks", error });
    }
});

// Create Task
app.post("/tasks", authenticate, async (req, res) => {
    const { title, description } = req.body;
    try {
        const newTask = new Task({ title, description, completed: false, user: req.user });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: "Error creating task", error });
    }
});

// Update Task
app.put("/tasks/:id", authenticate, async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { id: req.params.id, user: req.user },
            { completed: true },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
});

// Delete Task
app.delete("/tasks/:id", authenticate, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ id: req.params.id, user: req.user });
        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task", error });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
