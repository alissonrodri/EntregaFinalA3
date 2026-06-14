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
        const [vendasRes, myGamesRes, publicRes] = await Promise.all([
          api.get('/vendas'),
          api.get('/usuarios/my/games'),
          api.get('/public/jogos').catch(() => ({ data: [] })),
        ]);

        const vendasData  = Array.isArray(vendasRes.data)   ? vendasRes.data   : [];
        const myGames     = Array.isArray(myGamesRes.data)  ? myGamesRes.data  : [];
        const publicGames = Array.isArray(publicRes.data)   ? publicRes.data   : [];

        if (vendasData.length === 0) {
          setVendas([]);
          setLoading(false);
          return;
        }

       
        const enrichedGames = myGames.map(({ chaveAtivacao, jogo }) => {
          const pub = publicGames.find(g => g.nome === jogo.nome);
          return {
            ...jogo,
            chave_ativacao: chaveAtivacao,
            categoria: pub?.categoria    || '—',
            empresa:   pub?.empresa_nome || '—',
          };
        });

        
        const map = {};
        let cursor = 0;
        const sorted = [...vendasData].sort((a, b) => a.id - b.id);

        sorted.forEach(v => {
          map[v.id] = enrichedGames.slice(cursor, cursor + v.quantidade);
          cursor += v.quantidade;
        });

        setVendas(vendasData);
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