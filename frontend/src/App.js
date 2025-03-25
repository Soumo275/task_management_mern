import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // Import the CSS file

const BASE_URL = process.env.REACT_APP_BASE_URL;

function App() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUser(localStorage.getItem("user"));
            fetchTasks();
        }
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/tasks`, {
                headers: { Authorization: token },
            });
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching tasks", err);
        }
    };

    const handleRegister = async () => {
        if (!name || !password) {
            alert("Fields cannot be empty");
            return;
        }
        try {
            await axios.post(`${BASE_URL}/register`, { name, password });
            alert("Registration Successful!");
        } catch (err) {
            alert("User already exists");
        }
    };

    const handleLogin = async () => {
        if (!name || !password) {
            alert("Fields cannot be empty");
            return;
        }
        try {
            const res = await axios.post(`${BASE_URL}/login`, { name, password });
            setUser(res.data.name);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", res.data.name);
            fetchTasks();
        } catch (err) {
            alert("Invalid credentials");
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTasks([]);
    };

    const handleCreateTask = async () => {
        if (!title) {
            alert("Title cannot be empty");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${BASE_URL}/tasks`, { title, description }, {
                headers: { Authorization: token },
            });
            setTitle("");
            setDescription("");
            fetchTasks();
        } catch (err) {
            console.error("Error creating task", err);
        }
    };

    const handleMarkDone = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${BASE_URL}/tasks/${id}`, {}, {
                headers: { Authorization: token },
            });
            fetchTasks();
        } catch (err) {
            console.error("Error marking task as done", err);
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BASE_URL}/tasks/${id}`, {
                headers: { Authorization: token },
            });
            fetchTasks();
        } catch (err) {
            console.error("Error deleting task", err);
        }
    };

    return (
        <div className="container">
            {!user ? (
                <>
                    <h2>Register / Login</h2>
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="register-btn" onClick={handleRegister}>Register</button>
                    <button className="login-btn" onClick={handleLogin}>Login</button>
                </>
            ) : (
                <>
                    <h2>Welcome, {user}!</h2>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>

                    <h3>Create Task</h3>
                    <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <button className="register-btn" onClick={handleCreateTask}>Add Task</button>

                    <h3>Your Tasks</h3>
                    <div className="tasks-container">
                        {tasks.map((task) => (
                            <div key={task.id} className="task-card" style={{ backgroundColor: task.completed ? "#e6ffe6" : "#fff" }}>
                                <h4 className="task-title">{task.title}</h4>
                                <p className="task-description">{task.description || "No description provided."}</p>
                                <div className="task-actions">
                                    <button
                                        className="mark-done-btn"
                                        onClick={() => handleMarkDone(task.id)}
                                        disabled={task.completed}
                                    >
                                        {task.completed ? "Completed" : "Mark Done"}
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
