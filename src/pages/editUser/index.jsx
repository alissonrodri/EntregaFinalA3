import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function EditUser() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [blocoAberto, setBlocoAberto] = useState(null);

  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: "", msg: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload.id;
    setUserId(id);
    api
      .get(`/usuarios/${id}`)
      .then((res) => {
        setNome(res.data.nome || "");
        setEmail(res.data.email || "");
        setDataNascimento(
          res.data.dataNascimento
            ? new Date(res.data.dataNascimento).toLocaleDateString("pt-BR")
            : "",
        );
        setLoading(false);
      })
      .catch(() => {
        mostrarFeedback("erro", "Não foi possível carregar o perfil.");
        setLoading(false);
      });
  }, []);

  const getIniciais = () => {
    const partes = nome.trim().split(" ").filter(Boolean);
    const a = partes[0]?.[0] || "";
    const b = partes[partes.length - 1]?.[0] || "";
    return (a + b).toUpperCase() || "--";
  };

  const mostrarFeedback = (tipo, msg) => {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback({ tipo: "", msg: "" }), 4000);
  };

  const toggleBloco = (bloco) => {
    setBlocoAberto(blocoAberto === bloco ? null : bloco);
  };

  async function salvarNome() {
    if (!nome.trim()) {
      mostrarFeedback("erro", "O nome não pode ser vazio.");
      return;
    }
    if (!dataNascimento.trim()) {
      mostrarFeedback("erro", "A data de nascimento é obrigatória.");
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/usuarios/${userId}`, { nome, dataNascimento });
      mostrarFeedback("sucesso", "Alterações salvas com sucesso!");
    } catch {
      mostrarFeedback("erro", "Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarUsername() {
    if (!novoUsername.trim()) {
      mostrarFeedback("aviso", "Digite um novo nome de usuário.");
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/usuarios/${userId}`, { nome, username: novoUsername });
      mostrarFeedback("sucesso", "Nome de usuário atualizado!");
      setNovoUsername("");
      setBlocoAberto(null);
    } catch {
      mostrarFeedback("erro", "Erro ao atualizar o nome de usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarSenhaFn() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      mostrarFeedback("erro", "Preencha todos os campos de senha.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      mostrarFeedback("erro", "As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 8) {
      mostrarFeedback("erro", "Mínimo de 8 caracteres na nova senha.");
      return;
    }
    setSalvando(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: senhaAtual,
        newPassword: novaSenha,
      });
      mostrarFeedback("sucesso", "Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setBlocoAberto(null);
    } catch {
      mostrarFeedback("erro", "Senha atual incorreta.");
    } finally {
      setSalvando(false);
    }
  }

  const s = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    container: {
      background: "#1c1f26",
      border: "1px solid #2a2d3a",
      borderRadius: "16px",
      width: "90%",
      maxWidth: "560px",
      maxHeight: "88vh",
      display: "flex",
      flexDirection: "column",
      color: "#e8eaf0",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      padding: "18px 28px 14px",
      borderBottom: "1px solid #2a2d3a",
      flexShrink: 0,
    },
    title: { fontSize: "1.1rem", fontWeight: 700 },
    body: {
      overflowY: "auto",
      padding: "16px 28px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      flex: 1,
      scrollbarWidth: "thin",
      scrollbarColor: "#2a2d3a #1c1f26",
    },
    footer: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "10px",
      padding: "14px 28px",
      borderTop: "1px solid #2a2d3a",
      flexShrink: 0,
    },
    avatarWrap: {
      display: "flex",
      justifyContent: "center",
      padding: "4px 0 8px",
    },
    avatar: {
      width: "56px",
      height: "56px",
      background: "#08090b",
      border: "2px solid #386dbd",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2rem",
      fontWeight: "bold",
      color: "#386dbd",
    },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    field: { display: "flex", flexDirection: "column", gap: "4px" },
    label: {
      fontSize: "0.70rem",
      color: "#9194a6",
      fontWeight: 500,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    input: {
      background: "#08090b",
      border: "1px solid #2a2d3a",
      borderRadius: "8px",
      padding: "9px 12px",
      color: "#e8eaf0",
      fontSize: "0.90rem",
      outline: "none",
      width: "100%",
      height: "40px",
    },
    inputRO: {
      background: "#08090b",
      border: "1px solid #2a2d3a",
      borderRadius: "8px",
      padding: "9px 12px",
      color: "#e8eaf0",
      fontSize: "0.90rem",
      width: "100%",
      height: "40px",
      opacity: 0.4,
      cursor: "not-allowed",
    },
    hint: { fontSize: "0.70rem", color: "#9194a6" },
    toggleBtn: {
      background: "transparent",
      border: "1px solid #2a2d3a",
      color: "#9194a6",
      padding: "9px 14px",
      borderRadius: "8px",
      fontSize: "0.85rem",
      cursor: "pointer",
      textAlign: "left",
      width: "100%",
      height: "40px",
    },
    expandable: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "14px",
      background: "#08090b",
      border: "1px solid #2a2d3a",
      borderRadius: "8px",
    },
    expandFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "4px",
    },
    cancelSmall: {
      background: "transparent",
      border: "1px solid #c0392b",
      color: "#c0392b",
      borderRadius: "8px",
      padding: "7px 16px",
      fontSize: "0.82rem",
      cursor: "pointer",
    },
    confirmBtn: {
      background: "transparent",
      border: "1px solid #386dbd",
      color: "#386dbd",
      borderRadius: "8px",
      padding: "7px 16px",
      fontSize: "0.82rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    cancelBtn: {
      background: "transparent",
      border: "1px solid #c0392b",
      color: "#c0392b",
      padding: "9px 20px",
      fontSize: "0.86rem",
      cursor: "pointer",
      borderRadius: "8px",
    },
    saveBtn: {
      background: "#386dbd",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "9px 22px",
      fontSize: "0.86rem",
      fontWeight: 700,
      cursor: "pointer",
    },
    senhaWrap: { position: "relative", display: "flex", alignItems: "center" },
    olhoBtn: {
      position: "absolute",
      right: "10px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "0.95rem",
      color: "#9194a6",
      padding: 0,
    },
    obrig: { color: "#e53935" },
    feedback: (tipo) => ({
      padding: "9px 12px",
      borderRadius: "8px",
      fontSize: "0.80rem",
      fontWeight: 500,
      background:
        tipo === "sucesso"
          ? "rgba(76,175,80,0.12)"
          : tipo === "erro"
            ? "rgba(229,57,53,0.12)"
            : "rgba(255,152,0,0.12)",
      border: `1px solid ${tipo === "sucesso" ? "#4caf50" : tipo === "erro" ? "#e53935" : "#ff9800"}`,
      color:
        tipo === "sucesso"
          ? "#4caf50"
          : tipo === "erro"
            ? "#e53935"
            : "#ff9800",
    }),
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#9194a6",
        }}
      >
        Carregando...
      </div>
    );

  return createPortal(
    <div style={s.overlay}>
      <div style={s.container}>
        {/* Cabeçalho fixo */}
        <div style={s.header}>
          <h2 style={s.title}>Editar Perfil</h2>
        </div>

        {/* Corpo scrollável */}
        <div style={s.body}>
          {feedback.msg && (
            <div style={s.feedback(feedback.tipo)}>{feedback.msg}</div>
          )}

          {/* Avatar */}
          <div style={s.avatarWrap}>
            <div style={s.avatar}>{getIniciais()}</div>
          </div>

          {/* Email */}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.inputRO} type="email" value={email} readOnly />
            <span style={s.hint}>O email não pode ser alterado.</span>
          </div>

          {/* Nome + Data lado a lado */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>
                Nome completo <span style={s.obrig}>*</span>
              </label>
              <input
                style={s.input}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>
                Data de nascimento <span style={s.obrig}>*</span>
              </label>
              <input
                style={s.input}
                type="text"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                placeholder="DD/MM/AAAA"
                maxLength={10}
              />
            </div>
          </div>

          {/* Bloco Username */}
          <button style={s.toggleBtn} onClick={() => toggleBloco("username")}>
            Alterar nome de usuário
          </button>

          {blocoAberto === "username" && (
            <div style={s.expandable}>
              <div style={s.field}>
                <label style={s.label}>Novo nome de usuário</label>
                <input
                  style={s.input}
                  type="text"
                  value={novoUsername}
                  onChange={(e) => setNovoUsername(e.target.value)}
                  placeholder="@novo_usuario"
                />
              </div>
              <div style={s.expandFooter}>
                <button
                  style={s.cancelSmall}
                  onClick={() => setBlocoAberto(null)}
                >
                  Cancelar
                </button>
                <button
                  style={s.confirmBtn}
                  onClick={confirmarUsername}
                  disabled={salvando}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* Bloco Senha */}
          <button style={s.toggleBtn} onClick={() => toggleBloco("senha")}>
            Alterar senha
          </button>

          {blocoAberto === "senha" && (
            <div style={s.expandable}>
              <div style={s.field}>
                <label style={s.label}>Senha atual</label>
                <div style={s.senhaWrap}>
                  <input
                    style={s.input}
                    type={verSenhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                  >
                    {verSenhaAtual ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Nova senha</label>
                <div style={s.senhaWrap}>
                  <input
                    style={s.input}
                    type={verNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerNovaSenha(!verNovaSenha)}
                  >
                    {verNovaSenha ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirmar nova senha</label>
                <div style={s.senhaWrap}>
                  <input
                    style={s.input}
                    type={verConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerConfirmar(!verConfirmar)}
                  >
                    {verConfirmar ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div style={s.expandFooter}>
                <button
                  style={s.cancelSmall}
                  onClick={() => setBlocoAberto(null)}
                >
                  Cancelar
                </button>
                <button
                  style={s.confirmBtn}
                  onClick={confirmarSenhaFn}
                  disabled={salvando}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fixo */}
        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button style={s.saveBtn} onClick={salvarNome} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default EditUser;
