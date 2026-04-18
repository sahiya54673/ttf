import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiLogOut, FiUser } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <FiCheckSquare className="brand-icon" />
        <span>TaskFlow</span>
      </Link>

      {user && (
        <div className="navbar-actions">
          <Link to="/profile" className="user-badge" title="Open profile">
            <FiUser />
            <span>{user.name}</span>
          </Link>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
