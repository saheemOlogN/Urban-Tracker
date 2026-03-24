import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="navbar-title">{title}</div>
      </div>
      <div className="navbar-actions">
        {user && (
          <span className="navbar-email">
            {user.email}
          </span>
        )}
      </div>
    </div>
  );
}
