import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

const formatPrice = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',');
};

const formatDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const METHOD_LABEL = {
  cartao: '💳 Cartão de crédito',
  pix:    '⚡ Pix',
  boleto: '📄 Boleto bancário',
};

function getPaymentMeta(vendaId) {
  try {
    const raw = localStorage.getItem(`paymentMeta_${vendaId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ActivationKeyBadge({ chave }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(chave).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="hist-key-row">
      <code className="hist-key">{chave || 'XXXX-XXXX-XXXX-XXXX'}</code>
      <button className="hist-key-copy" onClick={handleCopy} title="Copiar chave">
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  );
}

function VendaCard({ venda, jogos }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getPaymentMeta(venda.id);

  const metodo   = meta?.metodo   || null;
  const parcelas = meta?.parcelas || null;

  return (
    <article className="hist-card">
      <div className="hist-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="hist-card-header-left">
          <span className="hist-order-id">Pedido #{String(venda.id).padStart(5, '0')}</span>
          <div className="hist-meta-row">
            <span className="hist-meta-item">📅 {formatDate(venda.data)}</span>
            <span className="hist-meta-sep">·</span>
            <span className="hist-meta-item">🕐 {formatTime(venda.data)}</span>
            <span className="hist-meta-sep">·</span>
            <span className="hist-meta-item">
              🎮 {venda.quantidade} {venda.quantidade === 1 ? 'jogo' : 'jogos'}
            </span>
            {metodo && (
              <>
                <span className="hist-meta-sep">·</span>
                <span className="hist-meta-item">
                  {METHOD_LABEL[metodo] || metodo}
                  {metodo === 'cartao' && parcelas && parcelas > 1
                    ? ` · ${parcelas}x`
                    : ''}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="hist-card-header-right">
          <span className="hist-total">R$ {formatPrice(venda.valor_total)}</span>
          <span className={`hist-chevron ${expanded ? 'expanded' : ''}`}>›</span>
        </div>
      </div>

      {expanded && (
        <div className="hist-card-body">
          {jogos.length === 0 ? (
            <p className="hist-no-items">Detalhes dos itens indisponíveis.</p>
          ) : (
            jogos.map((item, i) => (
              <div key={i} className="hist-item">
                <div className="hist-item-icon">🎮</div>
                <div className="hist-item-info">
                  {item.isDeleted ? (
                    <span className="hist-item-name" style={{ color: 'var(--text-muted)' }}>
                      {item.nome}
                    </span>
                  ) : (
                    <Link to={`/game/${encodeURIComponent(item.nome)}`} className="hist-item-name">
                      {item.nome}
                    </Link>
                  )}
                  <p className="hist-item-meta">{item.categoria || '—'} · {item.empresa || '—'}</p>
                  <ActivationKeyBadge chave={item.chave_ativacao} />
                </div>
                <div className="hist-item-price">
                  R$ {formatPrice(item.preco)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [vendas, setVendas]     = useState([]);
  const [itensMap, setItensMap] = useState({}); 
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const load = async () => {
      try {
        const vendasRes = await api.get('/vendas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vendasData = Array.isArray(vendasRes.data) ? vendasRes.data : [];

        if (vendasData.length === 0) {
          setVendas([]);
          setLoading(false);
          return;
        }

        setVendas(vendasData);

        const [publicRes, authRes] = await Promise.all([
          api.get('/public/jogos').catch(() => ({ data: [] })),
          api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        ]);

        const publicGames = Array.isArray(publicRes.data) ? publicRes.data : [];
        const authGames   = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const userId      = getUserId();

        const storageKey = `purchasedGameIds_${userId}`;
        const allIds     = JSON.parse(localStorage.getItem(storageKey) || '[]');

       
        const enrichedGames = allIds.map(id => {
          const auth = authGames.find(g => g.id === id);
          const chave = localStorage.getItem(`activationKey_${id}_${userId}`) || generateFakeKey(id);
      
          if (!localStorage.getItem(`activationKey_${id}_${userId}`)) {
            localStorage.setItem(`activationKey_${id}_${userId}`, chave);
          }

          if (!auth) {
           
            return {
              id: id,
              nome: 'Item Indisponível no Catálogo',
              categoria: '—',
              empresa: '—',
              preco: 0,
              chave_ativacao: chave,
              isDeleted: true
            };
          }

          const pub  = publicGames.find(g => g.nome === auth.nome);
          return {
            ...auth,
            categoria: pub?.categoria    || '—',
            empresa:   pub?.empresa_nome || '—',
            chave_ativacao: chave,
          };
        });
       
        const map = {};
        let cursor = 0;
        
        const sorted = [...vendasData].sort((a, b) => a.id - b.id);
        
        sorted.forEach(v => {
          const slice = enrichedGames.slice(cursor, cursor + v.quantidade).map(item => {
           
            const priceKey = `frozenPrice_${v.id}_${item.id}`;
            let frozenPrice = localStorage.getItem(priceKey);

            if (!frozenPrice && !item.isDeleted) {
              frozenPrice = item.preco;
              localStorage.setItem(priceKey, frozenPrice);
            } else if (frozenPrice) {
              frozenPrice = parseFloat(frozenPrice);
            } else {
              frozenPrice = 0;
            }

            return {
              ...item,
              preco: frozenPrice
            };
          });

          map[v.id] = slice;
          cursor += v.quantidade;
        });

        setItensMap(map);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="hist-loading">
        <span className="hist-spinner" />
        <p>Carregando seu histórico…</p>
      </div>
    );
  }

  return (
    <main className="hist-container">
      <header className="hist-header">
        <div>
          <h1 className="hist-title">Histórico de Compras</h1>
          <p className="hist-desc">
            {vendas.length > 0
              ? `${vendas.length} ${vendas.length === 1 ? 'pedido realizado' : 'pedidos realizados'}`
              : 'Nenhuma compra realizada ainda'}
          </p>
        </div>
      </header>

      {vendas.length === 0 ? (
        <div className="hist-empty">
          <span className="hist-empty-icon">🧾</span>
          <h3>Nenhuma compra ainda</h3>
          <p>Quando você finalizar um pedido, ele aparecerá aqui com todos os detalhes.</p>
          <Link to="/" className="hist-empty-btn">Explorar a Loja</Link>
        </div>
      ) : (
        <div className="hist-list">
          {[...vendas].reverse().map(venda => (
            <VendaCard
              key={venda.id}
              venda={venda}
              jogos={itensMap[venda.id] || []}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function getUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? payload.sub ?? payload.userId ?? 'guest';
  } catch {
    return 'guest';
  }
}

function generateFakeKey(seed) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = seed * 9301 + 49297;
  const seg = () => {
    let r = '';
    for (let i = 0; i < 4; i++) {
      s = (s * 9301 + 49297) % 233280;
      r += chars[s % chars.length];
    }
    return r;
  };
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}