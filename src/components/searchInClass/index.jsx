import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

const ICON_MAP = {
  RPG: "castle",
  Ação: "sports_martial_arts",
  Aventura: "explore",
  Social: "group",
  Sandbox: "construction",
  Plataforma: "sprint",
  Puzzle: "extension",
  Horror: "skull",
  Tiro: "ads_click",
  Simulação: "agriculture",
  VR: "view_in_ar",
};

function SearchInClass() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/public/jogos")
      .then((response) => {
        const data = response.data;
        const uniqueCategories = [];
        const seen = new Set();

        data.forEach((jogo) => {
          const categoriaLimpa = jogo.categoria ? jogo.categoria.trim() : "";
          if (!seen.has(categoriaLimpa) && ICON_MAP[categoriaLimpa]) {
            seen.add(categoriaLimpa);
            uniqueCategories.push({
              name: categoriaLimpa,
              icon: ICON_MAP[categoriaLimpa],
              count: `${data.filter((j) => j.categoria?.trim() === categoriaLimpa).length} jogos`,
            });
          }
        });

        setCategories(uniqueCategories.slice(0, 6));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar categorias:", err);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/categorias?categoria=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return <div className="category-loading">Mapeando categorias...</div>;
  }

  return (
    <section className="category-section">
      <div className="category-header">
        <div className="header-left">
          <h2 className="category-title">Explorar por categoria</h2>
        </div>
        <Link to="/categorias" className="view-all">
          Ver todas
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      <div className="category-grid">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="category-card"
            onClick={() => handleCategoryClick(cat.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && handleCategoryClick(cat.name)
            }
            aria-label={`Filtrar por ${cat.name}`}
          >
            <div className="category-icon">
              <span className="material-symbols-outlined">{cat.icon}</span>
            </div>
            <h3 className="category-name">{cat.name}</h3>
            <span className="category-count">{cat.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SearchInClass;
