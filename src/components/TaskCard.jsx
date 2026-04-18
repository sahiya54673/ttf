import { useState, useEffect } from 'react';
import { FiEdit3, FiTrash2, FiCalendar, FiBell } from 'react-icons/fi';
import './TaskCard.css';

const priorityConfig = {
  low: { label: 'Low', className: 'priority-low' },
  medium: { label: 'Medium', className: 'priority-medium' },
  high: { label: 'High', className: 'priority-high' },
};

const statusConfig = {
  pending: { label: 'Pending', emoji: '⏳', className: 'status-pending' },
  'in-progress': { label: 'In Progress', emoji: '🚧', className: 'status-progress' },
  completed: { label: 'Completed', emoji: '✅', className: 'status-completed' },
};

const TaskCard = ({ task, onUpdate, onDelete, onTaskClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  });

  useEffect(() => {
    if (!isEditing) {
      setEditData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    }
  }, [task, isEditing]);

  const handleSave = () => {
    onUpdate(task._id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  if (isEditing) {
    return (
      <div className="task-card editing">
        <input
          className="edit-input edit-title"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          placeholder="Task title"
        />
        <textarea
          className="edit-input edit-desc"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
        />
        <div className="edit-row">
          <select
            className="edit-select"
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
          >
            <option value="pending">⏳ Pending</option>
            <option value="in-progress">🚧 In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>
          <select
            className="edit-select"
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            className="edit-input edit-date"
            value={editData.dueDate}
            onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
          />
        </div>
        <div className="edit-actions">
          <button className="btn-save" onClick={handleSave}>Save</button>
          <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`task-card ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      onClick={() => onTaskClick?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTaskClick?.(task);
        }
      }}
      title="Click to view task alert"
    >
      <div className="task-header">
        <div className="task-meta">
          <span className={`badge ${statusConfig[task.status]?.className || 'status-pending'}`}>
            <span className="status-emoji" aria-hidden="true">
              {statusConfig[task.status]?.emoji || '⏳'}
            </span>
            {statusConfig[task.status]?.label || 'Pending'}
          </span>
          <span className={`badge ${priorityConfig[task.priority]?.className || 'priority-medium'}`}>
            {priorityConfig[task.priority]?.label || 'Medium'}
          </span>
        </div>
        <div className="task-actions">
          <button
            className="icon-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Edit Task"
          >
            <FiEdit3 />
          </button>
          <button
            className="icon-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            title="Delete"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-footer">
        {task.dueDate && (
          <div className={`task-due ${isOverdue ? 'overdue-text' : ''}`}>
            <FiCalendar />
            <span>{formatDate(task.dueDate)}</span>
            {isOverdue && <span className="overdue-label">Overdue</span>}
          </div>
        )}
        {task.reminderTime && (
          <div className="task-reminder">
            <FiBell />
            <span>{new Date(task.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default TaskCard;
