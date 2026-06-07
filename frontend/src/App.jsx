import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './index.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  // We'll point this to our backend. Since we will eventually deploy via NGINX,
  // we can use relative paths or configurable env variables. For now, we assume
  // local development on port 3000.
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      
      setTasks(prev => prev.map(t => 
        t.id.toString() === draggableId ? { ...t, status: newStatus } : t
      ));

      try {
        const res = await fetch(`${API_URL}/tasks/${draggableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          fetchTasks();
        }
      } catch (err) {
        console.error(err);
        fetchTasks();
      }
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="app-container">
      <header className="header">
        <h1>Task Manager</h1>
        <p>DevOps Practice Application</p>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="input-group">
          <textarea
            placeholder="Add a description (optional)"
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <button type="submit" className="btn-primary">Add Task</button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          <div className="kanban-column">
            <h2>Pending</h2>
            <Droppable droppableId="pending">
              {(provided) => (
                <div 
                  className="task-list"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {loading && pendingTasks.length === 0 ? (
                    <p style={{ textAlign: 'center' }}>Loading tasks...</p>
                  ) : pendingTasks.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending tasks.</p>
                  ) : (
                    pendingTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                          >
                            <div className="task-content">
                              <h3>{task.title}</h3>
                              {task.description && <p>{task.description}</p>}
                            </div>
                            <div className="task-actions">
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => deleteTask(task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="kanban-column">
            <h2>Completed</h2>
            <Droppable droppableId="completed">
              {(provided) => (
                <div 
                  className="task-list"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {loading && completedTasks.length === 0 ? (
                    <p style={{ textAlign: 'center' }}>Loading tasks...</p>
                  ) : completedTasks.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No completed tasks.</p>
                  ) : (
                    completedTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                          >
                            <div className="task-content">
                              <h3>{task.title}</h3>
                              {task.description && <p>{task.description}</p>}
                            </div>
                            <div className="task-actions">
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => deleteTask(task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;
