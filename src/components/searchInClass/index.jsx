import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // Importando a nossa instância do Axios
import './index.css';

function SearchInClass() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    api.get('/public/jogos')
      .then((response) => {
        // No Axios, a resposta do servidor vem direto em response.data
        const data = response.data;
        
        // Lógica para não deixar repetir categoria
        const uniqueCategories = [];
        const seen = new Set();

        // Mapeamento de ícones para os cards
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

  if (loading) {
    return <div className='category-loading'>Mapeando categorias...</div>;
  }

  return (
    <section className='category-section'>
      <div className='category-header'>
        <div className='header-left'>
          <h2 className='category-title'>Explorar por categoria</h2>
        </div>
        <Link to="/categorias" className='view-all'>Ver todas &rarr;</Link>
      </div>

      <div className='category-grid'>
        {categories.map((cat, index) => (
          <div key={index} className='category-card'>
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