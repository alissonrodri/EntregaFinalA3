import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Sidebar from '../../components/sidebarCategories';
import './index.css';

const ICON_MAP = {
  'RPG': '🐲',
  'Ação': '⚔️',
  'Aventura': '🗺️',
  'Social': '👥',
  'Sandbox': '🧱',
  'Plataforma': '🏃',
  'Puzzle': '🧩',
  'Horror': '👻',
  'Tiro': '🎯',
  'Simulação': '🚜',
  'VR': '🥽',
};

const CURRENT_YEAR = new Date().getFullYear();

function getUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? payload.sub ?? payload.userId ?? null;
  } catch (err) {
    console.warn(err.message);
    return null;
  }
}

function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('categoria') || ''
  );
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [yearRange, setYearRange] = useState([2000, CURRENT_YEAR]);

  const [allGames, setAllGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  const [cartItems, setCartItems] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [addedItems, setAddedItems] = useState({});
  const [avgRatings, setAvgRatings] = useState({});

  const userId = getUserId();
  const purchasedIds = JSON.parse(localStorage.getItem(`purchasedGameIds_${userId}`) || '[]');

  useEffect(() => {
    const token = localStorage.getItem('token');

    api.get('/public/jogos')
      .then(async ({ data }) => {
        let gamesWithId = [...data];

        if (token) {
          try {
            const [authResponse, cartRes, wishRes] = await Promise.all([
              api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } }),
              api.get('/carrinho/ativo', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => {
                console.warn(err.message);
                return { data: {} };
              }),
              api.get('/lista-desejo', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => {
                console.warn(err.message);
                return { data: [] };
              })
            ]);

            const authGamesList = Array.isArray(authResponse.data) ? authResponse.data : (authResponse.data.jogos || []);
            
            gamesWithId = data.map(gPublic => {
              const match = authGamesList.find(gAuth => gAuth.nome === gPublic.nome);
              return match ? { ...gPublic, id: match.id } : gPublic;
            });

            const cData = cartRes.data?.carrinho?.itens || [];
            setCartItems(new Set(cData.map(i => i.fkJogo)));

            const wData = Array.isArray(wishRes.data) ? wishRes.data : [];
            setWishlistItems(new Set(wData.map(i => i.id || i.fkJogo)));

            const ratingsMap = {};
            await Promise.all(gamesWithId.map(async (g) => {
              if (!g.id) return;
              try {
                const rRes = await api.get(`/avaliacoes/media/${g.id}`, { headers: { Authorization: `Bearer ${token}` } });
                if (rRes.status !== 204 && rRes.data?.media) {
                  ratingsMap[g.id] = { media: rRes.data.media, total: rRes.data.totalAvaliacoes };
                }
              } catch (err) {
                console.warn(err.message);
              }
            }));
            setAvgRatings(ratingsMap);

          } catch (err) {
            console.error(err.message);
          }
        }

        setAllGames(gamesWithId);
        
        const seen = new Set();
        const cats = [];
        gamesWithId.forEach(j => {
          const c = j.categoria?.trim();
          if (c && !seen.has(c)) { seen.add(c); cats.push(c); }
        });
        setCategories(cats);

        setLoading(false);
      })
      .catch(err => {
        console.error(err.message);
        setLoading(false);
      });
  }, [navigate, purchasedIds, userId]);

  const filteredGames = useMemo(() => {
    return allGames.filter(jogo => {
      const preco = parseFloat(jogo.preco) || 0;
      const ano   = parseInt(jogo.ano) || 0;
      const cat   = jogo.categoria?.trim() || '';

      const matchCat   = !selectedCategory || cat === selectedCategory;
      const matchPrice = preco >= priceRange[0] && preco <= priceRange[1];
      const matchYear  = !ano || (ano >= yearRange[0] && ano <= yearRange[1]);

      return matchCat && matchPrice && matchYear;
    });
  }, [allGames, selectedCategory, priceRange, yearRange]);

  const handleCategoryClick = useCallback((cat) => {
    const next = selectedCategory === cat ? '' : cat;
    setSelectedCategory(next);
    setSearchParams(next ? { categoria: next } : {});
  }, [selectedCategory, setSearchParams]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 500]);
    setYearRange([2000, CURRENT_YEAR]);
    setSearchParams({});
  };

  const handleAddToCart = async (jogoId) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    if (cartItems.has(jogoId)) {
      navigate('/cart');
      return;
    }

    try {
      await api.post('/carrinho/add', { jogoId }, { headers: { Authorization: `Bearer ${token}` } });
      setAddedItems(prev => ({ ...prev, [jogoId]: true }));
      window.dispatchEvent(new Event('cartUpdated'));

      setCartItems(prev => {
        const next = new Set(prev);
        next.add(jogoId);
        return next;
      });

      setTimeout(() => {
        setAddedItems(prev => {
          const next = { ...prev };
          delete next[jogoId];
          return next;
        });
      }, 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setCartItems(prev => {
          const next = new Set(prev);
          next.add(jogoId);
          return next;
        });
      } else {
        console.error(err.message);
      }
    }
  };

  const handleWishlistToggle = async (jogoId) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    if (wishlistItems.has(jogoId)) {
      try {
        await api.delete('/lista-desejo', { headers: { Authorization: `Bearer ${token}` }, data: { jogoId } });
        setWishlistItems(prev => {
          const next = new Set(prev);
          next.delete(jogoId);
          return next;
        });

        
      } catch (err) { 
        console.error(err.message); 
      }
    } else {
      try {
        await api.post('/lista-desejo', { jogoId }, { headers: { Authorization: `Bearer ${token}` } });
        setWishlistItems(prev => {
          const next = new Set(prev);
          next.add(jogoId);
          return next;
        });
        window.dispatchEvent(new CustomEvent('notify', { 
       detail: { text: 'Item adicionado à sua Lista de Desejos! ❤️', link: '/wishlist' } 
        }));
      } catch (err) { 
        console.error(err.message); 
      }
    }
  };

  const formatPrice = (price) => {
    const n = parseFloat(price);
    return isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <div className="cat-page-loading">
        <span className="cat-spinner" />
        <p>Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="cat-page">
      <div className="cat-page-topbar">
        <div className="cat-page-topbar-inner">
          <div>
            <h1 className="cat-page-heading">
              {selectedCategory
                ? <>{ICON_MAP[selectedCategory] || '🎮'} {selectedCategory}</>
                : 'Catálogo completo'}
            </h1>
            <p className="cat-page-subheading">
              {filteredGames.length} {filteredGames.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}
            </p>
          </div>
          <button
            className="cat-mobile-filter-btn"
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? '✕ Fechar' : '⚙ Filtros'}
          </button>
        </div>
      </div>

      <div className="cat-layout">
        <Sidebar
          sidebarOpen={sidebarOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          priceRange={priceRange}
          yearRange={yearRange}
          onCategoryClick={handleCategoryClick}
          onClearFilters={handleClearFilters}
          onPriceChange={setPriceRange}
          onYearChange={setYearRange}
        />

        {sidebarOpen && (
          <div className="cat-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="cat-main">
          {filteredGames.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">🔭</span>
              <h3>Nenhum jogo encontrado</h3>
              <p>Tente ajustar os filtros para ver mais resultados.</p>
              <button className="cat-clear-btn cat-clear-btn--center" onClick={handleClearFilters}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="cat-games-grid">
              {filteredGames.map(jogo => {
                const isOwned = purchasedIds.includes(jogo.id);
                const ratingObj = avgRatings[jogo.id] || { media: 0, total: 0 };
                const ratingMedia = ratingObj.media;
                const ratingTotal = ratingObj.total;

                return (
                  <div key={jogo.id} className="cat-game-card">
                    
                    <Link to={`/game/${encodeURIComponent(jogo.nome)}`} className="cat-card-thumb">
                      <span className="cat-card-thumb-icon">🎮</span>
                      <span className="cat-card-badge">{jogo.categoria?.trim()}</span>
                    </Link>

                    <div className="cat-card-body">
                      <h3 className="cat-card-name">{jogo.nome}</h3>

                      <div className="cat-card-rating">
                        <div className="cat-card-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`cat-star ${s <= Math.round(ratingMedia) ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                        <span className="cat-card-rating-num">
                          {ratingMedia > 0 ? ratingMedia.toFixed(1) : '0.0'} ({ratingTotal})
                        </span>
                      </div>

                      <p className="cat-card-desc">
                        {jogo.descricao || 'Sem descrição disponível para este título.'}
                      </p>
                    </div>

                    <div className="cat-card-footer">
                      <div className="cat-card-price-row">
                        <span className="cat-card-price">R$ {formatPrice(jogo.preco)}</span>
                        <button
                          className={`cat-btn-wish ${wishlistItems.has(jogo.id) ? 'wish-added' : ''}`}
                          onClick={() => handleWishlistToggle(jogo.id)}
                        >
                          {wishlistItems.has(jogo.id) ? '♥' : '♡'}
                        </button>
                      </div>
                      
                      <div className="cat-card-actions">
                        {isOwned ? (
                          <button
                            className="cat-btn-owned"
                            onClick={() => navigate('/library')}
                          >
                            ✓ Na biblioteca
                          </button>
                        ) : (
                          <button
                            className={`cat-btn-cart ${addedItems[jogo.id] ? 'btn-success' : cartItems.has(jogo.id) ? 'btn-in-cart' : ''}`}
                            onClick={() => handleAddToCart(jogo.id)}
                            disabled={addedItems[jogo.id]}
                          >
                            {addedItems[jogo.id] ? '✓ Adicionado!' : cartItems.has(jogo.id) ? 'No carrinho' : 'Adicionar ao carrinho'}
                          </button>
                        )}
                        <Link
                          to={`/game/${encodeURIComponent(jogo.nome)}`}
                          className="cat-btn-details"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CategoriesPage;