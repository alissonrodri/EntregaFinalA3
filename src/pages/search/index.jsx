import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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

function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [exactResults, setExactResults] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLimitedResult, setIsLimitedResult] = useState(false);

  const [cartItems, setCartItems] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [addedItems, setAddedItems] = useState({});

  const userId = getUserId();
  const purchasedIds = JSON.parse(localStorage.getItem(`purchasedGameIds_${userId}`) || '[]');

  useEffect(() => {
    
    setTimeout(() => {
      setLoading(true);
    }, 0);

    const token = localStorage.getItem('token');

    api.get('/public/jogos')
      .then(async (response) => {
        let allGames = response.data;

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

            allGames = allGames.map(gPublic => {
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

        
        if (!query) {
          setIsLimitedResult(true);
          const shuffledGames = [...allGames].sort(() => 0.5 - Math.random());
          setExactResults(shuffledGames.slice(0, 10));
          setRecommendedGames([]);
        }
       
        else {
          setIsLimitedResult(false);

          const filtrados = allGames.filter(jogo =>
            jogo.nome.toLowerCase().includes(query.toLowerCase())
          );
          setExactResults(filtrados);

          if (filtrados.length > 0) {
            const jogoPrincipal = filtrados[0];
            const categoriaAlvo = jogoPrincipal.categoria
              ? String(jogoPrincipal.categoria).trim().toLowerCase()
              : "";

            const recomendados = allGames.filter(jogo => {
              const categoriaAtual = jogo.categoria
                ? String(jogo.categoria).trim().toLowerCase()
                : "";
              const isJaBuscado = filtrados.some(f => f.nome === jogo.nome);
              return (categoriaAtual === categoriaAlvo) && !isJaBuscado;
            });

            setRecommendedGames(recomendados.slice(0, 4));
          } else {
            setRecommendedGames([]);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar jogos na página de resultados:", err);
        setLoading(false);
      });
  }, [query]);

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

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return <div className="search-page-loading">Buscando jogos no banco de dados...</div>;
  }

  return (
    <div className="search-page-container">
      
      <header className="search-page-header">
        {isLimitedResult ? (
          <>
            <h1>Explorando o Catálogo</h1>
            <p><strong>Resultado limitado:</strong> Use a barra de pesquisa para buscar um título específico.</p>
          </>
        ) : (
          <>
            <h1>Resultados para: <span>"{query}"</span></h1>
            <p>{exactResults.length} {exactResults.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}</p>
          </>
        )}
      </header>

      <section className="results-section">
        {exactResults.length > 0 ? (
          <div className="results-list">
            {exactResults.map((jogo) => {
              const isOwned = purchasedIds.includes(jogo.id);
              const inCart = cartItems.has(jogo.id);
              const justAdded = addedItems[jogo.id];
              const inWishlist = wishlistItems.has(jogo.id);

              return (
              <div key={jogo.id} className="game-row-card">
                <div className="game-row-thumb">🎮</div>
                <div className="game-row-details">
                  <div className="game-row-main-info">
                    <h2 className="game-row-title">{jogo.nome}</h2>
                    <span className="game-row-badge">{jogo.categoria?.trim()}</span>
                    <p className="game-row-description">{jogo.descricao || 'Sem descrição disponível para este título.'}</p>
                  </div>
                  <div className="game-row-side-info">
                    <span className="game-row-price">R$ {formatPrice(jogo.preco)}</span>
                    <div className="game-row-actions">
                      {isOwned ? (
                        <button className="btn-row-add-cart btn-row-owned" onClick={() => navigate('/library')}>
                          ✓ Na biblioteca
                        </button>
                      ) : (
                        <button
                          className={`btn-row-add-cart ${justAdded ? 'btn-row-success' : inCart ? 'btn-row-in-cart' : ''}`}
                          onClick={() => handleAddToCart(jogo.id)}
                          disabled={justAdded}
                        >
                          {justAdded ? '✓ Adicionado!' : inCart ? 'No carrinho' : 'Adicionar ao carrinho'}
                        </button>
                      )}

                      <button
                        className={`btn-row-wishlist ${inWishlist ? 'btn-row-wishlist--active' : ''}`}
                        onClick={() => handleWishlistToggle(jogo.id)}
                        title="Lista de Desejos"
                      >
                        {inWishlist ? '♥' : '♡'}
                      </button>

                      <Link to={`/game/${jogo.nome}`} className="btn-row-details">
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results-box">
            <span className="no-results-icon">🔍</span>
            <h3>Nenhum jogo encontrado</h3>
            <p>Não encontramos nenhum título correspondente a sua busca. Tente digitar outras palavras-chave.</p>
          </div>
        )}
      </section>

      {recommendedGames.length > 0 && (
        <section className="recommendations-section">
          <h2 className="recommendations-title">Jogos relacionados:</h2>
          <div className="recommendations-grid">
            {recommendedGames.map((jogo) => (
              <div key={jogo.id} className="game-thumb-card">
                <div className="thumb-media">🎮</div>
                <div className="thumb-info">
                  <h3>{jogo.nome}</h3>
                  <div className="thumb-footer">
                    <span className="thumb-category">{jogo.categoria?.trim()}</span>
                    <span className="thumb-price">R$ {formatPrice(jogo.preco)}</span>
                  </div>
                  <Link to={`/game/${jogo.nome}`} className="btn-thumb-view">Ver detalhes</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SearchPage;