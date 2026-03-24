import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Building2,
  GraduationCap,
  Receipt,
  ClipboardList,
  Users,
  LogOut,
  Star,
  Brain,
  Stethoscope,
  Trophy,
  X,
} from 'lucide-react';

const citizenLinks = [
  { to: '/citizen', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/citizen/file-complaint', icon: FileText, label: 'File Complaint' },
  { to: '/citizen/hospitals', icon: Building2, label: 'Hospital Status' },
  { to: '/citizen/appointments', icon: Stethoscope, label: 'Book Appointment' },
  { to: '/citizen/schools', icon: GraduationCap, label: 'School Status' },
  { to: '/citizen/quotations', icon: Receipt, label: 'Quotations' },
  { to: '/citizen/reviews', icon: Star, label: 'Review Work' },
  { to: '/citizen/top-servants', icon: Trophy, label: 'Top Servants' },
];

const workerLinks = [
  { to: '/worker', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/complaints', icon: ClipboardList, label: 'Assigned Tasks' },
];

const supervisorLinks = [
  { to: '/supervisor', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/supervisor/complaints', icon: ClipboardList, label: 'All Complaints' },
  { to: '/supervisor/workers', icon: Users, label: 'Workers' },
  { to: '/supervisor/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/supervisor/schools', icon: GraduationCap, label: 'Schools' },
  { to: '/supervisor/predictions', icon: Brain, label: 'ML Predictions' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  let links = citizenLinks;
  if (user.role === 'worker') links = workerLinks;
  if (user.role === 'supervisor') links = supervisorLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Urban Tracker</h1>
            {/* Close button — only visible on mobile */}
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <span>Ratnagiri Municipal Hub</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/citizen' || link.to === '/worker' || link.to === '/supervisor'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={handleLinkClick}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
