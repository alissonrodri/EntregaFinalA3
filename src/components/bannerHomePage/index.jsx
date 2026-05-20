import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import './index.css';

function Banner() {
  const [games, setGames] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Busca de dados utilizando o Axios centralizado
  useEffect(() => {

    api.get('/public/jogos')
      .then((response) => {
        setGames(response.data.slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro na integração com a API de Jogos via Axios:", err);
        setLoading(false);
      });
  }, []);

  // Efeito de transição automática do carrossel (Timing)
  useEffect(() => {
    if (games.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((currentValue) =>
        currentValue === games.length - 1 ? 0 : currentValue + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [games.length]);

  if (loading) {
    return <div className="banner-loading">Sincronizando jogos da API...</div>;
  }
  
  if (games.length === 0) return null;

  const currentGame = games[activeIndex];

  // Formatação de moeda para o padrão brasileiro (R$ 0,00)
  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace('.', ',');
  };

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
            <button className="btn-cart">Adicionar ao carrinho</button>
            <button className="btn-wishlist">♡ Lista de desejos</button>
            <button className="btn-details">Ver detalhes</button>
          </div>
        </div>

        <div className="banner-media">
          <div className="media-card">
            <div className="media-placeholder">🎮</div>
            <div className="media-stats">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <span className="rating-text">Premium Edition</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de navegação (Bolinhas) */}
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