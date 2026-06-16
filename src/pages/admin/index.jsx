import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../../services/api";
import "./index.css";

function getAdminStatus() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.perfil === "Administrador" || payload.perfil === "Admin";
  } catch (err) {
    console.warn(err.message);
    return false;
  }
}

// ─── Cores para gráficos ───────────────────────────────────────────────
const CHART_COLORS = [
  "#6c63ff",
  "#ff6b6b",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#f77f00",
  "#a8dadc",
];

// ─── Tooltip customizado para gráfico de barras ───────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: "0.85rem",
          color: "var(--text-main)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 700 }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "var(--contrast)" }}>
          {payload[0].value} vendas
        </p>
      </div>
    );
  }
  return null;
};

// ─── Componente MiniBar inline para rankings ──────────────────────────
const MiniBar = ({ value, max }) => (
  <div
    style={{
      width: "100%",
      background: "var(--border)",
      borderRadius: 4,
      height: 6,
      marginTop: 4,
    }}
  >
    <div
      style={{
        width: `${Math.round((value / max) * 100)}%`,
        background: "var(--contrast)",
        borderRadius: 4,
        height: 6,
        transition: "width 0.5s ease",
      }}
    />
  </div>
);

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("jogos");
  const [loading, setLoading] = useState(true);

  // ── Dados principais ──────────────────────────────────────────────
  const [games, setGames] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // ── Dashboard ─────────────────────────────────────────────────────
  const [dashLoading, setDashLoading] = useState(false);
  const [topGames, setTopGames] = useState([]);
  const [topByCompany, setTopByCompany] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // ── Modais gerais ─────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalEntity, setModalEntity] = useState("jogo");
  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    preco: "",
    ano: "",
    descricao: "",
    fkEmpresa: "",
    fkCategoria: "",
  });

  // ── Modal de usuário ──────────────────────────────────────────────
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    id: null,
    nome: "",
    dataNascimento: "",
    fkPerfil: "",
  });
  const [userModalError, setUserModalError] = useState(null);

  // ── Modal de exclusão ─────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteEntity, setDeleteEntity] = useState("jogo");
  const [deleteError, setDeleteError] = useState(null);

  // ─────────────────────────────────────────────────────────────────
  // Carga de dados — funções estáveis
  // ─────────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    try {
      const [gamesRes, compRes, catRes, usersRes, profilesRes] =
        await Promise.all([
          api.get("/jogos", { headers }),
          api.get("/empresas", { headers }).catch(() => ({ data: [] })),
          api.get("/categorias", { headers }).catch(() => ({ data: [] })),
          api.get("/usuarios", { headers }).catch(() => ({ data: [] })),
          api.get("/profiles", { headers }).catch(() => ({ data: [] })),
        ]);
      setGames(
        Array.isArray(gamesRes.data)
          ? gamesRes.data
          : gamesRes.data.jogos || [],
      );
      setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    try {
      const topRes = await api
        .get("/relatorios/jogos-mais-vendidos?top=10", { headers })
        .catch(() => ({ data: [] }));

      const data = Array.isArray(topRes.data) ? topRes.data : [];

      const formattedData = data.map((item) => ({
        ...item,
        jogo: item.nome || item.jogo || "Desconhecido",
        totalVendas:
          item.quantidade || item.totalVendas || item.total_vendas || 0,
        empresa: item.empresa_nome || item.empresa || "—",
      }));

      setTopGames(formattedData);
    } catch (err) {
      console.error(err.message);
    } finally {
      setDashLoading(false);
    }
  }, []);

  const loadTopByCompany = useCallback(async (empresaId) => {
    if (!empresaId) {
      setTopByCompany([]);
      return;
    }
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    try {
      const res = await api.get(
        `/relatorios/jogos-mais-vendidos?top=10&empresa=${empresaId}`,
        { headers },
      );
      const data = Array.isArray(res.data) ? res.data : [];

      const formattedData = data.map((item) => ({
        ...item,
        jogo: item.nome || item.jogo || "Desconhecido",
        totalVendas:
          item.quantidade || item.totalVendas || item.total_vendas || 0,
        empresa: item.empresa_nome || item.empresa || "—",
      }));

      setTopByCompany(formattedData);
    } catch {
      setTopByCompany([]);
    }
  }, []);

  // ── useEffects Atualizados ──────────────────────────────
  useEffect(() => {
    if (!getAdminStatus()) {
      navigate("/");
      return;
    }

    const fetchInitialData = async () => {
      await loadAllData();
    };
    fetchInitialData();
  }, [navigate, loadAllData]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (activeTab === "dashboard") {
        await loadDashboard();
      }
    };
    fetchDashboardData();
  }, [activeTab, loadDashboard]);

  useEffect(() => {
    const fetchCompanyRanking = async () => {
      await loadTopByCompany(selectedCompany);
    };
    fetchCompanyRanking();
  }, [selectedCompany, loadTopByCompany]);

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────
  const formatPrice = (price) => {
    const n = parseFloat(price);
    return isNaN(n) ? "0,00" : n.toFixed(2).replace(".", ",");
  };
  const getCompanyName = (id) =>
    companies.find((c) => c.id === id)?.nome || "—";
  const getCategoryName = (id) =>
    categories.find((c) => c.id === id)?.nome || "—";
  const getProfileName = (id) => profiles.find((p) => p.id === id)?.nome || "—";

  // ─────────────────────────────────────────────────────────────────
  // Modal genérico (jogo / empresa / categoria)
  // ─────────────────────────────────────────────────────────────────
  const handleOpenModal = (entity, mode, item = null) => {
    setModalEntity(entity);
    setModalMode(mode);
    if (mode === "edit" && item) {
      if (entity === "jogo") {
        const compId =
          item.fkEmpresa ||
          item.fk_empresa ||
          companies.find(
            (c) => c.nome === item.empresa_nome || c.nome === item.empresa,
          )?.id ||
          "";
        const catId =
          item.fkCategoria ||
          item.fk_categoria ||
          categories.find(
            (c) => c.nome === item.categoria_nome || c.nome === item.categoria,
          )?.id ||
          "";
        setFormData({
          id: item.id,
          nome: item.nome || "",
          preco: item.preco || "",
          ano: item.ano || "",
          descricao: item.descricao || "",
          fkEmpresa: compId,
          fkCategoria: catId,
        });
      } else {
        setFormData({ id: item.id, nome: item.nome || "" });
      }
    } else {
      setFormData({
        id: null,
        nome: "",
        preco: "",
        ano: "",
        descricao: "",
        fkEmpresa: "",
        fkCategoria: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      id: null,
      nome: "",
      preco: "",
      ano: "",
      descricao: "",
      fkEmpresa: "",
      fkCategoria: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    let payload = {};
    let endpoint = "";
    if (modalEntity === "jogo") {
      endpoint = "/jogos";
      payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        ano: parseInt(formData.ano, 10),
        fkEmpresa: parseInt(formData.fkEmpresa, 10),
        fkCategoria: parseInt(formData.fkCategoria, 10),
      };
    } else if (modalEntity === "empresa") {
      endpoint = "/empresas";
      payload = { nome: formData.nome };
    }
    try {
      if (modalMode === "create")
        await api.post(endpoint, payload, { headers });
      else await api.put(`${endpoint}/${formData.id}`, payload, { headers });
      handleCloseModal();
      loadAllData();
    } catch (err) {
      alert(`Erro ao salvar: ${err.response?.data?.message || err.message}`);
    }
  };

  const getModalTitle = () => {
    const action = modalMode === "create" ? "Cadastrar Novo" : "Editar";
    const names = { jogo: "Jogo", empresa: "Empresa", categoria: "Categoria" };
    return `${action} ${names[modalEntity] || ""}`;
  };

  // ─────────────────────────────────────────────────────────────────
  // Modal de usuário
  // ─────────────────────────────────────────────────────────────────
  const handleOpenUserModal = (user) => {
    setUserModalError(null);
    setUserForm({
      id: user.id,
      nome: user.nome || "",
      dataNascimento: user.dataNascimento || "",
      fkPerfil: user.fkPerfil || "",
    });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setUserForm({ id: null, nome: "", dataNascimento: "", fkPerfil: "" });
    setUserModalError(null);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserModalError(null);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    try {
      await api.put(
        `/usuarios/${userForm.id}`,
        {
          nome: userForm.nome,
          dataNascimento: userForm.dataNascimento,
          fkPerfil: parseInt(userForm.fkPerfil, 10),
        },
        { headers },
      );
      handleCloseUserModal();
      loadAllData();
    } catch (err) {
      setUserModalError(
        err.response?.data?.message || "Erro ao atualizar usuário.",
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Modal de exclusão
  // ─────────────────────────────────────────────────────────────────
  const confirmDelete = (entity, item) => {
    setDeleteError(null);
    setDeleteEntity(entity);
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    const endpoints = { jogo: "/jogos", empresa: "/empresas" };
    const endpoint = endpoints[deleteEntity];
    try {
      await api.delete(`${endpoint}/${itemToDelete.id}`, { headers });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      loadAllData();
    } catch {
      setDeleteError(
        "Não é possível excluir. Este registro já está vinculado a outras áreas do sistema.",
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Loading global
  // ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-loading">
        <span className="admin-spinner" />
        <p>Autenticando e carregando dados...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Derivados para gráfico de pizza (distribuição por empresa)
  // ─────────────────────────────────────────────────────────────────
  const gamesByCompany = companies
    .map((c) => ({
      name: c.nome,
      value: games.filter((g) => (g.fkEmpresa || g.fk_empresa) === c.id).length,
    }))
    .filter((c) => c.value > 0);

  const maxVendas =
    topGames.length > 0
      ? topGames[0].totalVendas || topGames[0].total_vendas || 1
      : 1;

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="admin-container">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-title">Painel de Controle</h2>
        <nav className="admin-nav">
          {[
            { key: "dashboard", icon: "📊", label: "Dashboard" },
            { key: "jogos", icon: "sports_esports", label: "Gerenciar Jogos" },
            { key: "empresas", icon: "🏢", label: "Gerenciar Empresas" },
            { key: "categorias", icon: "label", label: "Categorias" },
            { key: "usuarios", icon: "👥", label: "Gerenciar Usuários" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`admin-nav-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
              aria-current={activeTab === key ? "page" : undefined}
            >
              {icon} {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="admin-main">
        {/* ════ DASHBOARD ════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Dashboard & Rankings</h1>
                <p className="admin-subtitle">
                  Relatórios de vendas e métricas do catálogo.
                </p>
              </div>
            </div>

            {dashLoading ? (
              <div className="admin-loading" style={{ height: 300 }}>
                <span className="admin-spinner" />
                <p>Carregando relatórios...</p>
              </div>
            ) : (
              <>
                {/* KPI cards */}
                <div className="dash-kpi-row">
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon material-symbols-outlined">
                      sports_esports
                    </span>
                    <div>
                      <p className="dash-kpi-value">{games.length}</p>
                      <p className="dash-kpi-label">Jogos cadastrados</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">🏢</span>
                    <div>
                      <p className="dash-kpi-value">{companies.length}</p>
                      <p className="dash-kpi-label">Empresas</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon material-symbols-outlined">
                      label
                    </span>
                    <div>
                      <p className="dash-kpi-value">{categories.length}</p>
                      <p className="dash-kpi-label">Categorias</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">👥</span>
                    <div>
                      <p className="dash-kpi-value">{users.length}</p>
                      <p className="dash-kpi-label">Usuários</p>
                    </div>
                  </div>
                </div>

                <div className="dash-grid">
                  {/* ── Gráfico: Top 10 jogos mais vendidos ── */}
                  <div className="dash-card dash-card-wide">
                    <h3 className="dash-card-title">
                      🏆 Top 10 Jogos Mais Vendidos
                    </h3>
                    {topGames.length === 0 ? (
                      <p className="admin-empty-state" style={{ padding: 20 }}>
                        Sem dados de vendas registrados ainda.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={topGames}
                          margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="jogo"
                            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="totalVendas"
                            name="Vendas"
                            fill="var(--contrast)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* ── Pizza: Jogos por empresa ── */}
                  <div className="dash-card">
                    <h3 className="dash-card-title">🏢 Jogos por Empresa</h3>
                    {gamesByCompany.length === 0 ? (
                      <p className="admin-empty-state" style={{ padding: 20 }}>
                        Sem dados.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={gamesByCompany}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            /* A propriedade label foi removida para limpar a visualização */
                          >
                            {gamesByCompany.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Legend
                            wrapperStyle={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                            }}
                          />
                          <Tooltip
                            formatter={(v) => [`${v} jogo(s)`, "Quantidade"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* ── Ranking geral (tabela) ── */}
                  <div className="dash-card">
                    <h3 className="dash-card-title">
                      📋 Ranking Geral de Vendas
                    </h3>
                    {topGames.length === 0 ? (
                      <p className="admin-empty-state" style={{ padding: 20 }}>
                        Sem dados de vendas.
                      </p>
                    ) : (
                      <ol className="dash-ranking-list">
                        {topGames.slice(0, 7).map((g, i) => {
                          const vendas = g.totalVendas || g.total_vendas || 0;
                          return (
                            <li key={i} className="dash-ranking-item">
                              <span
                                className={`dash-rank-badge rank-${i < 3 ? i + 1 : "other"}`}
                              >
                                {i + 1}
                              </span>
                              <div className="dash-ranking-info">
                                <p className="dash-ranking-name">{g.jogo}</p>
                                <p className="dash-ranking-sub">
                                  {g.empresa} · {vendas} vendas
                                </p>
                                <MiniBar value={vendas} max={maxVendas} />
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  {/* ── Ranking por empresa (filtro) ── */}
                  <div className="dash-card dash-card-wide">
                    <div className="dash-card-header">
                      <h3 className="dash-card-title">
                        🏅 Ranking por Empresa
                      </h3>
                      <select
                        className="dash-select"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        aria-label="Filtrar por empresa"
                      >
                        <option value="">Selecione uma empresa...</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!selectedCompany ? (
                      <p className="admin-empty-state" style={{ padding: 20 }}>
                        Selecione uma empresa para ver o ranking.
                      </p>
                    ) : topByCompany.length === 0 ? (
                      <p className="admin-empty-state" style={{ padding: 20 }}>
                        Nenhuma venda registrada para esta empresa.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={topByCompany}
                          margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="jogo"
                            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="totalVendas"
                            name="Vendas"
                            fill="#06d6a0"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ════ JOGOS ════════════════════════════════════════════ */}
        {activeTab === "jogos" && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Gerenciamento de Jogos</h1>
                <p className="admin-subtitle">
                  Adicione, edite ou remova títulos do catálogo.
                </p>
              </div>
              <button
                className="admin-btn-primary"
                onClick={() => handleOpenModal("jogo", "create")}
              >
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
                      <td colSpan="6" className="admin-empty-state">
                        Nenhum jogo cadastrado.
                      </td>
                    </tr>
                  ) : (
                    games.map((game) => (
                      <tr key={game.id}>
                        <td>#{game.id}</td>
                        <td className="admin-td-bold">{game.nome}</td>
                        <td>
                          {game.empresa_nome ||
                            getCompanyName(game.fkEmpresa || game.fk_empresa)}
                        </td>
                        <td>
                          {game.categoria ||
                            getCategoryName(
                              game.fkCategoria || game.fk_categoria,
                            )}
                        </td>
                        <td>R$ {formatPrice(game.preco)}</td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn-icon edit"
                            title="Editar"
                            onClick={() =>
                              handleOpenModal("jogo", "edit", game)
                            }
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-btn-icon delete"
                            title="Excluir"
                            onClick={() => confirmDelete("jogo", game)}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════ EMPRESAS ═════════════════════════════════════════ */}
        {activeTab === "empresas" && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Gerenciamento de Empresas</h1>
                <p className="admin-subtitle">
                  Cadastre e gerencie as desenvolvedoras de jogos.
                </p>
              </div>
              <button
                className="admin-btn-primary"
                onClick={() => handleOpenModal("empresa", "create")}
              >
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
                      <td colSpan="3" className="admin-empty-state">
                        Nenhuma empresa cadastrada.
                      </td>
                    </tr>
                  ) : (
                    companies.map((comp) => (
                      <tr key={comp.id}>
                        <td>#{comp.id}</td>
                        <td className="admin-td-bold">{comp.nome}</td>
                        <td className="admin-actions">
                          <button
                            className="admin-btn-icon edit"
                            title="Editar"
                            onClick={() =>
                              handleOpenModal("empresa", "edit", comp)
                            }
                          >
                            ✏️
                          </button>
                          <button
                            className="admin-btn-icon delete"
                            title="Excluir"
                            onClick={() => confirmDelete("empresa", comp)}
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════ CATEGORIAS ═══════════════════════════════════════ */}
        {activeTab === "categorias" && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Listagem de Categorias</h1>
                <p className="admin-subtitle">
                  Visualize os gêneros de jogos disponíveis no sistema.
                </p>
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
                      <td colSpan="2" className="admin-empty-state">
                        Nenhuma categoria cadastrada.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
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

        {/* ════ USUÁRIOS ═════════════════════════════════════════ */}
        {activeTab === "usuarios" && (
          <section className="admin-section">
            <div className="admin-header">
              <div>
                <h1 className="admin-title">Gerenciamento de Usuários</h1>
                <p className="admin-subtitle">
                  Edite dados e permissões de perfil de cada usuário.
                </p>
              </div>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                    <th>Nasc.</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty-state">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const profileName = getProfileName(u.fkPerfil);
                      const isAdmin =
                        profileName === "Administrador" ||
                        profileName === "Admin";
                      return (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td className="admin-td-bold">{u.nome}</td>
                          <td>{u.email}</td>
                          <td>
                            <span
                              className={`user-badge ${isAdmin ? "user-badge-admin" : "user-badge-client"}`}
                            >
                              {isAdmin ? (
                                <>
                                  <span className="material-symbols-outlined">
                                    shield
                                  </span>{" "}
                                  Admin
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined">
                                    person
                                  </span>{" "}
                                  Cliente
                                </>
                              )}
                            </span>
                          </td>
                          <td>{u.dataNascimento || "—"}</td>
                          <td className="admin-actions">
                            <button
                              className="admin-btn-icon edit"
                              title="Editar usuário"
                              onClick={() => handleOpenUserModal(u)}
                            >
                              ✏️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ════ MODAL: Jogo / Empresa ═══════════════════════════════ */}
      {isModalOpen && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-box">
            <h2 className="admin-modal-title">{getModalTitle()}</h2>
            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-group">
                <label>
                  Nome {modalEntity === "jogo" ? "do Jogo" : "da Empresa"}
                </label>
                <input
                  required
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Digite o nome..."
                />
              </div>
              {modalEntity === "jogo" && (
                <>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Empresa Desenvolvedora</label>
                      <select
                        required
                        name="fkEmpresa"
                        value={formData.fkEmpresa}
                        onChange={handleChange}
                      >
                        <option value="">Selecione uma empresa...</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Gênero / Categoria</label>
                      <select
                        required
                        name="fkCategoria"
                        value={formData.fkCategoria}
                        onChange={handleChange}
                      >
                        <option value="">Selecione uma categoria...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Preço (R$)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        name="preco"
                        value={formData.preco}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Ano de Lançamento</label>
                      <input
                        type="number"
                        name="ano"
                        value={formData.ano}
                        onChange={handleChange}
                        placeholder="Ex: 2024"
                      />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label>Descrição</label>
                    <textarea
                      rows="3"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Detalhes do jogo..."
                    />
                  </div>
                </>
              )}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-save">
                  Salvar {modalEntity === "jogo" ? "Jogo" : "Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: Editar Usuário ════════════════════════════════ */}
      {isUserModalOpen && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Editar usuário"
        >
          <div className="admin-modal-box">
            <h2 className="admin-modal-title">✏️ Editar Usuário</h2>
            <form onSubmit={handleSaveUser} className="admin-form">
              <div className="admin-form-group">
                <label>Nome completo</label>
                <input
                  required
                  type="text"
                  name="nome"
                  value={userForm.nome}
                  onChange={handleUserChange}
                  placeholder="Nome do usuário..."
                />
              </div>
              <div className="admin-form-group">
                <label>Data de Nascimento (DD/MM/AAAA)</label>
                <input
                  type="text"
                  name="dataNascimento"
                  value={userForm.dataNascimento}
                  onChange={handleUserChange}
                  placeholder="Ex: 15/06/2000"
                />
              </div>
              <div className="admin-form-group">
                <label>Perfil / Permissão</label>
                <select
                  required
                  name="fkPerfil"
                  value={userForm.fkPerfil}
                  onChange={handleUserChange}
                >
                  <option value="">Selecione um perfil...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              {userModalError && (
                <div className="admin-error-message" role="alert">
                  {userModalError}
                </div>
              )}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={handleCloseUserModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-save">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: Confirmar Exclusão ════════════════════════════ */}
      {isDeleteModalOpen && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-box admin-modal-alert">
            <h2 className="admin-modal-title">
              <span className="material-symbols-outlined">warning</span>{" "}
              Confirmar Exclusão
            </h2>
            <p>
              Você está prestes a excluir permanentemente{" "}
              <strong>{itemToDelete?.nome}</strong>.
            </p>
            {deleteError && (
              <div className="admin-error-message" role="alert">
                {deleteError}
              </div>
            )}
            <div className="admin-modal-actions">
              <button
                className="admin-btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="admin-btn-delete-confirm"
                onClick={handleDelete}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
