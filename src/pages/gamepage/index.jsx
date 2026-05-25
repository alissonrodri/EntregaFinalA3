import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';


function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnState, setBtnState] = useState('idle');
  const [wishState, setWishState] = useState('idle'); 

  const [activeMedia, setActiveMedia] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const mockMedia = [
    { id: 0, label: "Trailer" },
    { id: 1, label: "Gameplay 1" },
    { id: 2, label: "Gameplay 2" },
    { id: 3, label: "Cenário" },
  ];

  const btnConfig = {
    idle:      { text: "Adicionar ao carrinho", disabled: false, className: "" },
    success:   { text: "Adicionado! ✓",         disabled: true,  className: "btn-success" },
    duplicate: { text: "Já adicionado",          disabled: true,  className: "btn-added" },
    already:   { text: "No carrinho",          disabled: true,  className: "btn-added" },
  };

  const wishConfig = {
    idle:    { text: "♡ Lista de desejos",  className: "" },
    added:   { text: "♥ Na lista de desejos", className: "btn-wish-added" },
    already: { text: "♥ Na lista de desejos", className: "btn-wish-added" },
  };

  useEffect(() => {
    
    setTimeout(() => { 
      setLoading(true); 
      setWishState('idle');
      setBtnState('idle');
    }, 0);
    window.scrollTo(0, 0);

    api.get('/public/jogos')
      .then(async (response) => {
        const allGames = Array.isArray(response.data) ? response.data : (response.data.jogos || []);
        const foundGame = allGames.find(g => g.nome === decodeURIComponent(id));

        if (foundGame) {
          let gameWithId = { ...foundGame };
          const token = localStorage.getItem('token');

          if (token) {
            try {
              const authResponse = await api.get('/jogos', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const authGamesList = Array.isArray(authResponse.data) ? authResponse.data : (authResponse.data.jogos || []);
              const authGame = authGamesList.find(g => g.nome === foundGame.nome);

              if (authGame && authGame.id) {
                gameWithId.id = authGame.id;

                const cartRes = await api.get('/carrinho/ativo', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const itens = cartRes.data.carrinho?.itens || [];
                if (itens.some(i => i.fkJogo === gameWithId.id)) {
                 
                  setBtnState('already');
                }

               
                const wishRes = await api.get('/lista-desejo', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const wishGames = Array.isArray(wishRes.data) ? wishRes.data : [];
                if (wishGames.some(g => g.id === gameWithId.id)) {
                  setWishState('already');
                }
              }
            } catch (err) {
              console.warn("Aviso: Falha ao pré-carregar ID na rota autenticada.", err.message);
            }
          }

          setGame(gameWithId);

          const categoriaAlvoTexto = foundGame.categoria ? String(foundGame.categoria).trim().toLowerCase() : "";
          const recomendados = allGames.filter(g => {
            if (g.nome === foundGame.nome) return false;
            const categoriaAtualTexto = g.categoria ? String(g.categoria).trim().toLowerCase() : "";
            return categoriaAlvoTexto && categoriaAtualTexto && categoriaAlvoTexto === categoriaAtualTexto;
          });
          setSimilarGames(recomendados.slice(0, 4));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao processar catálogo de jogos:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    let finalGameId = game?.id;

    if (!finalGameId) {
      try {
        const authRes = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match = jogosList.find(g => g.nome === game.nome);

        if (match && match.id) {
          finalGameId = match.id;
          setGame(prev => ({ ...prev, id: finalGameId }));
        } else {
          alert("Não foi possível localizar o identificador único deste jogo no banco de dados.");
          return;
        }
      } catch (err) {
        console.error("Erro ao tentar resgatar o ID durante o clique:", err);
        alert(`Acesso negado à listagem autenticada. Erro do Servidor: ${err.response?.status || err.message}`);
        return;
      }
    }

    try {
      await api.post('/carrinho/add',
        { jogoId: finalGameId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

   
      setBtnState('success');
      window.dispatchEvent(new Event('cartUpdated'));

      setTimeout(() => setBtnState('idle'), 2000);

    } catch (error) {
      if (error.response?.status === 400) {
       
        setBtnState('duplicate');
        setTimeout(() => setBtnState('idle'), 2000);
      } else {
        alert("Ocorreu um erro ao tentar adicionar o item ao seu carrinho. Tente novamente.");
      }
    }
  };

const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    
    if (btnState === 'already' || btnState === 'success') {
      navigate('/cart');
      return;
    }

    let finalGameId = game?.id;

    if (!finalGameId) {
      try {
        const authRes = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match = jogosList.find(g => g.nome === game.nome);
        if (match && match.id) {
          finalGameId = match.id;
          setGame(prev => ({ ...prev, id: finalGameId }));
        } else {
          alert("Não foi possível localizar o identificador único deste jogo.");
          return;
        }
      } catch (err) {
        alert(`Erro ao buscar o jogo: ${err.response?.status || err.message}`);
        return;
      }
    }

    try {
      await api.post('/carrinho/add',
        { jogoId: finalGameId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
     
      if (error.response?.status !== 400) {
        alert("Erro ao adicionar ao carrinho. Tente novamente.");
        return;
      }
    }

    navigate('/cart');
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

   
    if (wishState === 'added' || wishState === 'already') {
      try {
        await api.delete('/lista-desejo', {
          headers: { Authorization: `Bearer ${token}` },
          data: { jogoId: game.id },
        });
        setWishState('idle');
      } catch (err) {
        console.error("Erro ao remover da lista de desejos:", err);
      }
      return;
    }

    let finalGameId = game?.id;
    if (!finalGameId) {
      try {
        const authRes = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match = jogosList.find(g => g.nome === game.nome);
        if (match?.id) {
          finalGameId = match.id;
          setGame(prev => ({ ...prev, id: finalGameId }));
        } else { return; }
      } catch (err) { 
        console.error("Erro ao buscar ID do jogo para wishlist:", err);
        alert("Não foi possível adicionar o jogo à lista de desejos. Tente novamente.");
        return; 
      }
    }

    try {
      await api.post('/lista-desejo',
        { jogoId: finalGameId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishState('added');
    } catch (err) {
      if (err.response?.status === 409) {
        setWishState('already'); 
      }
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',');
  };

  const btn = btnConfig[btnState];

  if (loading) return <div className="game-page-loading">Carregando informações do jogo...</div>;
  if (!game) return (
    <div className="game-page-error">
      <h2>Jogo não encontrado</h2>
      <Link to="/" className="btn-back-home">Voltar para a loja</Link>
    </div>
  );

  return (
    <>
      <main className="game-page">

        <section className="game-hero">
          <div className="media-block">
            <div className="media-main"><span>{mockMedia[activeMedia].label}</span></div>
            <div className="media-thumbs">
              {mockMedia.map((media, index) => (
                <div
                  key={media.id}
                  className={`media-thumb ${activeMedia === index ? 'active' : ''}`}
                  onClick={() => setActiveMedia(index)}
                >
                  {media.label}
                </div>
              ))}
            </div>
          </div>

          <aside className="game-sidebar">
            <div className="game-card">
              <div className="game-cover">🎮</div>
              <h1 className="game-card-title">{game.nome}</h1>
              <div className="game-price">R$ {formatPrice(game.preco)}</div>

              <button className="btn btn-primary btn-buy" onClick={handleBuy}>Comprar</button>
              <button
                className={`btn btn-secondary btn-cart ${btn.className}`}
                onClick={handleAddToCart}
                disabled={btn.disabled}
              >
                {btn.text}
              </button>
              <button
                className={`btn btn-secondary btn-wishlist ${wishConfig[wishState].className}`}
                onClick={handleWishlist}
              >
                {wishConfig[wishState].text}
              </button>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2 className="section-title">Inserir análise</h2>
          <div className="section-card">
            <div className="review-form">
              <div className="user-avatar-lg">AR</div>
              <div className="review-form-content">
                <textarea className="review-textarea" placeholder="Escreva sua análise aqui..."></textarea>
                <div className="review-form-footer">
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${(hoverRating || userRating) >= star ? 'filled' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <button className="btn-publish">Publicar</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Sobre o jogo</h2>
          <div className="section-card">
            <p className="about-text">
              {game.descricao || "Nenhuma descrição detalhada fornecida para este título ainda."}
            </p>
          </div>
        </section>

        <div className="requirements-grid">
          <div className="requirements-block">
            <h3>Requisitos mínimos</h3>
            <div className="req-row"><span className="req-label">SO:</span><span className="req-value">Windows 10 (64-bit)</span></div>
            <div className="req-row"><span className="req-label">CPU:</span><span className="req-value">Intel Core i5</span></div>
            <div className="req-row"><span className="req-label">RAM:</span><span className="req-value">8 GB</span></div>
          </div>
          <div className="requirements-block">
            <h3>Requisitos recomendados</h3>
            <div className="req-row"><span className="req-label">SO:</span><span className="req-value">Windows 10/11 (64-bit)</span></div>
            <div className="req-row"><span className="req-label">CPU:</span><span className="req-value">Intel Core i7</span></div>
            <div className="req-row"><span className="req-label">RAM:</span><span className="req-value">16 GB</span></div>
          </div>
        </div>

        {similarGames.length > 0 && (
          <section className="section">
            <h2 className="section-title">Jogos similares</h2>
            <div className="similar-games">
              {similarGames.map((similar) => (
                <Link to={`/game/${encodeURIComponent(similar.nome)}`} key={similar.nome} className="similar-game-card">
                  <span className="similar-game-name">{similar.nome}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section-title">Análises de outros usuários</h2>
          <div className="reviews-list">
            <div className="review-card">
              <div>
                <div className="user-avatar-lg">MJ</div>
                <p className="reviewer-name">Maria Julia</p>
              </div>
              <div className="review-card-body">
                <div className="review-card-text">Obra de arte absoluta. A narrativa e o mundo são imersivos demais!</div>
                <div className="review-card-footer">
                  <div className="star-rating">
                    <span className="star filled">★</span>
                    <span className="star filled">★</span>
                    <span className="star filled">★</span>
                    <span className="star filled">★</span>
                    <span className="star filled">★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="btn-see-all">Ver todas as análises</button>
        </section>
      </main>
    </>
  );
}

export default GamePage;