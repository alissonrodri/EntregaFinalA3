import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import iconCLT from '../../assets/img/icon_clt.png'; 
import api from '../../services/api';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [cartCount, setCartCount] = useState(parseInt(localStorage.getItem('cartCount')) || 0);
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('clt_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('clt_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleSearchSubmit = () => {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };
  
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('cartCount');
    localStorage.removeItem('clt_notifications');
    sessionStorage.removeItem('welcomeShown'); 
    setCartCount(0);
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    setNotifications([]);
    navigate('/');
  }

  const getInitials = (fullName) => {
    if (!fullName) return "??";
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };
  
  const fetchCartCount = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/carrinho/ativo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data.message === 'Carrinho vazio.' || !res.data.carrinho) {
          setCartCount(0);
          localStorage.setItem('cartCount', 0);
        } else {
          const count = res.data.carrinho.itens ? res.data.carrinho.itens.length : 0;
          setCartCount(count);
          localStorage.setItem('cartCount', count);
        }
      })
      .catch((err) => console.error(err));
    }
  }, []);

  const processToken = useCallback((token) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      
      setUser({ nome: decodedPayload.nome, perfil: decodedPayload.perfil });
      setIsLoggedIn(true);
      setIsAdmin(decodedPayload.perfil === 'Administrador' || decodedPayload.perfil === 'Admin');
    } catch (error) {
      console.error(error);
      handleLogout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isLoggedIn) {
        setTimeout(() => {
            processToken(token);
        }, 0);
    }

    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [processToken, theme, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchCartCount();
  }, [isLoggedIn, fetchCartCount]);

  useEffect(() => {
    const handleNotify = (e) => {
      const newNotif = {
        id: Date.now(),
        text: e.detail.text,
        link: e.detail.link || null,
        read: false,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setNotifications(prev => [newNotif, ...prev]);
    };

    window.addEventListener('cartUpdated', fetchCartCount);
    window.addEventListener('notify', handleNotify);
    
    return () => {
      window.removeEventListener('cartUpdated', fetchCartCount);
      window.removeEventListener('notify', handleNotify);
    };
  }, [fetchCartCount]);

  useEffect(() => {
    if (isLoggedIn && user?.nome) {
      const welcomeShown = sessionStorage.getItem('welcomeShown');
      if (!welcomeShown) {
        window.dispatchEvent(new CustomEvent('notify', {
          detail: { text: `Bem-vindo (a) de volta, ${user.nome}! 🎮`, link: '/' }
        }));
        sessionStorage.setItem('welcomeShown', 'true');
      }
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationHover = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleNotificationClick = (notif) => {
    handleNotificationHover(notif.id);
    setIsNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
      
        <div 
          className="mobile-menu-icon" 
          id="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✖' : '☰'}
        </div>
    
        <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <img src={iconCLT} alt="Ícone CLT Gaming" />
          <span>CLT</span> Gaming
        </Link>
      
        <div className="search-bar">
          <input type="text" placeholder="Buscar jogos..." 
            value={searchTerm}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);

            if (value.trim().length >= 1) {
              api.get('/public/jogos')
                .then((response) => {
                  const filtrados = response.data.filter(jogo => 
                    jogo.nome.toLowerCase().includes(value.toLowerCase())
                  );
                  setSearchResults(filtrados.slice(0, 5)); 
                  setIsSearchOpen(true);
                })
                .catch((err) => console.error(err));
            } else {
              setIsSearchOpen(false);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsSearchOpen(false), 200);
          }}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) setIsSearchOpen(true);
          }}
        />
        
        <span className="search-icon" onClick={handleSearchSubmit}>🔎</span>

        {isSearchOpen && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map((jogo) => (
              <Link 
                key={jogo.id} 
                to={`/game/${encodeURIComponent(jogo.nome)}`} 
                className="search-dropdown-item"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchOpen(false);
                }}
              >
                <span className="search-item-icon">🎮</span>
                <div className="search-item-info">
                  <p className="search-item-name">{jogo.nome}</p>
                  <p className="search-item-category">{jogo.categoria}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Loja</Link>
          <Link to="/library" className={`navbar-item ${location.pathname === '/library' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Biblioteca</Link>
          <Link to="/categorias" className={`navbar-item ${location.pathname === '/categorias' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Categorias</Link>
          <Link to="/rankings" className={`navbar-item ${location.pathname === '/rankings' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Rankings</Link>          
        </div>
      </div>

      <div className="navbar-actions">
        
        <div className="action-icon" onClick={toggleTheme} title="Alternar Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </div>

        {isLoggedIn ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="navbar-item admin">Painel ADM</Link>
            )}

            <div className="notification-container" ref={notifRef}>
              <div 
                className={`action-icon notification ${unreadCount > 0 ? 'has-items' : ''}`} 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                🔔 {unreadCount > 0 && <span className="badge-notification">{unreadCount}</span>}
              </div>

              {isNotifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <p className="notif-title">Notificações</p>
                    <div className="notif-actions">
                      {unreadCount > 0 && (
                        <span className="notif-action-btn" onClick={markAllAsRead}>Marcar como lidas</span>
                      )}
                      {notifications.length > 0 && (
                        <span className="notif-action-btn clear" onClick={clearNotifications}>Limpar notificações</span>
                      )}
                    </div>
                  </div>
                  <div className="notif-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">Nenhuma notificação nova</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notif-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          onMouseEnter={() => handleNotificationHover(notif.id)}
                        >
                          <div className="notif-item-text">{notif.text}</div>
                          <div className="notif-item-time">{notif.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/cart" className="cart-btn">
              <div className={`action-icon cart ${cartCount > 0 ? 'has-items' : ''}`} id="nav-cart">
                🛒 {cartCount > 0 && <span className="badge-cart">{cartCount}</span>}
              </div>
            </Link>

            <div className="user-profile" ref={menuRef}>
              <span className="user-avatar" id="avatar-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {getInitials(user?.nome)}
              </span>
              
              {isMenuOpen && (
                <div className={`user-dropdown ${isMenuOpen ? 'active' : ''}`} id="user-dropdown">
                <div className="dropdown-header">
                  <p className="user-name">{user?.nome || 'Usuário'}</p>
                  {isAdmin && <p className="user-role">{user?.perfil}</p>}
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/history" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Histórico de compras</Link>
                <Link to="/wishlist" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Lista de desejos</Link>
                <Link to="/edit-profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Editar conta</Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>Finalizar sessão</button>
              </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/signup" className="btn-signup">Criar conta</Link>
            <Link to="/login" className="btn-login">Entrar</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;