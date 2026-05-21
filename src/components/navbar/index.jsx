import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';
import iconCLT from '../../assets/img/icon_clt.png'; // Verifique se o caminho do ícone está correto
import api from '../../services/api';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
 
  //barra de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleSearchSubmit = () => {
    if (searchTerm.trim().length > 0) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Tema do site
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Encerrar sessão
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('cartCount');
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    navigate('/');
  }

  // Retorna as iniciais do usuário logado para o avatar visual (provisório)
  const getInitials = (fullName) => {
    if (!fullName) return "??";
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

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
  }, []); // ignorar "erro"

  // Monitora o estado inicial de autenticação e o tema visual
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

  // Fecha o menu suspenso do perfil ao clicar em qualquer área fora dele
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
        {/* Ícone de Menu Hamburguer para telas Mobile */}
        <div 
          className="mobile-menu-icon" 
          id="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✖' : '☰'}
        </div>
       
        {/* Logotipo Oficial */}
        <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <img src={iconCLT} alt="Ícone CLT Gaming" />
          <span>CLT</span> Gaming
        </Link>
      
        {/* Barra de Pesquisa */}
        <div className="search-bar">

        <input type="text" placeholder="Buscar jogos..." 
        value={searchTerm}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
          const value = e.target.value;
          setSearchTerm(value);

      // Só busca na API se o usuário digitar pelo menos 2 caracteres
      if (value.trim().length >= 2) {
        api.get('/public/jogos')
          .then((response) => {
            const filtrados = response.data.filter(jogo => 
              jogo.nome.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(filtrados.slice(0, 5)); // Mostra no máximo 5 sugestões rápidas
            setIsSearchOpen(true);
          })
          .catch((err) => console.error("Erro na busca rápida:", err));
      } else {
        setIsSearchOpen(false);
      }
    }}
    onBlur={() => {
      // Pequeno timeout para dar tempo do clique no link do menu funcionar antes dele sumir
      setTimeout(() => setIsSearchOpen(false), 200);
    }}
    onFocus={() => {
      if (searchTerm.trim().length >= 2) setIsSearchOpen(true);
    }}
  />
  
  {/* AQUI ESTÁ A CORREÇÃO: Adicionado o onClick={handleSearchSubmit} no ícone da lupa */}
  <span className="search-icon" onClick={handleSearchSubmit}>🔎</span>

  {/* Menu Flutuante de Sugestões Rápidas */}
  {isSearchOpen && searchResults.length > 0 && (
    <div className="search-dropdown">
      {searchResults.map((jogo) => (
        <Link 
          key={jogo.id} 
          to={`/game/${jogo.id}`} // Rota futura para página do jogo
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

        {/* Links Principais de Navegação */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-item active" onClick={() => setIsMobileMenuOpen(false)}>Loja</Link>
          <Link to="/library" className="navbar-item" onClick={() => setIsMobileMenuOpen(false)}>Biblioteca</Link>
          <Link to="/rankings" className="navbar-item" onClick={() => setIsMobileMenuOpen(false)}>Rankings</Link>
        </div>
      </div>

      {/* Seção lateral direita da navbar */}
      <div className="navbar-actions">
        {/* Botão de Alternância de Tema */}
        <div className="action-icon" onClick={toggleTheme} title="Alternar Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </div>

        {isLoggedIn ? (
          <>
            {/* Exibe o botão de Painel Administrativo caso o perfil possua a permissão */}
            {isAdmin && (
              <Link to="/admin" className="navbar-item admin">Painel ADM</Link>
            )}

            {/* Ícone de Notificações */}
            <div className="action-icon notification" id="nav-notification">
              🔔 <span className="badge-notification">0</span>
            </div>

            {/* Link direcionado para o Carrinho de Compras */}
            <Link to="/cart" className="cart-btn">
              <div className="action-icon cart" id="nav-cart">
                🛒 <span className="badge-cart">{localStorage.getItem('cartCount') || 0}</span>
              </div>
            </Link>

            {/* Menu de Perfil do Usuário */}
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
                <Link to="/payments" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Métodos de pagamento</Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>Finalizar sessão</button>
              </div>

              )}
              
            </div>
          </>
        ) : (
          /* Estado Visual Deslogado */
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