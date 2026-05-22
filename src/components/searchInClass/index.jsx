import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function SearchInClass() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/public/jogos')
      .then((response) => {
        const data = response.data;

        const uniqueCategories = [];
        const seen = new Set();

        const iconMap = {
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
          'VR': '🥽'
        };

        data.forEach(jogo => {
          const categoriaLimpa = jogo.categoria ? jogo.categoria.trim() : "";

          if (!seen.has(categoriaLimpa) && iconMap[categoriaLimpa]) {
            seen.add(categoriaLimpa);
            uniqueCategories.push({
              name: categoriaLimpa,
              icon: iconMap[categoriaLimpa],
              count: `${data.filter(j => j.categoria?.trim() === categoriaLimpa).length} jogos`
            });
          }
        });

        setCategories(uniqueCategories.slice(0, 6));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar categorias via Axios:", err);
        setLoading(false);
      });
  }, []);

  // Redireciona para /categorias já com o filtro aplicado via query param
  const handleCategoryClick = (categoryName) => {
    navigate(`/categorias?categoria=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return <div className='category-loading'>Mapeando categorias...</div>;
  }

  return (
    <section className='category-section'>
      <div className='category-header'>
        <div className='header-left'>
          <h2 className='category-title'>Explorar por categoria</h2>
        </div>
        {/* "Ver todas" leva para /categorias sem filtro */}
        <Link to="/categorias" className='view-all'>Ver todas &rarr;</Link>
      </div>

      <div className='category-grid'>
        {categories.map((cat, index) => (
          <div
            key={index}
            className='category-card'
            onClick={() => handleCategoryClick(cat.name)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleCategoryClick(cat.name)}
            aria-label={`Filtrar por ${cat.name}`}
          >
            <div className='category-icon'>{cat.icon}</div>
            <h3 className='category-name'>{cat.name}</h3>
            <span className='category-count'>{cat.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SearchInClass;