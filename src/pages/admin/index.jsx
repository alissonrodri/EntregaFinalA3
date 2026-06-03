import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function getAdminStatus() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.perfil === 'Administrador' || payload.perfil === 'Admin';
  } catch (err) {
    console.warn(err.message);
    return false;
  }
}

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jogos');
  const [loading, setLoading] = useState(true);
  
  const [games, setGames] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  
  const [formData, setFormData] = useState({ 
    id: null, nome: '', preco: '', ano: '', descricao: '', fkEmpresa: '', fkCategoria: '' 
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [gamesRes, compRes, catRes] = await Promise.all([
        api.get('/jogos', { headers }),
        api.get('/empresas', { headers }).catch(() => ({ data: [] })),
        api.get('/categorias', { headers }).catch(() => ({ data: [] }))
      ]);

      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : (gamesRes.data.jogos || []));
      setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGames = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get('/jogos', { headers: { Authorization: `Bearer ${token}` } });
      setGames(Array.isArray(response.data) ? response.data : (response.data.jogos || []));
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    const isAdmin = getAdminStatus();
    if (!isAdmin) {
      navigate('/');
      return;
    }
    setTimeout(() => {
      loadAllData();
    }, 0);
  }, [navigate, loadAllData]);

  const handleOpenModal = (mode, game = null) => {
    setModalMode(mode);
    if (mode === 'edit' && game) {
      setFormData({
        id: game.id,
        nome: game.nome || '',
        preco: game.preco || '',
        ano: game.ano || '',
        descricao: game.descricao || '',
        fkEmpresa: game.fkEmpresa || game.fk_empresa || '',
        fkCategoria: game.fkCategoria || game.fk_categoria || ''
      });
    } else {
      setFormData({ id: null, nome: '', preco: '', ano: '', descricao: '', fkEmpresa: '', fkCategoria: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, nome: '', preco: '', ano: '', descricao: '', fkEmpresa: '', fkCategoria: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveGame = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    const payload = {
      ...formData,
      preco: parseFloat(formData.preco),
      ano: parseInt(formData.ano, 10),
      fkEmpresa: parseInt(formData.fkEmpresa, 10),
      fkCategoria: parseInt(formData.fkCategoria, 10),
      fk_empresa: parseInt(formData.fkEmpresa, 10),
      fk_categoria: parseInt(formData.fkCategoria, 10)
    };
    
    try {
      if (modalMode === 'create') {
        await api.post('/jogos', payload, { headers });
      } else {
        await api.put(`/jogos/${formData.id}`, payload, { headers });
      }
      handleCloseModal();
      loadGames();
    } catch (err) {
      console.error(err.message);
      alert(`Erro ao salvar: ${err.response?.data?.message || err.message}`);
    }
  };

  const confirmDelete = (game) => {
    setItemToDelete(game);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/jogos/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      loadGames();
    } catch (err) {
      console.error(err.message);
      alert('Erro ao excluir o jogo.');
    }
  };

  const formatPrice = (price) => {
    const n = parseFloat(price);
    return isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',');
  };

  const getCompanyName = (id) => companies.find(c => c.id === id)?.nome || '—';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.nome || '—';

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="admin-spinner" />
        <p>Autenticando e carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-title">Painel de Controle</h2>
        <nav className="admin-nav">
          <button 
            className={`admin-nav-btn ${activeTab === 'jogos' ? 'active' : ''}`}
            onClick={() => setActiveTab('jogos')}
          >
            🎮 Gerenciar Jogos
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'empresas' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresas')}
          >
            🏢 Gerenciar Empresas
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'categorias' ? 'active' : ''}`}
            onClick={() => setActiveTab('categorias')}
          >
            🏷️ Gerenciar Categorias
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {activeTab === 'jogos' && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Gerenciamento de Jogos</h1>
                <p className="admin-subtitle">Adicione, edite ou remova títulos do catálogo.</p>
              </div>
              <button className="admin-btn-primary" onClick={() => handleOpenModal('create')}>
                + Novo Jogo
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome do Jogo</th>
                    <th>Empresa</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty-state">Nenhum jogo cadastrado no sistema.</td>
                    </tr>
                  ) : (
                    games.map(game => (
                      <tr key={game.id}>
                        <td>#{game.id}</td>
                        <td className="admin-td-bold">{game.nome}</td>
                        <td>{game.empresa_nome || getCompanyName(game.fkEmpresa || game.fk_empresa)}</td>
                        <td>{game.categoria || getCategoryName(game.fkCategoria || game.fk_categoria)}</td>
                        <td>R$ {formatPrice(game.preco)}</td>
                        <td className="admin-actions">
                          <button className="admin-btn-icon edit" onClick={() => handleOpenModal('edit', game)}>✏️</button>
                          <button className="admin-btn-icon delete" onClick={() => confirmDelete(game)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'empresas' && (
          <section className="admin-section">
            <h1 className="admin-title">Gerenciamento de Empresas</h1>
            <p className="admin-subtitle">Área reservada para o CRUD de Desenvolvedoras.</p>
          </section>
        )}

        {activeTab === 'categorias' && (
          <section className="admin-section">
            <h1 className="admin-title">Gerenciamento de Categorias</h1>
            <p className="admin-subtitle">Área reservada para o CRUD de Gêneros de Jogos.</p>
          </section>
        )}
      </main>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h2 className="admin-modal-title">
              {modalMode === 'create' ? 'Cadastrar Novo Jogo' : 'Editar Jogo'}
            </h2>
            <form onSubmit={handleSaveGame} className="admin-form">
              <div className="admin-form-group">
                <label>Nome do Jogo</label>
                <input required type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Elden Ring" />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Empresa Desenvolvedora</label>
                  <select required name="fkEmpresa" value={formData.fkEmpresa} onChange={handleChange}>
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Gênero / Categoria</label>
                  <select required name="fkCategoria" value={formData.fkCategoria} onChange={handleChange}>
                    <option value="">Selecione uma categoria...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Preço (R$)</label>
                  <input required type="number" step="0.01" min="0" name="preco" value={formData.preco} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className="admin-form-group">
                  <label>Ano de Lançamento</label>
                  <input type="number" name="ano" value={formData.ano} onChange={handleChange} placeholder="Ex: 2024" />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Descrição</label>
                <textarea rows="3" name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Detalhes do jogo..." />
              </div>
              
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="admin-btn-save">Salvar Jogo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box admin-modal-alert">
            <h2 className="admin-modal-title">⚠️ Confirmar Exclusão</h2>
            <p>Você está prestes a excluir permanentemente o jogo <strong>{itemToDelete?.nome}</strong>. Esta ação não pode ser desfeita.</p>
            <div className="admin-modal-actions">
              <button className="admin-btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className="admin-btn-delete-confirm" onClick={handleDelete}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;