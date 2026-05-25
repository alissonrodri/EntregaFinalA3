import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }

    const fetchCart = async () => {
      try {
      
        const cartRes = await api.get('/carrinho/ativo', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (cartRes.data.message === 'Carrinho vazio.' || !cartRes.data.carrinho) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        const itens = cartRes.data.carrinho.itens || [];

   
        const [publicRes, authRes] = await Promise.all([
          api.get('/public/jogos'),
          api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
        const authGames   = Array.isArray(authRes.data)   ? authRes.data   : [];

        const enriched = itens.map(item => {
          const authGame   = authGames.find(g => g.id === item.fkJogo);
          const publicGame = authGame
            ? publicGames.find(g => g.nome === authGame.nome)
            : null;

          return {
            ...item,
            nome:      authGame?.nome        || `Jogo #${item.fkJogo}`,
            descricao: authGame?.descricao   || '—',
            preco:     authGame?.preco       ?? null,
            desconto:  authGame?.desconto    ?? null,
            categoria: publicGame?.categoria    || '—',
            empresa:   publicGame?.empresa_nome || '—',
          };
        });

        setCartItems(enriched);
      } catch (err) {
        console.error("Erro ao buscar carrinho:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [navigate]);

  const handleRemove = (gameId) => {
    const token = localStorage.getItem('token');
    api.delete(`/carrinho/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setCartItems(prev => prev.filter(i => i.fkJogo !== gameId));
      // Atualiza o contador da navbar
      window.dispatchEvent(new Event('cartUpdated'));
    }).catch((err) => {
      console.error("Erro ao remover item:", err);
    });
  };

  const handleCoupon = () => {
    if (!coupon.trim()) return;
    // Por enquanto apenas visual — nenhum cupom é válido
    setCouponMsg({ type: 'error', text: 'Cupom inválido ou expirado.' });
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const preco = parseFloat(item.preco) || 0;
    const desconto = parseFloat(item.desconto) || 0;
    return acc + (desconto > 0 ? preco * (1 - desconto / 100) : preco);
  }, 0);

  const isCartEmpty = cartItems.length === 0;

  if (loading) {
    return <div className="cart-page-loading">Carregando as informações do seu carrinho...</div>;
  }

  return (
    <main className="cart-container">
      <h1 className="page-title">Meu Carrinho</h1>

      <div className="cart-layout">

        {/* Lista de itens */}
        <section className="cart-items-section">
          <div id="cart-list">
            {!isCartEmpty ? (
              cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-img-placeholder">🎮</div>

                  <div className="item-details">
                     <Link to={`/game/${encodeURIComponent(item.nome)}`} className="item-name-link">
                      <h3 className="item-name">{item.nome}</h3>
                    </Link>
                    <span className="item-category">{item.categoria}</span>
                    <p className="item-meta">{item.descricao}</p>
                  </div>

                  <div className="item-price-area">
                    {item.desconto ? (
                      <>
                        <p className="item-price-original">R$ {formatPrice(item.preco)}</p>
                        <p className="item-price">
                          R$ {formatPrice(item.preco * (1 - item.desconto / 100))}
                        </p>
                        <span className="item-discount-badge">-{item.desconto}%</span>
                      </>
                    ) : (
                      <p className="item-price">
                        {item.preco !== null ? `R$ ${formatPrice(item.preco)}` : '—'}
                      </p>
                    )}
                    <button
                      className="btn-remove-item"
                      onClick={() => handleRemove(item.fkJogo)}
                      title="Remover item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="cart-empty-box">
                <span className="cart-empty-icon">🛒</span>
                <h3>Seu carrinho está vazio</h3>
                <p>Parece que você ainda não adicionou nenhum jogo à sua lista de compras.</p>
                <Link to="/" className="btn-browse-store">Explorar a Loja</Link>
              </div>
            )}
          </div>
        </section>

        {/* Resumo do pedido */}
        <aside className="cart-summary">
          <h2 className="summary-title">Resumo do Pedido</h2>

          <div className="summary-details">
            <div className="summary-line">
              <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})</span>
              <span>R$ {formatPrice(subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>Descontos</span>
              <span className="discount">- R$ 0,00</span>
            </div>

            {/* Cupom de desconto */}
            <div className="coupon-section">
              <p className="coupon-label">Cupom de desconto</p>
              <div className="coupon-input-row">
                <input
                  type="text"
                  className="coupon-input"
                  placeholder="Insira seu cupom"
                  value={coupon}
                  onChange={e => { setCoupon(e.target.value); setCouponMsg(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                />
                <button className="btn-apply-coupon" onClick={handleCoupon}>
                  Aplicar
                </button>
              </div>
              {couponMsg && (
                <p className={`coupon-msg coupon-msg--${couponMsg.type}`}>{couponMsg.text}</p>
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-line total">
              <span>Total</span>
              <span>R$ {formatPrice(subtotal)}</span>
            </div>
          </div>

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={isCartEmpty}
          >
            Finalizar Compra
          </button>
          <Link to="/" className="btn-continue">Continuar Comprando</Link>
        </aside>

      </div>
    </main>
  );
}

export default CartPage;