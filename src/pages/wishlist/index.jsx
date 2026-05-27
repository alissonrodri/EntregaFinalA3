import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});
  const [cartItems, setCartItems] = useState(new Set());
  const [avgRatings, setAvgRatings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchWishlist = async () => {
      try {
        const [wishRes, publicRes, cartRes] = await Promise.all([
          api.get('/lista-desejo', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/public/jogos'),
          api.get('/carrinho/ativo', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }))
        ]);

        const wishGames = Array.isArray(wishRes.data) ? wishRes.data : [];
        const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
        const cartData = cartRes.data?.carrinho?.itens || [];

        setCartItems(new Set(cartData.map(item => item.fkJogo)));

        const enriched = wishGames.map(game => {
          const publicGame = publicGames.find(g => g.nome === game.nome);
          return {
            ...game,
            categoria: publicGame?.categoria || '—',
            empresa: publicGame?.empresa_nome || '—',
          };
        });

        setWishlist(enriched);

        
        const ratingsMap = {};
        await Promise.all(
          enriched.map(async (game) => {
            try {
              const rRes = await api.get(`/avaliacoes/media/${game.id}`, { headers: { Authorization: `Bearer ${token}` } });
              if (rRes.status !== 204 && rRes.data?.media) {
                ratingsMap[game.id] = { media: rRes.data.media, total: rRes.data.totalAvaliacoes };
              }
            } catch { /* sem avaliações */ }
          })
        );
        setAvgRatings(ratingsMap);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const handleRemove = async (jogoId) => {
    const token = localStorage.getItem('token');
    try {
      await api.delete('/lista-desejo', {
        headers: { Authorization: `Bearer ${token}` },
        data: { jogoId },
      });
      setWishlist(prev => prev.filter(g => g.id !== jogoId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = async (game) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    if (cartItems.has(game.id)) {
      navigate('/cart');
      return;
    }

    const processSuccess = () => {
      setAddedItems(prev => ({ ...prev, [game.id]: true }));
      window.dispatchEvent(new Event('cartUpdated'));

      api.delete('/lista-desejo', {
        headers: { Authorization: `Bearer ${token}` },
        data: { jogoId: game.id },
      }).catch(err => console.error(err));

      setTimeout(() => {
        setWishlist(prev => prev.filter(g => g.id !== game.id));
        setAddedItems(prev => {
          const next = { ...prev };
          delete next[game.id];
          return next;
        });
        setCartItems(prev => {
          const next = new Set(prev);
          next.add(game.id);
          return next;
        });
      }, 2000);
    };

    try {
      await api.post('/carrinho/add',
        { jogoId: game.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      processSuccess();
    } catch (err) {
      if (err.response?.status === 400) {
        processSuccess();
      } else {
        alert("Erro ao adicionar ao carrinho. Tente novamente.");
      }
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return <div className="wishlist-loading">Carregando sua lista de desejos...</div>;
  }

  return (
    <main className="wishlist-container">
      <header className="wishlist-header">
        <h1 className="wishlist-title">Minha Lista de Desejos</h1>
        <p className="wishlist-description">Aqui estão os jogos que você salvou para comprar depois.</p>
      </header>

      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <span className="wishlist-empty-icon">♡</span>
          <h3>Sua lista de desejos está vazia</h3>
          <p>Explore a loja e salve os jogos que você quer comprar depois.</p>
          <Link to="/" className="btn-browse-store">Explorar a Loja</Link>
        </div>
      ) : (
        <div className="wishlist-grid" id="wishlist-grid">
          {wishlist.map(game => (
            <article key={game.id} className="wishlist-card">
              <Link to={`/game/${encodeURIComponent(game.nome)}`} className="wishlist-media">
                🎮
              </Link>
              <div className="wishlist-info">
                <h3 className="game-name">{game.nome}</h3>
                <p className="game-meta">{game.categoria} · {game.ano}</p>
                {avgRatings[game.id] && (
                  <div className="game-rating-row">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={s <= Math.round(avgRatings[game.id].media) ? 'wish-star filled' : 'wish-star'}>★</span>
                    ))}
                    <span className="wish-rating-value">{avgRatings[game.id].media.toFixed(1)}</span>
                    <span className="wish-rating-count">({avgRatings[game.id].total})</span>
                  </div>
                )}
                {game.descricao && (
                  <p className="game-description">{game.descricao}</p>
                )}
                <div className="game-price-row">
                  {game.desconto ? (
                    <>
                      <span className="game-price-original">R$ {formatPrice(game.preco)}</span>
                      <span className="game-price">
                        R$ {formatPrice(game.preco * (1 - game.desconto / 100))}
                      </span>
                      <span className="game-discount-badge">-{game.desconto}%</span>
                    </>
                  ) : (
                    <span className="game-price">R$ {formatPrice(game.preco)}</span>
                  )}
                </div>
              </div>
              <div className="wishlist-actions">
                <button
                  className={`btn-move-to-cart ${addedItems[game.id] ? 'btn-success' : cartItems.has(game.id) ? 'btn-in-cart' : ''}`}
                  onClick={() => handleMoveToCart(game)}
                  disabled={addedItems[game.id]}
                >
                  {addedItems[game.id] ? '✓ Adicionado!' : cartItems.has(game.id) ? 'No carrinho' : '🛒 Adicionar ao carrinho'}
                </button>
                <button
                  className="btn-remove"
                  onClick={() => handleRemove(game.id)}
                  disabled={addedItems[game.id]}
                >
                  🗑️
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Wishlist;