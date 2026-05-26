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
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  const [cartCount, setCartCount] = useState(parseInt(localStorage.getItem('cartCount')) || 0);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Encerrar sessão
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('cartCount');
    setCartCount(0); // Zera o contador visualmente
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    navigate('/');
  }

  // Retorna as iniciais do usuário logado para o avatar visual
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
      .catch((err) => console.error("Erro ao buscar quantidade do carrinho:", err));
    }
  }, []);

  // Processa o token JWT para recuperar os dados do usuário logado
  const processToken = useCallback((token) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      
      setUser({ nome: decodedPayload.nome, perfil: decodedPayload.perfil });
      setIsLoggedIn(true);
      setIsAdmin(decodedPayload.perfil === 'Administrador' || decodedPayload.perfil === 'Admin');
    } catch (error) {
      console.error("Erro ao ler o token", error);
      handleLogout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isLoggedIn) {
        setTimeout(() =>{
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
    if (isLoggedIn) {
      fetchCartCount();
    }
  }, [isLoggedIn, fetchCartCount]);

  
  useEffect(() => {
    window.addEventListener('cartUpdated', fetchCartCount);
    return () => window.removeEventListener('cartUpdated', fetchCartCount);
  }, [fetchCartCount]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                .catch((err) => console.error("Erro na busca rápida:", err));
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
          <Link to="/rankings" className={`navbar-item ${location.pathname === '/rankings' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Rankings</Link>
          <Link to="/categorias" className={`navbar-item ${location.pathname === '/categorias' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Categorias</Link>
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

            <div className="action-icon notification" id="nav-notification">
              🔔 <span className="badge-notification">0</span>
            </div>

           
            <Link to="/cart" className="cart-btn">
              <div className="action-icon cart" id="nav-cart">
                🛒 <span className="badge-cart">{cartCount}</span>
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