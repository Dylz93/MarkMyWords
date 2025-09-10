import React, { useState, useEffect, useRef } from "react";
import localforage from "localforage";

const STORAGE_KEY = "MarkMyWords_DB";

localforage.config({
  name: "MarkMyWordsDB",
  storeName: "markmywords_store",
});

export default function MarkMyWordsApp() {
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [dark, setDark] = useState(true);
  const [db, setDb] = useState({ users: [], grades: [], classes: [], learners: [], tasks: [], annotations: [] });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const canvasRef = useRef(null);
  const [colour, setColour] = useState("red");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  useEffect(() => {
    const loadDB = async () => {
      const stored = await localforage.getItem(STORAGE_KEY);
      if (stored) setDb(stored);
      else {
        const initial = { users: [{ id: 1, username: 'Dylan', password: '54852' }], grades: [], classes: [], learners: [], tasks: [], annotations: [] };
        await localforage.setItem(STORAGE_KEY, initial);
        setDb(initial);
      }
    };
    loadDB();
  }, []);

  useEffect(() => {
    localforage.setItem(STORAGE_KEY, db);
  }, [db]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleLogin = (e) => {
    e.preventDefault();
    const found = db.users.find(u => u.username === usernameInput && u.password === passwordInput);
    if (found) setUser(found);
    else alert("Invalid credentials");
  };

  const handleLogout = () => setUser(null);

  const saveAnnotation = (taskId, path) => {
    setDb(prev => ({ ...prev, annotations: [...prev.annotations, { id: Date.now(), taskId, path }] }));
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setCurrentPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const drawing = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => {
      const newPath = [...prev, { x, y }];
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
      return newPath;
    });
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (selectedTaskId && currentPath.length) saveAnnotation(selectedTaskId, currentPath);
    setCurrentPath([]);
  };

  const LoginCard = () => (
    <div className="max-w-md mx-auto mt-20 bg-white dark:bg-black dark:text-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-center text-red-600">MarkMyWords</h2>
      <form onSubmit={handleLogin}>
        <label>Username</label>
        <input value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <label>Password</label>
        <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <button type="submit" className="w-full bg-red-600 text-white p-2 rounded">Log in</button>
      </form>
    </div>
  );

  return (
    <div className={`min-h-screen ${dark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {!user ? <LoginCard /> : 
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-red-600">Dashboard</h1>
            <button onClick={handleLogout} className="bg-red-600 text-white p-2 rounded">Logout</button>
          </div>
          <div className="mb-4">
            <label className="mr-2">Theme:</label>
            <button onClick={() => setDark(prev => !prev)} className="bg-red-600 text-white px-2 rounded">Toggle Dark/Light</button>
          </div>
          <canvas ref={canvasRef} width={800} height={600} className="border" 
            onMouseDown={startDraw} onMouseMove={drawing} onMouseUp={endDraw} onMouseLeave={endDraw}></canvas>
          <div className="mt-4">
            <label>Colour:</label>
            <select value={colour} onChange={e => setColour(e.target.value)} className="ml-2">
              <option value="red">Red</option>
              <option value="black">Black</option>
            </select>
          </div>
        </div>
      }
    </div>
  );
}
