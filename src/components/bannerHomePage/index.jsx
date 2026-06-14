import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import './index.css';

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

function Banner() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
        let gamesData = data.slice(0, 5);

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
              }),
            ]);

            const authGamesList = Array.isArray(authResponse.data)
              ? authResponse.data
              : (authResponse.data.jogos || []);

            gamesData = gamesData.map(gPublic => {
              const match = authGamesList.find(gAuth => gAuth.nome === gPublic.nome);
              return match ? { ...gPublic, id: match.id } : gPublic;
            });

            const cData = cartRes.data?.carrinho?.itens || [];
            setCartItems(new Set(cData.map(i => i.fkJogo)));

            const wData = Array.isArray(wishRes.data) ? wishRes.data : [];
            setWishlistItems(new Set(wData.map(i => i.id || i.fkJogo)));
          } catch (err) {
            console.error(err.message);
          }
        }

        setGames(gamesData);
        setLoading(false);

       
        try {
          const ratingsMap = {};
          await Promise.all(
            gamesData.map(async (g) => {
              if (!g.id) return;
              try {
                
                const rRes = await api.get(`/avaliacoes/media/${g.id}`);
                
                
                if (rRes.status !== 204 && rRes.data?.media) {
                  ratingsMap[g.id] = { 
                    media: Number(rRes.data.media), 
                    total: Number(rRes.data.totalAvaliacoes) 
                  };
                } else {
                  ratingsMap[g.id] = { media: 0, total: 0 };
                }
              } catch (err) {
                console.warn(`Sem avaliações para o jogo ${g.id}:`, err.message);
                ratingsMap[g.id] = { media: 0, total: 0 };
              }
            })
          );
          setAvgRatings(ratingsMap);
        } catch (error) {
          console.error("Erro ao buscar avaliações no banner:", error);
        }

      })
      .catch((err) => {
        console.error("Erro na integração com a API de Jogos via Axios:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (games.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((currentValue) =>
        currentValue === games.length - 1 ? 0 : currentValue + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [games.length]);

  const handleAddToCart = useCallback(async (jogoId) => {
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
  }, [cartItems, navigate]);

  const handleWishlistToggle = useCallback(async (jogoId) => {
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
  }, [wishlistItems, navigate]);

  if (loading) {
    return <div className="banner-loading">Sincronizando jogos da API...</div>;
  }
  
  if (games.length === 0) return null;

  const currentGame = games[activeIndex];
  const isOwned = purchasedIds.includes(currentGame.id);
  const inCart = cartItems.has(currentGame.id);
  const justAdded = addedItems[currentGame.id];
  const inWishlist = wishlistItems.has(currentGame.id);

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',');
  };

  // Preparando dados da avaliação do jogo atual
  const ratingObj = avgRatings[currentGame.id] || { media: 0, total: 0 };
  const ratingMedia = ratingObj.media;
  const ratingTotal = ratingObj.total;
  const roundedRating = Math.round(ratingMedia);

  return (
    <section className="banner-home">
      <div className="banner-container">
        
        <div className="banner-info">
          <div className="banner-label">
            <span className="label-dot"></span> {currentGame.empresa_nome || "DESTAQUE"}
          </div>

          <h1 className="banner-title">{currentGame.nome}</h1>

          <div className="banner-tags">
            <span className="banner-tag">{currentGame.categoria}</span>
            <span className="banner-tag">{currentGame.ano}</span>
            <span className="banner-tag">Digital</span>
          </div>

          <p className="banner-description">{currentGame.descricao}</p>

          <div className="banner-pricing">
            <span className="price">R$ {formatPrice(currentGame.preco)}</span>
          </div>

          <div className="banner-btns">
            {isOwned ? (
              <button className="btn-cart btn-cart--owned" onClick={() => navigate('/library')}>
                ✓ Na biblioteca
              </button>
            ) : (
              <button
                className={`btn-cart ${justAdded ? 'btn-cart--success' : inCart ? 'btn-cart--in-cart' : ''}`}
                onClick={() => handleAddToCart(currentGame.id)}
                disabled={justAdded}
              >
                {justAdded ? '✓ Adicionado!' : inCart ? '✓ Visualizar no carrinho' : 'Adicionar ao carrinho'}
              </button>
            )}

            <button
              className={`btn-wishlist ${inWishlist ? 'btn-wishlist--active' : ''}`}
              onClick={() => handleWishlistToggle(currentGame.id)}
            >
              {inWishlist ? '♥ Na lista' : '♡ Lista de desejos'}
            </button>

            <Link to={`/game/${currentGame.nome}`} className="btn-details">Ver detalhes</Link>
          </div>
        </div>

        <div className="banner-media">
          <div className="media-card">
            <div className="media-placeholder">🎮</div>
            <div className="media-stats">
              
             
              <div className="banner-card-rating">
                <div className="banner-stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`banner-star ${star <= roundedRating ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {ratingMedia > 0 ? (
                  <>
                    <span className="rating-value">{ratingMedia.toFixed(1)}</span>
                    <span className="rating-count">({ratingTotal})</span>
                  </>
                ) : (
                  <span className="rating-count">(Sem avaliações)</span>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="banner-dots">
        {games.map((_, i) => (
          <span
            key={i}
            className={`dot ${activeIndex === i ? 'active' : ''}`}
            onClick={() => setActiveIndex(i)}
          ></span>
        ))}
      </div>
    </section>
  );
}

export default Banner;