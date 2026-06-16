import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});
  const [cartItems, setCartItems] = useState(new Set());
  const [ownedItems, setOwnedItems] = useState(new Set());
  const [avgRatings, setAvgRatings] = useState({});
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameToRemove, setGameToRemove] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchWishlist = async () => {
      try {
        const [wishRes, publicRes, cartRes, myGamesRes] = await Promise.all([
          api.get("/lista-desejo", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/public/jogos"),
          api
            .get("/carrinho/ativo", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((err) => {
              console.info(
                "Aviso: Carrinho não encontrado ou vazio.",
                err.message,
              );
              return { data: {} };
            }),
          api
            .get("/usuarios/my/games", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((err) => {
              console.warn(
                "Aviso: Não foi possível checar a biblioteca.",
                err.message,
              );
              return { data: [] };
            }),
        ]);

        const wishGames = Array.isArray(wishRes.data) ? wishRes.data : [];
        const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
        const cartData = cartRes.data?.carrinho?.itens || [];

        setCartItems(new Set(cartData.map((item) => item.fkJogo)));

        const myGamesData = Array.isArray(myGamesRes.data)
          ? myGamesRes.data
          : [];
        const comprados = myGamesData.filter(
          (item) => item.chaveAtivacao && item.chaveAtivacao.trim() !== "",
        );
        setOwnedItems(new Set(comprados.map((item) => item.jogo?.id)));

        const enriched = wishGames.map((game) => {
          const publicGame = publicGames.find((g) => g.nome === game.nome);
          return {
            ...game,
            categoria: publicGame?.categoria || "—",
            empresa: publicGame?.empresa_nome || "—",
          };
        });

        setWishlist(enriched);

        const ratingsMap = {};
        await Promise.all(
          enriched.map(async (game) => {
            try {
              const rRes = await api.get(`/avaliacoes/media/${game.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (rRes.status !== 204 && rRes.data?.media) {
                ratingsMap[game.id] = {
                  media: rRes.data.media,
                  total: rRes.data.totalAvaliacoes,
                };
              }
            } catch (err) {
              console.info(
                `Aviso: Nenhuma avaliação encontrada para o jogo ${game.id}.`,
                err.message,
              );
            }
          }),
        );
        setAvgRatings(ratingsMap);
      } catch (err) {
        console.error(
          "Erro ao carregar os dados da lista de desejos:",
          err.message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const handleRemoveClick = (game) => {
    setGameToRemove(game);
    setIsModalOpen(true);
  };

  const handleCancelRemove = () => {
    setIsModalOpen(false);
    setGameToRemove(null);
  };

  const handleConfirmRemove = async () => {
    if (!gameToRemove) return;
    const token = localStorage.getItem("token");
    try {
      await api.delete("/lista-desejo", {
        headers: { Authorization: `Bearer ${token}` },
        data: { jogoId: gameToRemove.id },
      });
      setWishlist((prev) => prev.filter((g) => g.id !== gameToRemove.id));
    } catch (err) {
      console.error("Erro ao remover o item da lista de desejos:", err.message);
    } finally {
      setIsModalOpen(false);
      setGameToRemove(null);
    }
  };

  const handleMoveToCart = async (game) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    if (cartItems.has(game.id)) {
      navigate("/cart");
      return;
    }

    const processSuccess = () => {
      setAddedItems((prev) => ({ ...prev, [game.id]: true }));
      window.dispatchEvent(new Event("cartUpdated"));

      api
        .delete("/lista-desejo", {
          headers: { Authorization: `Bearer ${token}` },
          data: { jogoId: game.id },
        })
        .catch((err) =>
          console.error(
            "Erro secundário ao remover da lista de desejos após envio ao carrinho:",
            err.message,
          ),
        );

      setTimeout(() => {
        setWishlist((prev) => prev.filter((g) => g.id !== game.id));
        setAddedItems((prev) => {
          const next = { ...prev };
          delete next[game.id];
          return next;
        });
        setCartItems((prev) => {
          const next = new Set(prev);
          next.add(game.id);
          return next;
        });
      }, 2000);
    };

    try {
      await api.post(
        "/carrinho/add",
        { jogoId: game.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      processSuccess();
    } catch (err) {
      if (err.response?.status === 400) {
        processSuccess();
      } else {
        alert(`Erro ao adicionar ao carrinho: ${err.message}`);
      }
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0,00" : num.toFixed(2).replace(".", ",");
  };

  if (loading) {
    return (
      <div className="wishlist-loading">Carregando sua lista de desejos...</div>
    );
  }

  return (
    <main className="wishlist-container">
      <header className="wishlist-header">
        <h1 className="wishlist-title">Minha Lista de Desejos</h1>
        <p className="wishlist-description">
          Aqui estão os jogos que você salvou para comprar depois.
        </p>
      </header>

      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <span className="wishlist-empty-icon material-symbols-outlined">
            favorite_border
          </span>
          <h3>Sua lista de desejos está vazia</h3>
          <p>Explore a loja e salve os jogos que você quer comprar depois.</p>
          <Link to="/" className="btn-browse-store">
            Explorar a Loja
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid" id="wishlist-grid">
          {wishlist.map((game) => {
            const isOwned = ownedItems.has(game.id);
            const ratingObj = avgRatings[game.id] || { media: 0, total: 0 };
            const ratingMedia = ratingObj.media;
            const ratingTotal = ratingObj.total;

            return (
              <article key={game.id} className="wishlist-card">
                <Link
                  to={`/game/${encodeURIComponent(game.nome)}`}
                  className="wishlist-media"
                >
                  <span className="material-symbols-outlined">
                    sports_esports
                  </span>
                </Link>
                <div className="wishlist-info">
                  <h3 className="game-name">{game.nome}</h3>
                  <p className="game-meta">
                    {game.categoria} · {game.ano}
                  </p>

                  <div className="game-rating-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`material-symbols-outlined wish-star ${s <= Math.round(ratingMedia) ? "filled" : ""}`}
                      >
                        star
                      </span>
                    ))}
                    <span className="wish-rating-value">
                      {ratingMedia > 0 ? ratingMedia.toFixed(1) : "0.0"}
                    </span>
                    <span className="wish-rating-count">({ratingTotal})</span>
                  </div>

                  {game.descricao && (
                    <p className="game-description">{game.descricao}</p>
                  )}
                  <div className="game-price-row">
                    {game.desconto ? (
                      <>
                        <span className="game-price-original">
                          R$ {formatPrice(game.preco)}
                        </span>
                        <span className="game-price">
                          R${" "}
                          {formatPrice(game.preco * (1 - game.desconto / 100))}
                        </span>
                        <span className="game-discount-badge">
                          -{game.desconto}%
                        </span>
                      </>
                    ) : (
                      <span className="game-price">
                        R$ {formatPrice(game.preco)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="wishlist-actions">
                  {isOwned ? (
                    <button
                      className="btn-owned"
                      onClick={() => navigate("/library")}
                    >
                      <span className="material-symbols-outlined">check</span>{" "}
                      Na sua biblioteca
                    </button>
                  ) : (
                    <button
                      className={`btn-move-to-cart ${addedItems[game.id] ? "btn-success" : cartItems.has(game.id) ? "btn-in-cart" : ""}`}
                      onClick={() => handleMoveToCart(game)}
                      disabled={addedItems[game.id]}
                    >
                      {addedItems[game.id] ? (
                        <>
                          <span className="material-symbols-outlined">
                            check
                          </span>{" "}
                          Adicionado!
                        </>
                      ) : cartItems.has(game.id) ? (
                        "No carrinho"
                      ) : (
                        <>
                          <span className="material-symbols-outlined">
                            shopping_cart
                          </span>{" "}
                          Adicionar ao carrinho
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    to={`/game/${encodeURIComponent(game.nome)}`}
                    className="btn-details"
                  >
                    Ver detalhes
                  </Link>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveClick(game)}
                    disabled={addedItems[game.id]}
                    title="Remover da lista de desejos"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isModalOpen && gameToRemove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Remover da Lista?</h2>
            <p className="modal-desc">
              Tem certeza que deseja remover{" "}
              <strong>{gameToRemove.nome}</strong> da sua lista de desejos?
            </p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={handleCancelRemove}>
                Cancelar
              </button>
              <button
                className="btn-modal-confirm"
                onClick={handleConfirmRemove}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Wishlist;
