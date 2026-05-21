import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [exactResults, setExactResults] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLimitedResult, setIsLimitedResult] = useState(false);

  useEffect(() => {
    
    setTimeout(() => {
      setLoading(true);
    }, 0);

    api.get('/public/jogos')
      .then((response) => {
        const allGames = response.data;

        // SE A BUSCA ESTIVER VAZIA: Pega 10 aleatórios
        if (!query) {
          setIsLimitedResult(true);
          
          const shuffledGames = [...allGames].sort(() => 0.5 - Math.random());
          setExactResults(shuffledGames.slice(0, 10));
          setRecommendedGames([]); 
        } 
        // SE A BUSCA TIVER TEXTO: Faz a filtragem normal
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

  const handleAddToCart = (gameId) => {
    console.log(`Jogo ${gameId} adicionado ao carrinho.`);
  };

  const handleAddToWishlist = (gameId) => {
    console.log(`Jogo ${gameId} adicionado à lista de desejos.`);
  };

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
            {exactResults.map((jogo) => (
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
                      <button className="btn-row-add-cart" onClick={() => handleAddToCart(jogo.id)}>
                        Adicionar ao carrinho
                      </button>
                      
                      <button className="btn-row-wishlist" onClick={() => handleAddToWishlist(jogo.id)} title="Lista de Desejos">
                        ♡
                      </button>

                      <Link to={`/game/${jogo.nome}`} className="btn-row-details">
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <Link to={`/search?q=${encodeURIComponent(jogo.nome)}`} className="btn-thumb-view">Ver detalhes</Link>
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