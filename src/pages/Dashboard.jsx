import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { FiPlus, FiSearch, FiFilter, FiMic, FiBell } from 'react-icons/fi';
import pendingTaskImage from '../assets/task-pending.svg';
import progressTaskImage from '../assets/task-progress.svg';
import completedTaskImage from '../assets/task-completed.svg';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [alert, setAlert] = useState(null);
  const [taskPopup, setTaskPopup] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [isRecording, setIsRecording] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    reminderTime: '',
    isVoiceTask: false,
  });

  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    fallback;

  const popupConfig = {
    pending: {
      image: pendingTaskImage,
      title: '⏳ Pending Task',
      note: 'This task is waiting to be started.',
    },
    'in-progress': {
      image: progressTaskImage,
      title: '🚧 In Progress Task',
      note: 'Great momentum! Keep going.',
    },
    completed: {
      image: completedTaskImage,
      title: '✅ Completed Task',
      note: 'Awesome! This one is done.',
    },
  };

  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5); // Beep for 0.5s
    } catch (e) {
      console.error('Audio context error:', e);
    }
  };

  // Alarm Monitoring Logic
  const checkReminders = useCallback(() => {
    const now = new Date().getTime();
    tasks.forEach(task => {
      if (task.reminderTime && task.status !== 'completed') {
        const reminderDate = new Date(task.reminderTime).getTime();
        // Trigger alarm if within the last 60 seconds and hasn't been acknowledged
        if (now >= reminderDate && now <= reminderDate + 60000) {
          if (!window.sessionStorage.getItem(`alarm_${task._id}`)) {
            window.sessionStorage.setItem(`alarm_${task._id}`, 'true');
            
            // Play Beep Sound
            playAlarmSound();

            // Simple visual/audio feedback
            const msg = `⏰ ALARM: ${task.title} is due now!`;
            setAlert({ type: 'success', message: msg });
            
            // Voice announcement
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(msg);
              window.speechSynthesis.speak(utterance);
            }
          }
        }
      }
    });
  }, [tasks]);


  useEffect(() => {
    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkReminders]);

  useEffect(() => {
    if (!alert) return undefined;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    if (!taskPopup) return undefined;
    const timer = setTimeout(() => setTaskPopup(null), 3500);
    return () => clearTimeout(timer);
  }, [taskPopup]);

  const fetchTasks = async () => {
    try {
      setErrorMessage('');
      const { data } = await API.get('/tasks', { params: filters });
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
      setErrorMessage(getErrorMessage(error, 'Could not load tasks. Please try again.'));
      setAlert({ type: 'error', message: `⚠️ ${getErrorMessage(error, 'Could not load tasks.')}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [filters]);

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAlert({ type: 'error', message: 'Voice recognition not supported in this browser.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          // Use interim results to show live feedback
          const interim = event.results[i][0].transcript;
          setNewTask(prev => ({ ...prev, title: interim, isVoiceTask: true }));
        }
      }
      if (finalTranscript) {
        setNewTask(prev => ({ ...prev, title: finalTranscript, isVoiceTask: true }));
      }
    };



    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      
      let msg = 'Microphone error: ' + event.error;
      if (event.error === 'not-allowed') {
        msg = '⚠️ Microphone permission denied. Please click the "Camera/Mic" icon in your address bar and allow access.';
      } else if (event.error === 'network') {
        msg = '⚠️ Network error during voice recognition.';
      } else if (event.error === 'no-speech') {
        msg = '⚠️ No speech detected. Please try again.';
      }
      
      setAlert({ type: 'error', message: msg });
    };


    recognition.start();
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        status: newTask.status,
        priority: newTask.priority,
        isVoiceTask: newTask.isVoiceTask,
      };

      if (newTask.dueDate) payload.dueDate = newTask.dueDate;
      if (newTask.reminderTime) payload.reminderTime = newTask.reminderTime;

      const { data } = await API.post('/tasks', payload);
      setTasks((prev) => [data, ...prev]);
      setErrorMessage('');
      setAlert({ type: 'success', message: '✅ Task added successfully!' });
      setShowAdd(false);
      setNewTask({ 
        title: '', 
        description: '', 
        status: 'pending', 
        priority: 'medium', 
        dueDate: '', 
        reminderTime: '', 
        isVoiceTask: false 
      });
    } catch (error) {
      console.error('Error adding task', error);
      setErrorMessage(getErrorMessage(error, 'Could not add task.'));
      setAlert({ type: 'error', message: `⚠️ ${getErrorMessage(error, 'Could not add task.')}` });
    }
  };

  const handleUpdateTask = async (id, updatedData) => {
    try {
      const { data } = await API.put(`/tasks/${id}`, updatedData);
      setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
      setErrorMessage('');
      setAlert({ type: 'success', message: '🚧 Task updated successfully!' });
    } catch (error) {
      console.error('Error updating task', error);
      setErrorMessage(getErrorMessage(error, 'Could not update task.'));
      setAlert({ type: 'error', message: `⚠️ ${getErrorMessage(error, 'Could not update task.')}` });
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setErrorMessage('');
      setAlert({ type: 'success', message: '🗑️ Task deleted successfully!' });
    } catch (error) {
      console.error('Error deleting task', error);
      setErrorMessage(getErrorMessage(error, 'Could not delete task.'));
      setAlert({ type: 'error', message: `⚠️ ${getErrorMessage(error, 'Could not delete task.')}` });
    }
  };

  const handleTaskClick = (task) => {
    const config = popupConfig[task.status] || popupConfig.pending;
    setTaskPopup({
      image: config.image,
      title: config.title,
      message: `Task: ${task.title}`,
      note: config.note,
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}</h1>
        <button className="btn-add" onClick={() => setShowAdd(!showAdd)}>
          <FiPlus />
          <span>New Task</span>
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="in-progress">🚧 In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {alert && <div className={`alert-banner ${alert.type}`}>{alert.message}</div>}
      {taskPopup && (
        <div className="task-popup" role="alert" aria-live="polite">
          <button className="task-popup-close" onClick={() => setTaskPopup(null)} aria-label="Close alert">
            ×
          </button>
          <img src={taskPopup.image} alt={taskPopup.title} className="task-popup-image" />
          <h3>{taskPopup.title}</h3>
          <p>{taskPopup.message}</p>
          <small>{taskPopup.note}</small>
        </div>
      )}
      {errorMessage && <div className="empty-state">{errorMessage}</div>}

      {showAdd && (
        <form className="add-task-form" onSubmit={handleAddTask}>
          <div className="voice-input-container">
            <input
              type="text"
              className="add-input add-title"
              placeholder="What needs to be done?"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value, isVoiceTask: false })}
              required
            />
            <button 
              type="button" 
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={startVoiceRecognition}
              title="Dictate task title"
            >
              <FiMic />
            </button>
          </div>
          <textarea
            className="add-input add-desc"
            placeholder="Details (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={2}
          />
          <div className="add-row">
            <select
              className="add-select"
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
            >
              <option value="pending">⏳ Pending</option>
              <option value="in-progress">🚧 In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>

            <select
              className="add-select"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <div className="date-input-group">
              <label>Due Date</label>
              <input
                type="date"
                className="add-input add-date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>

            <div className="date-input-group">
              <label><FiBell /> Set Alarm</label>
              <input
                type="datetime-local"
                className="add-input add-date"
                value={newTask.reminderTime}
                onChange={(e) => setNewTask({ ...newTask, reminderTime: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-save btn-add-submit">Create Task</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          No tasks found matching your criteria.
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
