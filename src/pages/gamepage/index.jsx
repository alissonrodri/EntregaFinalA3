import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function GamePage() {
  const { id } = useParams(); // Pega o ID da URL (ex: /game/3)
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);


  const [activeMedia, setActiveMedia] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Array provisório de mídias
  const mockMedia = [
    { id: 0, label: "Trailer" },
    { id: 1, label: "Gameplay 1" },
    { id: 2, label: "Gameplay 2" },
    { id: 3, label: "Cenário" },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(true);
    }, 0);
    window.scrollTo(0, 0);

    api.get('/public/jogos')
      .then((response) => {
        const allGames = response.data;


        const foundGame = allGames.find(g => g.nome === decodeURIComponent(id));
        setGame(foundGame);

        if (foundGame) {
          const categoriaAlvoTexto = foundGame.categoria ? String(foundGame.categoria).trim().toLowerCase() : "";
          const categoriaAlvoId = foundGame.fk_categoria;

          const recomendados = allGames.filter(g => {
            if (String(g.id) === String(id)) return false; 
            const categoriaAtualTexto = g.categoria ? String(g.categoria).trim().toLowerCase() : "";
            return (categoriaAlvoId !== undefined && g.fk_categoria === categoriaAlvoId) || 
                   (categoriaAlvoTexto && categoriaAtualTexto && categoriaAlvoTexto === categoriaAtualTexto);
          });
          setSimilarGames(recomendados.slice(0, 4));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro na busca:", err);
        setLoading(false);
      });
  }, [id]);

  const handleBuy = () => {
    const token = localStorage.getItem('@CLTGaming:token');
    if (!token) {
      navigate('/login');
    } else {
      navigate('/cart');
    }
  };

  const handleAddToCart = () => {
    console.log(`Jogo ${game?.id} adicionado ao carrinho.`);
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return <div className="game-page-loading">Carregando informações do jogo...</div>;
  }

  if (!game) {
    return (
      <div className="game-page-error">
        <h2>Jogo não encontrado</h2>
        <Link to="/" className="btn-back-home">Voltar para a loja</Link>
      </div>
    );
  }

  return (
    <>
      <main className="game-page">
        
        <section className="game-hero">
          <div className="media-block">
            <div className="media-main">
             
              <span>{mockMedia[activeMedia].label}</span>
            </div>

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

              <div className="game-tags">
                {game.categoria && <span className="game-tag">{game.categoria}</span>}
                <span className="game-tag">Lançamento {game.ano}</span>
              </div>

              <div className="game-price">R$ {formatPrice(game.preco)}</div>

              <button className="btn btn-primary btn-buy" onClick={handleBuy}>Comprar</button>
              <button className="btn btn-secondary btn-cart" onClick={handleAddToCart}>Adicionar ao carrinho</button>
              <button className="btn btn-secondary btn-wishlist">♡ Lista de desejos</button>

              <div className="game-info-table">
                <div className="game-info-row">
                  <span className="game-info-label">Desenvolvedor</span>
                  <span className="game-info-value">{game.empresa || 'Não informado'}</span>
                </div>
                <div className="game-info-row">
                  <span className="game-info-label">Distribuidora</span>
                  <span className="game-info-value">{game.empresa || 'Não informado'}</span>
                </div>
                <div className="game-info-row">
                  <span className="game-info-label">Lançamento</span>
                  <span className="game-info-value">{game.ano}</span>
                </div>
              </div>
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

        {/* ABOUT */}
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
            <div className="req-row"><span class="req-label">CPU:</span><span className="req-value">Intel Core i5</span></div>
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
                <Link to={`/game/${similar.id}`} key={similar.id} className="similar-game-card">
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
                  <div className="star-rating"><span className="star filled">★</span><span className="star filled">★</span><span className="star filled">★</span><span className="star filled">★</span><span className="star filled">★</span></div>
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