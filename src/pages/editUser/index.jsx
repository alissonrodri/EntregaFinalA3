import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// Ícone SVG de calendário
const IconCalendar = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconEye = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconAlert = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "4px", flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function EditUser() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState(""); // exibição DD/MM/AAAA
  const [dateValue, setDateValue] = useState(""); // valor interno AAAA-MM-DD
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
  const [erros, setErros] = useState({});

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
        if (res.data.dataNascimento) {
          const d = new Date(res.data.dataNascimento);
          const dd = String(d.getUTCDate()).padStart(2, "0");
          const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
          const yyyy = d.getUTCFullYear();
          setDataNascimento(`${dd}/${mm}/${yyyy}`);
          setDateValue(`${yyyy}-${mm}-${dd}`);
        }
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
    setErros({});
  };

  // ─── Validações ────────────────────────────────────────────────
  const validarNome = (valor) => {
    if (!valor.trim()) return "O nome não pode ser vazio.";
    if (/[^a-zA-ZÀ-ÿ\s]/.test(valor)) return "Apenas letras são permitidas.";
    const partes = valor.trim().split(/\s+/).filter(Boolean);
    if (partes.length < 2) return "Informe nome e sobrenome.";
    return null;
  };

  const validarData = (valor) => {
    if (!valor.trim()) return "A data de nascimento é obrigatória.";
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = valor.match(regex);
    if (!match) return "Use o formato DD/MM/AAAA.";
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const ano = parseInt(match[3], 10);
    if (mes < 1 || mes > 12) return "Mês inválido.";
    if (dia < 1 || dia > 31) return "Dia inválido.";
    // Valida data real usando UTC para evitar problemas de fuso
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (
      data.getUTCFullYear() !== ano ||
      data.getUTCMonth() + 1 !== mes ||
      data.getUTCDate() !== dia
    )
      return "Data inválida.";
    if (ano < 1900 || ano > new Date().getFullYear()) return "Ano inválido.";
    return null;
  };

  // Máscara DD/MM/AAAA ao digitar manualmente
  const handleDataChange = (valor) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
    let formatado = numeros;
    if (numeros.length > 4)
      formatado =
        numeros.slice(0, 2) +
        "/" +
        numeros.slice(2, 4) +
        "/" +
        numeros.slice(4);
    else if (numeros.length > 2)
      formatado = numeros.slice(0, 2) + "/" + numeros.slice(2);
    setDataNascimento(formatado);
    // Sincroniza o input date oculto
    if (numeros.length === 8) {
      const dd = numeros.slice(0, 2);
      const mm = numeros.slice(2, 4);
      const yyyy = numeros.slice(4);
      setDateValue(`${yyyy}-${mm}-${dd}`);
    }
    if (erros.data) setErros((e) => ({ ...e, data: null }));
  };

  // Quando seleciona pelo calendário nativo
  const handleDatePicker = (valor) => {
    if (!valor) return;
    setDateValue(valor);
    const [yyyy, mm, dd] = valor.split("-");
    setDataNascimento(`${dd}/${mm}/${yyyy}`);
    if (erros.data) setErros((e) => ({ ...e, data: null }));
  };

  const handleNomeChange = (valor) => {
    if (/[^a-zA-ZÀ-ÿ\s]/.test(valor)) return;
    setNome(valor);
    if (erros.nome) setErros((e) => ({ ...e, nome: null }));
  };

  // ─── Ações ─────────────────────────────────────────────────────
  async function salvarNome() {
    const erroNome = validarNome(nome);
    const erroData = validarData(dataNascimento);
    if (erroNome || erroData) {
      setErros({ nome: erroNome, data: erroData });
      return;
    }
    setErros({});
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
      setErros({ username: "Digite um novo nome de usuário." });
      return;
    }
    setErros({});
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
    const novosErros = {};
    if (!senhaAtual) novosErros.senhaAtual = "Digite sua senha atual.";
    if (!novaSenha) novosErros.novaSenha = "Digite a nova senha.";
    else if (novaSenha.length < 8)
      novosErros.novaSenha = "Mínimo de 8 caracteres.";
    if (!confirmarSenha) novosErros.confirmarSenha = "Confirme a nova senha.";
    else if (novaSenha !== confirmarSenha)
      novosErros.confirmarSenha = "As senhas não coincidem.";
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }
    setErros({});
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

  // ─── Estilos ────────────────────────────────────────────────────
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
      padding: "4px 0 6px",
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
    inputErro: {
      background: "#08090b",
      border: "1px solid #e53935",
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
    erroMsg: {
      fontSize: "0.70rem",
      color: "#e53935",
      marginTop: "2px",
      display: "flex",
      alignItems: "center",
    },
    dataWrap: { position: "relative", display: "flex", alignItems: "center" },
    calBtn: {
      position: "absolute",
      right: "8px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#9194a6",
      display: "flex",
      alignItems: "center",
      padding: 0,
    },
    dateHidden: {
      position: "absolute",
      opacity: 0,
      pointerEvents: "none",
      width: 0,
      height: 0,
    },
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
      color: "#9194a6",
      display: "flex",
      alignItems: "center",
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
        <div style={s.header}>
          <h2 style={s.title}>Editar Perfil</h2>
        </div>

        <div style={s.body}>
          {feedback.msg && (
            <div style={s.feedback(feedback.tipo)}>{feedback.msg}</div>
          )}

          <div style={s.avatarWrap}>
            <div style={s.avatar}>{getIniciais()}</div>
          </div>

          {/* Email */}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.inputRO} type="email" value={email} readOnly />
            <span style={s.hint}>O email não pode ser alterado.</span>
          </div>

          {/* Nome + Data */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>
                Nome completo <span style={s.obrig}>*</span>
              </label>
              <input
                style={erros.nome ? s.inputErro : s.input}
                type="text"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Nome e sobrenome"
              />
              {erros.nome && (
                <span style={s.erroMsg}>
                  <IconAlert />
                  {erros.nome}
                </span>
              )}
            </div>
            <div style={s.field}>
              <label style={s.label}>
                Data de nascimento <span style={s.obrig}>*</span>
              </label>
              <div style={s.dataWrap}>
                <input
                  style={{
                    ...(erros.data ? s.inputErro : s.input),
                    paddingRight: "36px",
                  }}
                  type="text"
                  value={dataNascimento}
                  onChange={(e) => handleDataChange(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
                {/* Input date nativo oculto — abre pelo botão */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateValue}
                  onChange={(e) => handleDatePicker(e.target.value)}
                  style={s.dateHidden}
                />
                <button
                  style={s.calBtn}
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <IconCalendar />
                </button>
              </div>
              {erros.data && (
                <span style={s.erroMsg}>
                  <IconAlert />
                  {erros.data}
                </span>
              )}
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
                  style={erros.username ? s.inputErro : s.input}
                  type="text"
                  value={novoUsername}
                  onChange={(e) => {
                    setNovoUsername(e.target.value);
                    if (erros.username)
                      setErros((er) => ({ ...er, username: null }));
                  }}
                  placeholder="@novo_usuario"
                />
                {erros.username && (
                  <span style={s.erroMsg}>
                    <IconAlert />
                    {erros.username}
                  </span>
                )}
              </div>
              <div style={s.expandFooter}>
                <button
                  style={s.cancelSmall}
                  onClick={() => {
                    setBlocoAberto(null);
                    setErros({});
                  }}
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
                    style={{
                      ...(erros.senhaAtual ? s.inputErro : s.input),
                      paddingRight: "36px",
                    }}
                    type={verSenhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => {
                      setSenhaAtual(e.target.value);
                      if (erros.senhaAtual)
                        setErros((er) => ({ ...er, senhaAtual: null }));
                    }}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                  >
                    {verSenhaAtual ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {erros.senhaAtual && (
                  <span style={s.erroMsg}>
                    <IconAlert />
                    {erros.senhaAtual}
                  </span>
                )}
              </div>
              <div style={s.field}>
                <label style={s.label}>Nova senha</label>
                <div style={s.senhaWrap}>
                  <input
                    style={{
                      ...(erros.novaSenha ? s.inputErro : s.input),
                      paddingRight: "36px",
                    }}
                    type={verNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => {
                      setNovaSenha(e.target.value);
                      if (erros.novaSenha)
                        setErros((er) => ({ ...er, novaSenha: null }));
                    }}
                    placeholder="Digite a nova senha"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerNovaSenha(!verNovaSenha)}
                  >
                    {verNovaSenha ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {erros.novaSenha && (
                  <span style={s.erroMsg}>
                    <IconAlert />
                    {erros.novaSenha}
                  </span>
                )}
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirmar nova senha</label>
                <div style={s.senhaWrap}>
                  <input
                    style={{
                      ...(erros.confirmarSenha ? s.inputErro : s.input),
                      paddingRight: "36px",
                    }}
                    type={verConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => {
                      setConfirmarSenha(e.target.value);
                      if (erros.confirmarSenha)
                        setErros((er) => ({ ...er, confirmarSenha: null }));
                    }}
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    style={s.olhoBtn}
                    onClick={() => setVerConfirmar(!verConfirmar)}
                  >
                    {verConfirmar ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {erros.confirmarSenha && (
                  <span style={s.erroMsg}>
                    <IconAlert />
                    {erros.confirmarSenha}
                  </span>
                )}
              </div>
              <div style={s.expandFooter}>
                <button
                  style={s.cancelSmall}
                  onClick={() => {
                    setBlocoAberto(null);
                    setErros({});
                  }}
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
