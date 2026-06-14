import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function EditUser() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: "", msg: "" });

  // Ao abrir a página, busca os dados do usuário logado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    // Extrai o id do usuário de dentro do token
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload.id;
    setUserId(id);

    api
      .get(`/usuarios/${id}`)
      .then((res) => {
        setNome(res.data.nome || "");
        setEmail(res.data.email || "");
        setLoading(false);
      })
      .catch(() => {
        setFeedback({
          tipo: "erro",
          msg: "Não foi possível carregar o perfil.",
        });
        setLoading(false);
      });
  }, []);

  // Calcula as iniciais para o avatar
  const getIniciais = () => {
    const partes = nome.trim().split(" ").filter(Boolean);
    const a = partes[0]?.[0] || "";
    const b = partes[partes.length - 1]?.[0] || "";
    return (a + b).toUpperCase() || "--";
  };

  // Salva o nome via PUT /usuarios/:id
  async function salvarNome() {
    if (!nome.trim()) {
      setFeedback({ tipo: "erro", msg: "O nome não pode ser vazio." });
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/usuarios/${userId}`, { nome });
      setFeedback({ tipo: "sucesso", msg: "Nome atualizado com sucesso!" });
    } catch {
      setFeedback({ tipo: "erro", msg: "Erro ao atualizar o nome." });
    } finally {
      setSalvando(false);
    }
  }

  // Altera a senha via PUT /auth/change-password
  async function salvarSenha() {
    if (!senhaAtual || !novaSenha) {
      setFeedback({
        tipo: "erro",
        msg: "Preencha a senha atual e a nova senha.",
      });
      return;
    }
    setSalvando(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: senhaAtual,
        newPassword: novaSenha,
      });
      setFeedback({ tipo: "sucesso", msg: "Senha alterada com sucesso!" });
      setSenhaAtual("");
      setNovaSenha("");
    } catch {
      setFeedback({ tipo: "erro", msg: "Senha atual incorreta." });
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div className="eu-loading">Carregando...</div>;

  return (
    <div className="eu-overlay">
      <div className="eu-container">
        <div className="eu-header">
          <h2>Editar Perfil</h2>
          <button className="eu-close" onClick={() => navigate(-1)}>
            ✕
          </button>
        </div>

        {feedback.msg && (
          <div className={`eu-feedback eu-feedback--${feedback.tipo}`}>
            {feedback.msg}
          </div>
        )}

        <div className="eu-avatar">{getIniciais()}</div>

        {/* Seção: Nome */}
        <div className="eu-section">
          <label>Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="eu-input eu-input--readonly"
          />
          <span className="eu-hint">O email não pode ser alterado.</span>

          <label>Nome completo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className="eu-input"
          />
          <button
            className="eu-btn-salvar"
            onClick={salvarNome}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar nome"}
          </button>
        </div>

        {/* Seção: Senha */}
        <div className="eu-section">
          <label>Senha atual</label>
          <input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            placeholder="Digite sua senha atual"
            className="eu-input"
          />

          <label>Nova senha</label>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Digite a nova senha"
            className="eu-input"
          />
          <button
            className="eu-btn-salvar"
            onClick={salvarSenha}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Alterar senha"}
          </button>
        </div>

        <div className="eu-footer">
          <button className="eu-btn-cancelar" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
