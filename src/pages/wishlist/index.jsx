import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchWishlist = async () => {
      try {
        
        const [wishRes, publicRes] = await Promise.all([
          api.get('/lista-desejo', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/public/jogos'),
        ]);

        const wishGames  = Array.isArray(wishRes.data)    ? wishRes.data    : [];
        const publicGames = Array.isArray(publicRes.data) ? publicRes.data  : [];

        const enriched = wishGames.map(game => {
          const publicGame = publicGames.find(g => g.nome === game.nome);
          return {
            ...game,
            categoria:  publicGame?.categoria    || '—',
            empresa:    publicGame?.empresa_nome || '—',
          };
        });

        setWishlist(enriched);
      } catch (err) {
        console.error("Erro ao buscar lista de desejos:", err);
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
      console.error("Erro ao remover da lista de desejos:", err);
    }
  };

  const handleMoveToCart = async (game) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    try {
      await api.post('/carrinho/add',
        { jogoId: game.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
  
      if (err.response?.status !== 400) {
        alert("Erro ao adicionar ao carrinho. Tente novamente.");
        return;
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
                  className="btn-move-to-cart"
                  onClick={() => handleMoveToCart(game)}
                >
                  🛒 Adicionar ao carrinho
                </button>
                <button
                  className="btn-remove"
                  title="Remover da lista"
                  onClick={() => handleRemove(game.id)}
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

export default WishlistPage;