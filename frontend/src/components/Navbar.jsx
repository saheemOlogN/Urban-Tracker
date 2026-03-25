import { useState, useEffect, useRef } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 60s
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(s => s.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) {
        navigate(link);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="navbar-title">{title}</div>
      </div>
      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
        {user && (
          <>
            <div className="notification-bell-container" ref={dropdownRef}>
              <button 
                className="notification-bell-btn" 
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showDropdown && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && <span className="badge badge-accent">{unreadCount} new</span>}
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          className={`notification-item ${!n.isRead ? 'notification-item-unread' : ''}`}
                          onClick={() => markAsRead(n._id, n.link)}
                        >
                          <div className="notification-item-title">{n.title}</div>
                          <div className="notification-item-message">{n.message}</div>
                          <div className="notification-item-time">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">No notifications yet</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="navbar-email">
              {user.email}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
