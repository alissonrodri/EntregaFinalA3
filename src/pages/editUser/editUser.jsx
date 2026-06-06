import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function EditUser() {
  const navigate = useNavigate();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ tipo: "", msg: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    api
      .get("/usuarios/perfil")
      .then((res) => {
        setNomeCompleto(res.data.nome || "");
        setEmail(res.data.email || "");
        setUsername(res.data.username || "");
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

  const getIniciais = () => {
    const partes = nomeCompleto.trim().split(" ").filter(Boolean);
    const a = partes[0]?.[0] || "";
    const b = partes[partes.length - 1]?.[0] || "";
    return (a + b).toUpperCase() || "--";
  };

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

        <div className="eu-form">
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
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            placeholder="Seu nome completo"
            className="eu-input"
          />

          <label>Nome de usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@seu_usuario"
            className="eu-input"
          />
        </div>

        <div className="eu-footer">
          <button className="eu-btn-cancelar" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button className="eu-btn-salvar">Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
