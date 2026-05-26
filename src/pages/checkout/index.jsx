import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './index.css';


function getUserId() {
  try {
    const token   = localStorage.getItem('token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? payload.sub ?? payload.userId ?? 'guest';
  } catch {
    return 'guest';
  }
}

const formatPrice = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',');
};

const maskCard = (v) =>
  v.replace(/\D/g, '')
   .slice(0, 16)
   .replace(/(.{4})/g, '$1 ')
   .trim();

const maskExpiry = (v) =>
  v.replace(/\D/g, '')
   .slice(0, 4)
   .replace(/^(\d{2})(\d)/, '$1/$2');

const maskCVV  = (v) => v.replace(/\D/g, '').slice(0, 3);
const maskCPF  = (v) =>
  v.replace(/\D/g, '')
   .slice(0, 11)
   .replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
     d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a
   );


function CardForm({ onSubmit, loading }) {
  const [numero, setNumero]   = useState('');
  const [nome, setNome]       = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv]         = useState('');
  const [parcelas, setParcelas] = useState('1');

  const handleSubmit = () => {
    if (!numero || !nome || !validade || !cvv) {
      alert('Preencha todos os campos do cartão.');
      return;
    }
    onSubmit({
      metodo: 'cartao',
      dados: { numero: numero.replace(/\s/g, ''), nome, validade, cvv, parcelas },
    });
  };

  return (
    <div className="pay-form">
      <div className="pay-field">
        <label>Número do cartão</label>
        <input
          placeholder="0000 0000 0000 0000"
          value={numero}
          onChange={e => setNumero(maskCard(e.target.value))}
        />
      </div>
      <div className="pay-field">
        <label>Nome no cartão</label>
        <input
          placeholder="Como aparece no cartão"
          value={nome}
          onChange={e => setNome(e.target.value.toUpperCase())}
        />
      </div>
      <div className="pay-row">
        <div className="pay-field">
          <label>Validade</label>
          <input
            placeholder="MM/AA"
            value={validade}
            onChange={e => setValidade(maskExpiry(e.target.value))}
          />
        </div>
        <div className="pay-field">
          <label>CVV</label>
          <input
            placeholder="123"
            value={cvv}
            onChange={e => setCvv(maskCVV(e.target.value))}
            type="password"
          />
        </div>
      </div>
      <div className="pay-field">
        <label>Parcelas</label>
        <select value={parcelas} onChange={e => setParcelas(e.target.value)}>
          {[1,2,3,6,12].map(n => (
            <option key={n} value={n}>
              {n}x {n === 1 ? '(à vista)' : 'sem juros'}
            </option>
          ))}
        </select>
      </div>
      <button className="pay-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? <><span className="pay-spinner" /> Processando…</> : '🔒 Pagar agora'}
      </button>
    </div>
  );
}


function BoletoForm({ onSubmit, loading }) {
  const [cpf, setCpf] = useState('');

  const handleSubmit = () => {
    if (cpf.replace(/\D/g, '').length < 11) {
      alert('Informe um CPF válido.');
      return;
    }
    onSubmit({ metodo: 'boleto', dados: { cpf } });
  };

  return (
    <div className="pay-form">
      <div className="pay-info-box">
        <span className="pay-info-icon">ℹ️</span>
        <p>O boleto será gerado após a confirmação. O pagamento compensa em até 3 dias úteis e os jogos serão liberados automaticamente.</p>
      </div>
      <div className="pay-field">
        <label>CPF do pagador</label>
        <input
          placeholder="000.000.000-00"
          value={cpf}
          onChange={e => setCpf(maskCPF(e.target.value))}
        />
      </div>
      <button className="pay-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? <><span className="pay-spinner" /> Gerando boleto…</> : '📄 Gerar boleto'}
      </button>
    </div>
  );
}


function PixForm({ onSubmit, loading }) {
  const handleSubmit = () => {
    onSubmit({ metodo: 'pix', dados: {} });
  };

  return (
    <div className="pay-form">
      <div className="pay-info-box">
        <span className="pay-info-icon">⚡</span>
        <p>Pague instantaneamente via Pix. Após a confirmação, os jogos são liberados em segundos.</p>
      </div>
      <div className="pay-pix-preview">
        <div className="pay-pix-qr">
          <div className="pay-pix-qr-inner">
            <span>QR</span>
            <span className="pay-pix-qr-sub">Simulado</span>
          </div>
        </div>
        <p className="pay-pix-copy-label">Chave Pix (copia e cola)</p>
        <div className="pay-pix-copy-row">
          <code className="pay-pix-key">clt-gaming@pagamentos.pix</code>
          <button
            className="pay-pix-copy-btn"
            onClick={() => navigator.clipboard?.writeText('clt-gaming@pagamentos.pix')}
          >
            Copiar
          </button>
        </div>
      </div>
      <button className="pay-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? <><span className="pay-spinner" /> Confirmando…</> : '✅ Confirmar pagamento Pix'}
      </button>
    </div>
  );
}


