import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    api.get('/carrinho/ativo', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      if (res.data.message === 'Carrinho vazio.' || !res.data.carrinho) {
        setCart({ itens: [] });
      } else {
        setCart(res.data.carrinho);
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error("Erro ao buscar carrinho:", err);
      setLoading(false);
    });
  }, [navigate]);

  const handleRemove = (gameId) => {
    const token = localStorage.getItem('token');
    api.delete(`/carrinho/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setCart(prev => ({ 
        ...prev, 
        itens: prev.itens.filter(i => i.fkJogo !== gameId) 
      }));
    }).catch((err) => {
      console.error("Erro ao remover item:", err);
    });
  };

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    api.post('/vendas/checkout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      alert("Compra finalizada com sucesso! Os jogos foram adicionados à sua biblioteca.");
      navigate('/library');
    }).catch((err) => {
      console.error("Erro ao finalizar compra:", err);
      alert("Ocorreu um erro ao processar o seu pedido.");
    });
  };

  if (loading) {
    return <div className="cart-page-loading">Carregando as informações do seu carrinho...</div>;
  }

  const isCartEmpty = !cart || !cart.itens || cart.itens.length === 0;

  return (
    <main className="cart-container">
     
      <h1 className="page-title">Meu Carrinho</h1>
      
      <div className="cart-layout">
        
        <section className="cart-items-section">
          <div id="cart-list">
            
            {!isCartEmpty ? (
              cart.itens.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-img-placeholder">🎮</div>
                  <div className="item-details">
                    <h3 className="item-name">Jogo ID: {item.fkJogo}</h3>
                    <span className="item-category">Digital</span>
                  </div>
                  <div className="item-price-area">
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

        <aside className="cart-summary">
          <h2 className="summary-title">Resumo do Pedido</h2>
          <div className="summary-details">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{isCartEmpty ? "R$ 0,00" : "Calculando..."}</span>
            </div>
            <div className="summary-line">
              <span>Descontos</span>
              <span className="discount">- R$ 0,00</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-line total">
              <span>Total</span>
              <span>{isCartEmpty ? "R$ 0,00" : "Calculando..."}</span>
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