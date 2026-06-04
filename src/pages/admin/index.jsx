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
  const [modalEntity, setModalEntity] = useState('jogo'); 
  
  const [formData, setFormData] = useState({ 
    id: null, nome: '', preco: '', ano: '', descricao: '', fkEmpresa: '', fkCategoria: '' 
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteEntity, setDeleteEntity] = useState('jogo');
  
  const [deleteError, setDeleteError] = useState(null);

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

  const handleOpenModal = (entity, mode, item = null) => {
    setModalEntity(entity);
    setModalMode(mode);
    
    if (mode === 'edit' && item) {
      if (entity === 'jogo') {
        const compId = item.fkEmpresa || item.fk_empresa || companies.find(c => c.nome === item.empresa_nome || c.nome === item.empresa)?.id || '';
        const catId = item.fkCategoria || item.fk_categoria || categories.find(c => c.nome === item.categoria_nome || c.nome === item.categoria)?.id || '';

        setFormData({
          id: item.id,
          nome: item.nome || '',
          preco: item.preco || '',
          ano: item.ano || '',
          descricao: item.descricao || '',
          fkEmpresa: compId,
          fkCategoria: catId
        });
      } else {
        setFormData({ id: item.id, nome: item.nome || '' });
      }
    } else {
      if (entity === 'jogo') {
        setFormData({ id: null, nome: '', preco: '', ano: '', descricao: '', fkEmpresa: '', fkCategoria: '' });
      } else {
        setFormData({ id: null, nome: '' });
      }
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

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    let payload = {};
    let endpoint = '';

    if (modalEntity === 'jogo') {
      endpoint = '/jogos';
      payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        ano: parseInt(formData.ano, 10),
        fkEmpresa: parseInt(formData.fkEmpresa, 10),
        fkCategoria: parseInt(formData.fkCategoria, 10)
      };
    } else if (modalEntity === 'empresa') {
      endpoint = '/empresas';
      payload = { nome: formData.nome };
    } 
    
    try {
      if (modalMode === 'create') {
        await api.post(endpoint, payload, { headers });
      } else {
        await api.put(`${endpoint}/${formData.id}`, payload, { headers });
      }
      handleCloseModal();
      loadAllData(); 
    } catch (err) {
      console.error(err.message);
      alert(`Erro ao salvar: ${err.response?.data?.message || err.message}`);
    }
  };

  const confirmDelete = (entity, item) => {
    setDeleteError(null); 
    setDeleteEntity(entity);
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem('token');
    
    let endpoint = '';
    if (deleteEntity === 'jogo') endpoint = '/jogos';
    else if (deleteEntity === 'empresa') endpoint = '/empresas';

    try {
      await api.delete(`${endpoint}/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      loadAllData();
    } catch (err) {
      console.error(err.message);
      setDeleteError(`Não é possível excluir. Este registro já está vinculado a outras áreas do sistema (como histórico de compras ou catálogo).`);
    }
  };

  const formatPrice = (price) => {
    const n = parseFloat(price);
    return isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',');
  };

  const getCompanyName = (id) => companies.find(c => c.id === id)?.nome || '—';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.nome || '—';

  const getModalTitle = () => {
    const action = modalMode === 'create' ? 'Cadastrar Nova' : 'Editar';
    const entityName = modalEntity === 'jogo' ? 'Jogo' : modalEntity === 'empresa' ? 'Empresa' : 'Categoria';
    return `${action} ${entityName}`;
  };

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
            🏷️ Listagem de Categorias
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
              <button className="admin-btn-primary" onClick={() => handleOpenModal('jogo', 'create')}>
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
                          <button className="admin-btn-icon edit" onClick={() => handleOpenModal('jogo', 'edit', game)}>✏️</button>
                          <button className="admin-btn-icon delete" onClick={() => confirmDelete('jogo', game)}>🗑️</button>
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
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Gerenciamento de Empresas</h1>
                <p className="admin-subtitle">Cadastre e gerencie as desenvolvedoras de jogos.</p>
              </div>
              <button className="admin-btn-primary" onClick={() => handleOpenModal('empresa', 'create')}>
                + Nova Empresa
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Empresa</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="admin-empty-state">Nenhuma empresa cadastrada no sistema.</td>
                    </tr>
                  ) : (
                    companies.map(comp => (
                      <tr key={comp.id}>
                        <td>#{comp.id}</td>
                        <td className="admin-td-bold">{comp.nome}</td>
                        <td className="admin-actions">
                          <button className="admin-btn-icon edit" onClick={() => handleOpenModal('empresa', 'edit', comp)}>✏️</button>
                          <button className="admin-btn-icon delete" onClick={() => confirmDelete('empresa', comp)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

       
        {activeTab === 'categorias' && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Listagem de Categorias</h1>
                <p className="admin-subtitle">Visualize os gêneros de jogos disponíveis no sistema.</p>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome da Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="admin-empty-state">Nenhuma categoria cadastrada no sistema.</td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id}>
                        <td>#{cat.id}</td>
                        <td className="admin-td-bold">{cat.nome}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

     
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h2 className="admin-modal-title">{getModalTitle()}</h2>
            <form onSubmit={handleSave} className="admin-form">
              
              <div className="admin-form-group">
                <label>Nome {modalEntity === 'jogo' ? 'do Jogo' : 'da ' + (modalEntity === 'empresa' ? 'Empresa' : 'Categoria')}</label>
                <input required type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite o nome..." />
              </div>
              
              {modalEntity === 'jogo' && (
                <>
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
                </>
              )}
              
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="admin-btn-save">Salvar {modalEntity === 'jogo' ? 'Jogo' : ''}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {isDeleteModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box admin-modal-alert">
            <h2 className="admin-modal-title">⚠️ Confirmar Exclusão</h2>
            <p>Você está prestes a excluir permanentemente <strong>{itemToDelete?.nome}</strong>.</p>
            
            {deleteError && (
              <div className="admin-error-message">
                {deleteError}
              </div>
            )}

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