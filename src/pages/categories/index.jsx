import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('categoria') || ''
  );
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [yearRange, setYearRange] = useState([2000, CURRENT_YEAR]);

  
  const [allGames, setAllGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  
  useEffect(() => {
    api.get('/public/jogos')
      .then(({ data }) => {
        setAllGames(data);

        
        const seen = new Set();
        const cats = [];
        data.forEach(j => {
          const c = j.categoria?.trim();
          if (c && !seen.has(c)) { seen.add(c); cats.push(c); }
        });
        setCategories(cats);

        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar jogos:', err);
        setLoading(false);
      });
  }, []);

  
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

  const handleAddToCart     = (id) => console.log(`Carrinho: ${id}`);
  const handleAddToWishlist = (id) => console.log(`Wishlist: ${id}`);

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
              {filteredGames.map(jogo => (
                <div key={jogo.id} className="cat-game-card">
                  
                  <div className="cat-card-thumb">
                    <span className="cat-card-thumb-icon">🎮</span>
                    <span className="cat-card-badge">{jogo.categoria?.trim()}</span>
                  </div>

                  
                  <div className="cat-card-body">
                    <h3 className="cat-card-name">{jogo.nome}</h3>

                    
                    <div className="cat-card-rating">
                      {'★★★★☆'}
                      <span className="cat-card-rating-num">4.0</span>
                    </div>

                    <p className="cat-card-desc">
                      {jogo.descricao || 'Sem descrição disponível para este título.'}
                    </p>
                  </div>

                  
                  <div className="cat-card-footer">
                    <div className="cat-card-price-row">
                      <span className="cat-card-price">R$ {formatPrice(jogo.preco)}</span>
                      <button
                        className="cat-btn-wish"
                        onClick={() => handleAddToWishlist(jogo.id)}
                        title="Lista de desejos"
                      >
                        ♡
                      </button>
                    </div>
                    <div className="cat-card-actions">
                      <button
                        className="cat-btn-cart"
                        onClick={() => handleAddToCart(jogo.id)}
                        title="Adicionar ao carrinho"
                      >
                        Adicionar ao carrinho
                      </button>
                      <Link
                        to={`/game/${encodeURIComponent(jogo.nome)}`}
                        className="cat-btn-details"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CategoriesPage;