function SuccessScreen({ metodo }) {
  const navigate = useNavigate();
  const messages = {
    cartao: { icon: '💳', title: 'Pagamento aprovado!', sub: 'Seu cartão foi debitado com sucesso.' },
    boleto: { icon: '📄', title: 'Boleto gerado!',       sub: 'Pague até o vencimento para liberar os jogos.' },
    pix:    { icon: '⚡', title: 'Pix confirmado!',      sub: 'Seus jogos já estão na biblioteca.' },
  };
  const { icon, title, sub } = messages[metodo] || messages.cartao;

  return (
    <div className="pay-success">
      <span className="pay-success-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{sub}</p>
      <button className="pay-btn pay-btn--success" onClick={() => navigate('/library')}>
        Ir para a Biblioteca
      </button>
    </div>
  );
}


export default function Checkout() {
  const navigate = useNavigate();
  const [method, setMethod]   = useState('cartao'); 
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [usedMethod, setUsedMethod] = useState('');

 
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const load = async () => {
      try {
        const cartRes = await api.get('/carrinho/ativo');

        if (cartRes.data.message === 'Carrinho vazio.' || !cartRes.data.carrinho) {
          navigate('/cart');
          return;
        }

        const itens = cartRes.data.carrinho.itens || [];
        const [publicRes, authRes] = await Promise.all([
          api.get('/public/jogos'),
          api.get('/jogos'),
        ]);
        const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
        const authGames   = Array.isArray(authRes.data)   ? authRes.data   : [];

        const enriched = itens.map(item => {
          const auth   = authGames.find(g => g.id === item.fkJogo);
          const pub    = auth ? publicGames.find(g => g.nome === auth.nome) : null;
          return {
            ...item,
            nome:  auth?.nome  || `Jogo #${item.fkJogo}`,
            preco: auth?.preco ?? 0,
            desconto: auth?.desconto ?? 0,
            categoria: pub?.categoria || '—',
          };
        });

        setCartItems(enriched);
      } catch (err) {
        console.error('Erro ao carregar carrinho para checkout:', err);
        navigate('/cart');
      } finally {
        setCartLoading(false);
      }
    };

    load();
  }, [navigate]);

  const subtotal = cartItems.reduce((acc, item) => {
    const p = parseFloat(item.preco) || 0;
    const d = parseFloat(item.desconto) || 0;
    return acc + (d > 0 ? p * (1 - d / 100) : p);
  }, 0);

  const handlePay = async ({ metodo, dados }) => {
    setLoading(true);
    try {
      // 1. Registra o pagamento
      await api.post('/vendas/pay', { metodo, dados });

      // 2. Faz o checkout (finaliza o carrinho e gera a venda)
      await api.post('/vendas/checkout');

      // 3. Persiste os IDs na biblioteca local
      const userId     = getUserId();
      const storageKey = `purchasedGameIds_${userId}`;
      const currentIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newIds     = cartItems.map(i => i.fkJogo);
      localStorage.setItem(storageKey, JSON.stringify([...new Set([...currentIds, ...newIds])]));

      // 4. Zera contador do carrinho na navbar
      localStorage.setItem('cartCount', '0');
      window.dispatchEvent(new Event('cartUpdated'));

      setUsedMethod(metodo);
      setDone(true);
    } catch (err) {
      console.error('Erro no pagamento:', err);
      alert(`Erro ao processar pagamento: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="pay-page-loading">
        <span className="pay-spinner pay-spinner--lg" />
        <p>Preparando o checkout…</p>
      </div>
    );
  }

  if (done) return <SuccessScreen metodo={usedMethod} />;

  return (
    <div className="pay-page">
      <div className="pay-page-inner">

        {/* ── Coluna esquerda: método de pagamento ── */}
        <section className="pay-section">
          <h1 className="pay-title">Finalizar compra</h1>

          {/* Seletor de método */}
          <div className="pay-method-tabs">
            {[
              { id: 'cartao', label: '💳 Cartão' },
              { id: 'pix',    label: '⚡ Pix' },
              { id: 'boleto', label: '📄 Boleto' },
            ].map(m => (
              <button
                key={m.id}
                className={`pay-method-tab ${method === m.id ? 'active' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === 'cartao' && <CardForm  onSubmit={handlePay} loading={loading} />}
          {method === 'pix'    && <PixForm   onSubmit={handlePay} loading={loading} />}
          {method === 'boleto' && <BoletoForm onSubmit={handlePay} loading={loading} />}
        </section>

        
        <aside className="pay-summary">
          <h2 className="pay-summary-title">Resumo do pedido</h2>

          <div className="pay-summary-items">
            {cartItems.map(item => {
              const p = parseFloat(item.preco) || 0;
              const d = parseFloat(item.desconto) || 0;
              const final = d > 0 ? p * (1 - d / 100) : p;
              return (
                <div key={item.id} className="pay-summary-item">
                  <span className="pay-summary-item-icon">🎮</span>
                  <div className="pay-summary-item-info">
                    <p className="pay-summary-item-name">{item.nome}</p>
                    <p className="pay-summary-item-cat">{item.categoria}</p>
                  </div>
                  <div className="pay-summary-item-price">
                    {d > 0 && (
                      <span className="pay-summary-original">R$ {formatPrice(p)}</span>
                    )}
                    <span>R$ {formatPrice(final)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pay-summary-divider" />

          <div className="pay-summary-total">
            <span>Total</span>
            <span>R$ {formatPrice(subtotal)}</span>
          </div>

          <Link to="/cart" className="pay-back-link">← Voltar ao carrinho</Link>
        </aside>
      </div>
    </div>
  );
}