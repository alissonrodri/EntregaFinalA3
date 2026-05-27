import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function getUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? payload.sub ?? payload.userId ?? null;
  } catch (err) { 
    console.warn('Falha ao decodificar ID do token:', err.message);
    return null; 
  }
}

function getUserName() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.nome ?? '';
  } catch (err) { 
    console.warn('Falha ao decodificar nome do token:', err.message);
    return ''; 
  }
}

function getInitialsFromName(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (err) { 
    console.warn('Falha ao formatar data:', err.message);
    return null; 
  }
}

function StarDisplay({ rating, size = '1rem' }) {
  return (
    <div className="star-display" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= Math.round(rating || 0) ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  );
}

function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame]                 = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [btnState, setBtnState]         = useState('idle');
  const [wishState, setWishState]       = useState('idle');
  const [activeMedia, setActiveMedia]   = useState(0);
  const [isOwned, setIsOwned]           = useState(false);

  const [reviews, setReviews]           = useState([]);
  const [reviewerNames, setReviewerNames] = useState({});
  const [avgRating, setAvgRating]       = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview]     = useState(null);

  const [reviewText, setReviewText]     = useState('');
  const [userRating, setUserRating]     = useState(0);
  const [hoverRating, setHoverRating]   = useState(0);
  const [reviewMsg, setReviewMsg]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [isEditing, setIsEditing]       = useState(false); 
  const textareaRef = useRef(null);

  const mockMedia = [
    { id: 0, label: 'Trailer' },
    { id: 1, label: 'Gameplay 1' },
    { id: 2, label: 'Gameplay 2' },
    { id: 3, label: 'Cenário' },
  ];

  const btnConfig = {
    idle:      { text: 'Adicionar ao carrinho', disabled: false, className: '' },
    success:   { text: 'Adicionado! ✓',         disabled: true,  className: 'btn-success' },
    duplicate: { text: 'Já adicionado',         disabled: true,  className: 'btn-added' },
    already:   { text: 'No carrinho',           disabled: true,  className: 'btn-added' },
  };

  const wishConfig = {
    idle:    { text: '♡ Lista de desejos',    className: '' },
    added:   { text: '♥ Na lista de desejos', className: 'btn-wish-added' },
    already: { text: '♥ Na lista de desejos', className: 'btn-wish-added' },
  };

  const fetchReviewerNames = useCallback(async (reviewsList, token) => {
    const ids = [...new Set(reviewsList.map(r => r.fkUsuario))];
    const namesMap = {};
    await Promise.all(ids.map(async (uid) => {
      try {
        const res = await api.get(`/usuarios/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data?.nome) namesMap[uid] = res.data.nome;
      } catch (err) {
        console.info(`Nome do usuário ${uid} indisponível:`, err.message);
      }
    }));
    setReviewerNames(prev => ({ ...prev, ...namesMap }));
  }, []);

  const fetchReviews = useCallback(async (jogoId, token) => {
    try {
      const res = await api.get(`/avaliacoes/media/${jogoId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status !== 204 && res.data) {
        setAvgRating(res.data.media);
        setTotalReviews(res.data.totalAvaliacoes);
        const list = res.data.avaliacoes || [];
        setReviews(list);
        if (list.length > 0) fetchReviewerNames(list, token);
      }
    } catch (err) {
      console.info('Aviso: Nenhuma avaliação encontrada para este jogo ou acesso negado.', err.message);
    }
  }, [fetchReviewerNames]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(true);
      setWishState('idle');
      setBtnState('idle');
      setIsOwned(false);
      setReviews([]);
      setReviewerNames({});
      setAvgRating(null);
      setTotalReviews(0);
      setUserReview(null);
      setReviewText('');
      setUserRating(0);
      setReviewMsg(null);
      setIsEditing(false);
    }, 0);
    window.scrollTo(0, 0);

    api.get('/public/jogos')
      .then(async (response) => {
        const allGames  = Array.isArray(response.data) ? response.data : (response.data.jogos || []);
        const foundGame = allGames.find(g => g.nome === decodeURIComponent(id));

        if (foundGame) {
          let gameWithId = { ...foundGame };
          const token    = localStorage.getItem('token');

          if (token) {
            try {
              const authResponse  = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
              const authGamesList = Array.isArray(authResponse.data) ? authResponse.data : (authResponse.data.jogos || []);
              const authGame      = authGamesList.find(g => g.nome === foundGame.nome);

              if (authGame?.id) {
                gameWithId.id = authGame.id;

                const cartRes = await api.get('/carrinho/ativo', { headers: { Authorization: `Bearer ${token}` } });
                const itens   = cartRes.data.carrinho?.itens || [];
                if (itens.some(i => i.fkJogo === gameWithId.id)) setBtnState('already');

                const wishRes   = await api.get('/lista-desejo', { headers: { Authorization: `Bearer ${token}` } });
                const wishGames = Array.isArray(wishRes.data) ? wishRes.data : [];
                if (wishGames.some(g => g.id === gameWithId.id)) setWishState('already');

                const userId       = getUserId();
                const purchasedIds = JSON.parse(localStorage.getItem(`purchasedGameIds_${userId}`) || '[]');
                if (purchasedIds.includes(gameWithId.id)) setIsOwned(true);

                try {
                  const myReviewRes = await api.get(`/avaliacoes?jogoId=${gameWithId.id}`, { headers: { Authorization: `Bearer ${token}` } });
                  const rev = myReviewRes.data;
                  const isValid = rev && typeof rev === 'object' && typeof rev.nota === 'number' && rev.nota >= 1 && rev.nota <= 5;
                  if (isValid) {
                    setUserReview(rev);
                    setUserRating(rev.nota);
                    setReviewText(rev.comentario || '');
                    setIsEditing(false);
                  } else {
                    setUserReview(null);
                    setUserRating(0);
                    setReviewText('');
                    setIsEditing(true); 
                  }
                } catch (err) {
                  console.info('Formulário liberado: Avaliação prévia do usuário não encontrada.', err.message);
                  setUserReview(null);
                  setUserRating(0);
                  setReviewText('');
                  setIsEditing(true); 
                }

                await fetchReviews(gameWithId.id, token);
              }
            } catch (err) {
              console.warn('Acesso à listagem restrita de jogos indisponível:', err.message);
            }
          }

          setGame(gameWithId);

          const cat  = foundGame.categoria ? String(foundGame.categoria).trim().toLowerCase() : '';
          const recs = allGames.filter(g => {
            if (g.nome === foundGame.nome) return false;
            return cat && String(g.categoria).trim().toLowerCase() === cat;
          });
          setSimilarGames(recs.slice(0, 4));
        }
        setLoading(false);
      })
      .catch(err => { 
        console.error('Falha crítica ao buscar o catálogo de jogos:', err.message);
        setLoading(false); 
      });
  }, [id, fetchReviews]);

  const handleSubmitReview = async () => {
    if (!userRating) { setReviewMsg({ type: 'error', text: 'Selecione uma nota antes de publicar.' }); return; }
    const token = localStorage.getItem('token');
    if (!token) return;

    let finalGameId = game?.id;
    if (!finalGameId) {
      try {
        const authRes   = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match     = jogosList.find(g => g.nome === game.nome);
        if (match?.id) { finalGameId = match.id; setGame(prev => ({ ...prev, id: finalGameId })); }
        else { setReviewMsg({ type: 'error', text: 'Não foi possível identificar o jogo. Tente recarregar a página.' }); return; }
      } catch (err) { 
        setReviewMsg({ type: 'error', text: `Erro de mapeamento de jogo: ${err.message}` }); 
        return; 
      }
    }

    setSubmitting(true);
    setReviewMsg(null);
    try {
      if (userReview) {
        await api.put('/avaliacoes', { jogoId: finalGameId, nota: userRating, comentario: reviewText }, { headers: { Authorization: `Bearer ${token}` } });
        setReviewMsg({ type: 'success', text: 'Avaliação atualizada!' });
      } else {
        await api.post('/avaliacoes', { jogoId: finalGameId, nota: userRating, comentario: reviewText }, { headers: { Authorization: `Bearer ${token}` } });
        setReviewMsg({ type: 'success', text: 'Avaliação publicada com sucesso!' });
      }
      setUserReview({ nota: userRating, comentario: reviewText });
      setIsEditing(false);
      await fetchReviews(finalGameId, token);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao publicar avaliação.';
      setReviewMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setUserRating(userReview?.nota || 0);
    setReviewText(userReview?.comentario || '');
    setReviewMsg(null);
    setIsEditing(false);
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    let finalGameId = game?.id;
    if (!finalGameId) {
      try {
        const authRes   = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match     = jogosList.find(g => g.nome === game.nome);
        if (match?.id) { finalGameId = match.id; setGame(prev => ({ ...prev, id: finalGameId })); }
        else { alert('Não foi possível localizar o identificador único deste jogo.'); return; }
      } catch (err) { 
        alert(`Erro ao mapear identificador: ${err.response?.status || err.message}`); 
        return; 
      }
    }
    try {
      await api.post('/carrinho/add', { jogoId: finalGameId }, { headers: { Authorization: `Bearer ${token}` } });
      setBtnState('success');
      window.dispatchEvent(new Event('cartUpdated'));
      setTimeout(() => setBtnState('idle'), 2000);
    } catch (error) {
      if (error.response?.status === 400) { setBtnState('duplicate'); setTimeout(() => setBtnState('idle'), 2000); }
      else alert(`Erro ao processar adição ao carrinho: ${error.message}`);
    }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    if (btnState === 'already' || btnState === 'success') { navigate('/cart'); return; }
    let finalGameId = game?.id;
    if (!finalGameId) {
      try {
        const authRes   = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match     = jogosList.find(g => g.nome === game.nome);
        if (match?.id) { finalGameId = match.id; setGame(prev => ({ ...prev, id: finalGameId })); }
        else { alert('Não foi possível localizar o identificador único deste jogo.'); return; }
      } catch (err) { 
        alert(`Erro de comunicação na pré-compra: ${err.response?.status || err.message}`); 
        return; 
      }
    }
    try {
      await api.post('/carrinho/add', { jogoId: finalGameId }, { headers: { Authorization: `Bearer ${token}` } });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) { 
      if (error.response?.status !== 400) { 
        alert(`Não foi possível enviar item ao carrinho: ${error.message}`); 
        return; 
      } 
    }
    navigate('/cart');
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/signin'); return; }
    if (wishState === 'added' || wishState === 'already') {
      try {
        await api.delete('/lista-desejo', { headers: { Authorization: `Bearer ${token}` }, data: { jogoId: game.id } });
        setWishState('idle');
      } catch (err) { 
        console.error('Falha na remoção da lista de desejos:', err.message); 
      }
      return;
    }
    let finalGameId = game?.id;
    if (!finalGameId) {
      try {
        const authRes   = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
        const jogosList = Array.isArray(authRes.data) ? authRes.data : (authRes.data.jogos || []);
        const match     = jogosList.find(g => g.nome === game.nome);
        if (match?.id) { finalGameId = match.id; setGame(prev => ({ ...prev, id: finalGameId })); }
        else return;
      } catch (err) { 
        console.error('Resgate de ID para lista de desejos falhou:', err.message);
        return; 
      }
    }
    try {
      await api.post('/lista-desejo', { jogoId: finalGameId }, { headers: { Authorization: `Bearer ${token}` } });
      setWishState('added');
    } catch (err) { 
      if (err.response?.status === 409) setWishState('already'); 
      else console.error('Erro ao adicionar à lista de desejos:', err.message);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  };

  const btn = btnConfig[btnState];

  if (loading) return <div className="game-page-loading">Carregando informações do jogo...</div>;
  if (!game)   return (
    <div className="game-page-error">
      <h2>Jogo não encontrado</h2>
      <Link to="/" className="btn-back-home">Voltar para a loja</Link>
    </div>
  );

  return (
    <>
      <main className="game-page">

        <section className="game-hero">
          <div className="media-block">
            <div className="media-main"><span>{mockMedia[activeMedia].label}</span></div>
            <div className="media-thumbs">
              {mockMedia.map((media, index) => (
                <div key={media.id} className={`media-thumb ${activeMedia === index ? 'active' : ''}`} onClick={() => setActiveMedia(index)}>
                  {media.label}
                </div>
              ))}
            </div>
          </div>

          <aside className="game-sidebar">
            <div className="game-card">
              <div className="game-cover">🎮</div>
              <h1 className="game-card-title">{game.nome}</h1>

              <div className="game-card-meta">
                {game.categoria && <span className="game-tag">{game.categoria}</span>}
                <div className="game-card-rating">
                  <StarDisplay rating={avgRating || 0} size="0.95rem" />
                  {avgRating !== null && <span className="rating-value">{avgRating.toFixed(1)}</span>}
                  <span className="rating-count">({totalReviews || 0})</span>
                </div>
              </div>

              <div className="game-price">R$ {formatPrice(game.preco)}</div>

              {isOwned ? (
                <>
                  <button className="btn btn-primary btn-buy btn-owned-play" onClick={() => navigate('/library')}>▶ Jogar</button>
                  <button className="btn btn-secondary btn-cart" onClick={() => document.getElementById('avaliacoes')?.scrollIntoView({ behavior: 'smooth' })}>★ Avaliar</button>
                  <div className="btn-owned-badge">✓ Na sua biblioteca</div>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-buy" onClick={handleBuy}>Comprar</button>
                  <button className={`btn btn-secondary btn-cart ${btn.className}`} onClick={handleAddToCart} disabled={btn.disabled}>{btn.text}</button>
                  <button className={`btn btn-secondary btn-wishlist ${wishConfig[wishState].className}`} onClick={handleWishlist}>{wishConfig[wishState].text}</button>
                </>
              )}

              <div className="game-info-table">
                {game.empresa_nome && (
                  <div className="game-info-row">
                    <span className="game-info-label">Desenvolvedor</span>
                    <span className="game-info-value">{game.empresa_nome}</span>
                  </div>
                )}
                {game.categoria && (
                  <div className="game-info-row">
                    <span className="game-info-label">Gênero</span>
                    <span className="game-info-value">{game.categoria}</span>
                  </div>
                )}
                {game.ano && (
                  <div className="game-info-row">
                    <span className="game-info-label">Lançamento</span>
                    <span className="game-info-value">{game.ano}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        {isOwned && (
          <section className="section" id="avaliacoes">
            <h2 className="section-title">{userReview ? 'Sua avaliação' : 'Avaliar este jogo'}</h2>
            <div className="section-card">
              <div className="review-form">
                <div className="user-avatar-lg">{getInitialsFromName(getUserName())}</div>
                <div className="review-form-content">

                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${(isEditing ? (hoverRating || userRating) : userRating) >= star ? 'filled' : ''} ${!isEditing ? 'star-readonly' : ''}`}
                        onMouseEnter={() => isEditing && setHoverRating(star)}
                        onMouseLeave={() => isEditing && setHoverRating(0)}
                        onClick={() => isEditing && setUserRating(star)}
                      >★</span>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    className={`review-textarea ${!isEditing ? 'review-textarea--readonly' : ''}`}
                    placeholder="Escreva sua análise aqui..."
                    value={reviewText}
                    onChange={e => isEditing && setReviewText(e.target.value)}
                    readOnly={!isEditing}
                  />

                  <div className="review-form-footer">
                    {userReview && !isEditing ? (
                      <button className="btn-edit-review" onClick={() => { setIsEditing(true); setReviewMsg(null); }}>
                        Editar avaliação
                      </button>
                    ) : (
                      <div className="review-edit-actions">
                        <button className="btn-publish" onClick={handleSubmitReview} disabled={submitting}>
                          {submitting ? 'Salvando...' : userReview ? 'Atualizar' : 'Publicar'}
                        </button>
                        {userReview && (
                          <button className="btn-cancel-edit" onClick={handleCancelEdit}>Cancelar</button>
                        )}
                      </div>
                    )}
                  </div>

                  {reviewMsg && (
                    <p className={`review-msg review-msg--${reviewMsg.type}`}>{reviewMsg.text}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section-title">Sobre o jogo</h2>
          <div className="section-card">
            <p className="about-text">{game.descricao || 'Nenhuma descrição detalhada fornecida para este título ainda.'}</p>
          </div>
        </section>

        {similarGames.length > 0 && (
          <section className="section">
            <h2 className="section-title">Jogos similares</h2>
            <div className="similar-games">
              {similarGames.map(similar => (
                <Link to={`/game/${encodeURIComponent(similar.nome)}`} key={similar.nome} className="similar-game-card">
                  <span className="similar-game-name">{similar.nome}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section-title">
            Análises de outros usuários
            <span className="reviews-avg-badge">
              ★ {avgRating !== null ? avgRating.toFixed(1) : '0.0'} · {totalReviews || 0} {(totalReviews || 0) === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </h2>

          {reviews.length === 0 ? (
            <div className="reviews-empty">
              {localStorage.getItem('token')
                ? 'Nenhuma avaliação ainda. Seja o primeiro a avaliar!'
                : 'Faça login para visualizar as avaliações.'}
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => {
                const name    = reviewerNames[review.fkUsuario];
                const initials = name ? getInitialsFromName(name) : String(review.fkUsuario).substring(0, 2).toUpperCase();
                const dateStr  = formatDate(review.data);
                return (
                  <div key={review.id} className="review-card">
                    <div className="review-card-author">
                      <div className="user-avatar-lg">{initials}</div>
                      <p className="reviewer-name">{name || `Usuário #${review.fkUsuario}`}</p>
                    </div>
                    <div className="review-card-body">
                      <div className="review-card-header">
                        <StarDisplay rating={review.nota} size="1.1rem" />
                        {dateStr && <span className="review-date">{dateStr}</span>}
                      </div>
                      {review.comentario && (
                        <div className="review-card-text">{review.comentario}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </>
  );
}

export default GamePage;
