import './index.css';

const CURRENT_YEAR = new Date().getFullYear();

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

function Sidebar({
  sidebarOpen,
  categories,
  selectedCategory,
  priceRange,
  yearRange,
  onCategoryClick,
  onClearFilters,
  onPriceChange,
  onYearChange,
}) {
  const hasActiveFilters =
    selectedCategory ||
    priceRange[0] > 0 ||
    priceRange[1] < 500 ||
    yearRange[0] > 2000 ||
    yearRange[1] < CURRENT_YEAR;

  return (
    <aside className={`cat-sidebar ${sidebarOpen ? 'cat-sidebar--open' : ''}`}>
      <div className="cat-sidebar-header">
        <h2 className="cat-sidebar-title">Filtros</h2>
        {hasActiveFilters && (
          <button className="cat-clear-btn" onClick={onClearFilters}>
            Limpar tudo
          </button>
        )}
      </div>

      {/* Categorias */}
      <div className="cat-filter-group">
        <h3 className="cat-filter-label">Categoria</h3>
        <ul className="cat-filter-list">
          {categories.map(cat => (
            <li key={cat}>
              <button
                className={`cat-filter-item ${selectedCategory === cat ? 'cat-filter-item--active' : ''}`}
                onClick={() => onCategoryClick(cat)}
              >
                <span className="cat-filter-icon">{ICON_MAP[cat] || '🎮'}</span>
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Preço */}
      <div className="cat-filter-group">
        <h3 className="cat-filter-label">
          Preço&ensp;
          <span className="cat-range-value">R$ {priceRange[0]} – R$ {priceRange[1]}</span>
        </h3>
        <div className="cat-dual-range">
          <input
            type="range" min={0} max={500} step={5}
            value={priceRange[0]}
            onChange={e => {
              const v = Math.min(Number(e.target.value), priceRange[1] - 5);
              onPriceChange([v, priceRange[1]]);
            }}
            className="cat-range-input"
          />
          <input
            type="range" min={0} max={500} step={5}
            value={priceRange[1]}
            onChange={e => {
              const v = Math.max(Number(e.target.value), priceRange[0] + 5);
              onPriceChange([priceRange[0], v]);
            }}
            className="cat-range-input"
          />
          <div
            className="cat-range-track-fill"
            style={{
              left:  `${(priceRange[0] / 500) * 100}%`,
              right: `${100 - (priceRange[1] / 500) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Ano de lançamento */}
      <div className="cat-filter-group">
        <h3 className="cat-filter-label">
          Ano de lançamento&ensp;
          <span className="cat-range-value">{yearRange[0]} – {yearRange[1]}</span>
        </h3>
        <div className="cat-dual-range">
          <input
            type="range" min={2000} max={CURRENT_YEAR} step={1}
            value={yearRange[0]}
            onChange={e => {
              const v = Math.min(Number(e.target.value), yearRange[1] - 1);
              onYearChange([v, yearRange[1]]);
            }}
            className="cat-range-input"
          />
          <input
            type="range" min={2000} max={CURRENT_YEAR} step={1}
            value={yearRange[1]}
            onChange={e => {
              const v = Math.max(Number(e.target.value), yearRange[0] + 1);
              onYearChange([yearRange[0], v]);
            }}
            className="cat-range-input"
          />
          <div
            className="cat-range-track-fill"
            style={{
              left:  `${((yearRange[0] - 2000) / (CURRENT_YEAR - 2000)) * 100}%`,
              right: `${100 - ((yearRange[1] - 2000) / (CURRENT_YEAR - 2000)) * 100}%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
