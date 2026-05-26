import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

// Decodifica o payload do JWT para obter o ID do usuário logado
function getUserId() {
  try {
    const token   = localStorage.getItem('token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? payload.sub ?? payload.userId ?? 'guest';
  } catch {
    return 'guest';
  }
}

function getInstallState(jogoId) {
  try {
    return localStorage.getItem(`install_${jogoId}`) || 'not_installed';
  } catch {
    return 'not_installed';
  }
}

function setInstallState(jogoId, state) {
  try {
    localStorage.setItem(`install_${jogoId}`, state);
  } catch {
    // silencioso
  }
}

function LibraryCard({ game }) {
  const [installState, setInstall] = useState(() => getInstallState(game.id));
  const [menuOpen, setMenuOpen]     = useState(false);
  const [progress, setProgress]     = useState(0);

  const handleInstall = () => {
    if (installState !== 'not_installed') return;
    setInstall('installing');
    setInstallState(game.id, 'installing');
    setProgress(0);

    const start    = Date.now();
    const duration = 7000;
    const tick = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setInstall('installed');
        setInstallState(game.id, 'installed');
      }
    }, 80);
  };

  const handleUninstall = () => {
    setInstall('not_installed');
    setInstallState(game.id, 'not_installed');
    setMenuOpen(false);
    setProgress(0);
  };

  return (
    <article className="lib-card">
      <Link to={`/game/${encodeURIComponent(game.nome)}`} className="lib-card-media">
        <span className="lib-card-icon">🎮</span>
        <span className="lib-card-category">{game.categoria || '—'}</span>
      </Link>

      <div className="lib-card-body">
        <Link to={`/game/${encodeURIComponent(game.nome)}`} className="item-name-link">
         <h3 className="lib-card-title">{game.nome}</h3>
        </Link>
        
        <p className="lib-card-meta">{game.empresa_nome || '—'}</p>

        <div className="lib-card-progress-wrap">
          <div
            className={`lib-card-progress-bar${installState === 'installing' ? ' installing' : ''}`}
            style={{
              width: installState === 'installed'
                ? '100%'
                : installState === 'installing'
                ? `${progress}%`
                : '0%',
            }}
          />
        </div>
      </div>

      <div className="lib-card-actions">
        {installState === 'not_installed' && (
          <button className="lib-btn lib-btn-install" onClick={handleInstall}>
            ⬇ Instalar
          </button>
        )}

        {installState === 'installing' && (
          <button className="lib-btn lib-btn-installing" disabled>
            <span className="lib-spinner" />
            Instalando… {Math.floor(progress)}%
          </button>
        )}

        {installState === 'installed' && (
          <>
            <button className="lib-btn lib-btn-play">▶ Jogar</button>

            <div className="lib-gear-wrap">
              <button
                className="lib-btn-gear"
                onClick={() => setMenuOpen(o => !o)}
                title="Opções"
              >
                ⚙
              </button>

              {menuOpen && (
                <div className="lib-gear-menu">
                  <button
                    className="lib-gear-item lib-gear-item--danger"
                    onClick={handleUninstall}
                  >
                    🗑 Desinstalar
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function Library() {
  const navigate = useNavigate();
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  const fetchLibrary = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const purchasedIds = JSON.parse(localStorage.getItem(`purchasedGameIds_${getUserId()}`) || '[]');

      if (purchasedIds.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      const [publicRes, authRes] = await Promise.all([
        api.get('/public/jogos'),
        api.get('/jogos'),
      ]);

      const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
      const authGames   = Array.isArray(authRes.data)   ? authRes.data   : (authRes.data?.jogos || []);

      const libraryGames = purchasedIds
        .map(id => {
          const authGame   = authGames.find(g => g.id === id);
          if (!authGame) return null;
          const publicGame = publicGames.find(g => g.nome === authGame.nome);
          return {
            ...authGame,
            categoria:    publicGame?.categoria    || '—',
            empresa_nome: publicGame?.empresa_nome || '—',
          };
        })
        .filter(Boolean);

      setGames(libraryGames);
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
     setTimeout(() => { 
      fetchLibrary();
    }, 0);
  }, [fetchLibrary]);

  const filtered = games.filter(g =>
    g.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="lib-loading">
        <span className="lib-loading-spinner" />
        <p>Carregando sua biblioteca…</p>
      </div>
    );
  }

  return (
    <main className="lib-container">
      <header className="lib-header">
        <div className="lib-header-top">
          <div>
            <h1 className="lib-title">Minha Biblioteca</h1>
            <p className="lib-desc">Gerencie sua coleção e inicie sua próxima aventura.</p>
          </div>
          <div className="lib-search-wrap">
            <span className="lib-search-icon">🔎</span>
            <input
              className="lib-search"
              type="text"
              placeholder="Buscar na biblioteca…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="lib-tabs">
          <button className="lib-tab active">
            Todos os jogos
            <span className="lib-tab-count">{games.length}</span>
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="lib-empty">
          <span className="lib-empty-icon">🎮</span>
          <h3>{search ? 'Nenhum jogo encontrado' : 'Sua biblioteca está vazia'}</h3>
          <p>
            {search
              ? 'Tente outros termos de busca.'
              : 'Explore a loja e compre seus primeiros jogos!'}
          </p>
          {!search && (
            <Link to="/" className="lib-empty-btn">Explorar a Loja</Link>
          )}
        </div>
      ) : (
        <div className="lib-grid">
          {filtered.map(game => (
            <LibraryCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Library;