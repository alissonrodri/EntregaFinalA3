import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function LibraryCard({ game }) {
  return (
    <article className="lib-card">
      <Link
        to={`/game/${encodeURIComponent(game.nome)}`}
        className="lib-card-media"
      >
        <span className="lib-card-icon">
          <span className="material-symbols-outlined">sports_esports</span>
        </span>
        <span className="lib-card-category">{game.categoria || "—"}</span>
      </Link>

      <div className="lib-card-body">
        <Link
          to={`/game/${encodeURIComponent(game.nome)}`}
          className="item-name-link"
        >
          <h3 className="lib-card-title">{game.nome}</h3>
        </Link>

        <p className="lib-card-meta">{game.empresa_nome || "—"}</p>
      </div>

      <div className="lib-card-actions">
        <div className="lib-activation-key">
          <span className="material-symbols-outlined">key</span>
          <span className="lib-activation-key-value">
            {game.chaveAtivacao || "—"}
          </span>
        </div>
      </div>
    </article>
  );
}

function Library() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLibrary = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    try {
      const [myGamesRes, publicRes] = await Promise.all([
        api.get("/usuarios/my/games"),
        api.get("/public/jogos"),
      ]);

      const myGames = Array.isArray(myGamesRes.data) ? myGamesRes.data : [];
      const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
      const jogosComprados = myGames.filter(
        (item) => item.chaveAtivacao && item.chaveAtivacao.trim() !== "",
      );

      const libraryGames = jogosComprados.map(({ jogo, chaveAtivacao }) => {
        const publicGame = publicGames.find((g) => g.nome === jogo.nome);
        return {
          ...jogo,
          chaveAtivacao,
          categoria: publicGame?.categoria || "—",
          empresa_nome: publicGame?.empresa_nome || "—",
        };
      });

      setGames(libraryGames);
    } catch (err) {
      console.error("Erro ao carregar biblioteca:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setTimeout(() => {
      fetchLibrary();
    }, 0);
  }, [fetchLibrary]);

  const filtered = games.filter((g) =>
    g.nome.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="lib-loading">
        <span className="lib-loading-spinner" />
        <p>Carregando sua biblioteca…</p>
      </div>
    );
  }

  return (
    <main className="lib-container">
      <header className="lib-header">
        <div className="lib-header-top">
          <div>
            <h1 className="lib-title">Minha Biblioteca</h1>
            <p className="lib-desc">
              Gerencie sua coleção e inicie sua próxima aventura.
            </p>
          </div>
          <div className="lib-search-wrap">
            <span className="lib-search-icon">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              className="lib-search"
              type="text"
              placeholder="Buscar na biblioteca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="lib-tabs">
          <button className="lib-tab active">
            Todos os jogos
            <span className="lib-tab-count">{games.length}</span>
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="lib-empty">
          <span className="lib-empty-icon">
            <span className="material-symbols-outlined">sports_esports</span>
          </span>
          <h3>
            {search ? "Nenhum jogo encontrado" : "Sua biblioteca está vazia"}
          </h3>
          <p>
            {search
              ? "Tente outros termos de busca."
              : "Explore a loja e compre seus primeiros jogos!"}
          </p>
          {!search && (
            <Link to="/" className="lib-empty-btn">
              Explorar a Loja
            </Link>
          )}
        </div>
      ) : (
        <div className="lib-grid">
          {filtered.map((game) => (
            <LibraryCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Library;