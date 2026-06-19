import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function EditUser() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const timerRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [usernameOriginal, setUsernameOriginal] = useState("");
  const [dataNascimentoOriginal, setDataNascimentoOriginal] = useState("");

  const [blocoAberto, setBlocoAberto] = useState(null);
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: "", msg: "" });
  const [erros, setErros] = useState({});
  const [contador, setContador] = useState(null);

  const inlineStyles = {
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
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
        const nomeCarregado = res.data.nome || "";
        setUsername(nomeCarregado);
        setUsernameOriginal(nomeCarregado);
        setEmail(res.data.email || "");
        if (res.data.dataNascimento) {
          const raw = res.data.dataNascimento;
          let dd, mm, yyyy;

          if (raw.includes("/")) {
            // Servidor retornou DD/MM/YYYY
            [dd, mm, yyyy] = raw.split("/");
          } else {
            // Servidor retornou ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)
            const d = new Date(raw);
            dd = String(d.getUTCDate()).padStart(2, "0");
            mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            yyyy = String(d.getUTCFullYear());
          }

          const dataFormatada = `${dd}/${mm}/${yyyy}`;
          setDataNascimento(dataFormatada);
          setDataNascimentoOriginal(dataFormatada);
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
    const partes = username.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return username.trim().slice(0, 2).toUpperCase() || "--";
  };

  const mostrarFeedback = (tipo, msg) => {
    setFeedback({ tipo, msg });
    if (tipo !== "sucesso")
      setTimeout(() => setFeedback({ tipo: "", msg: "" }), 4000);
  };

  const iniciarRedirecionamento = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let seg = 3;
    setContador(seg);
    timerRef.current = setInterval(() => {
      seg -= 1;
      setContador(seg);
      if (seg <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        navigate("/");
      }
    }, 1000);
  };

  const cancelarRedirecionamento = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setContador(null);
    setFeedback({ tipo: "", msg: "" });
  };

  const toggleBloco = (bloco) => {
    cancelarRedirecionamento();
    setBlocoAberto(blocoAberto === bloco ? null : bloco);
    setErros({});
  };

  const validarUsername = (valor) => {
    if (!valor.trim()) return "O nome de usuário não pode ser vazio.";
    if (/\s/.test(valor)) return "O nome de usuário não pode conter espaços.";
    if (valor.length < 3) return "Mínimo de 3 caracteres.";
    return null;
  };

  const validarData = (valor) => {
    if (!valor.trim()) return "A data de nascimento é obrigatória.";
    const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "Use o formato DD/MM/AAAA.";
    const dia = parseInt(match[1], 10),
      mes = parseInt(match[2], 10),
      ano = parseInt(match[3], 10);
    if (mes < 1 || mes > 12) return "Mês inválido.";
    if (dia < 1 || dia > 31) return "Dia inválido.";
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (
      data.getUTCFullYear() !== ano ||
      data.getUTCMonth() + 1 !== mes ||
      data.getUTCDate() !== dia
    )
      return "Data inválida.";
    if (ano < 1900 || ano > new Date().getFullYear()) return "Ano inválido.";
    const hoje = new Date();
    const idade =
      hoje.getFullYear() -
      ano -
      (hoje.getMonth() + 1 < mes ||
      (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
        ? 1
        : 0);
    if (idade < 16) return "É necessário ter pelo menos 16 anos.";
    return null;
  };

  const handleDataChange = (valor) => {
    const n = valor.replace(/\D/g, "").slice(0, 8);
    let f = n;
    if (n.length > 4)
      f = n.slice(0, 2) + "/" + n.slice(2, 4) + "/" + n.slice(4);
    else if (n.length > 2) f = n.slice(0, 2) + "/" + n.slice(2);
    setDataNascimento(f);
    if (n.length === 8)
      setDateValue(`${n.slice(4)}-${n.slice(2, 4)}-${n.slice(0, 2)}`);
    if (erros.data) setErros((e) => ({ ...e, data: null }));
  };

  const handleDatePicker = (valor) => {
    if (!valor) return;
    setDateValue(valor);
    const [yyyy, mm, dd] = valor.split("-");
    setDataNascimento(`${dd}/${mm}/${yyyy}`);
    if (erros.data) setErros((e) => ({ ...e, data: null }));
  };

  const handleUsernameChange = (valor) => {
    if (/\s/.test(valor)) return;
    setUsername(valor);
    if (erros.username) setErros((e) => ({ ...e, username: null }));
  };

  async function salvarPerfil() {
    if (
      username === usernameOriginal &&
      dataNascimento === dataNascimentoOriginal
    ) {
      mostrarFeedback("aviso", "Nenhuma alteração foi feita.");
      return;
    }
    const erroUsername = validarUsername(username);
    const erroData = validarData(dataNascimento);
    if (erroUsername || erroData) {
      setErros({ username: erroUsername, data: erroData });
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      // Envia DD/MM/YYYY — mesmo formato usado em signUp, evita ambiguidade de timezone
      await api.put(`/usuarios/${userId}`, {
        nome: username,
        dataNascimento: dataNascimento,
      });
      setUsernameOriginal(username);
      setDataNascimentoOriginal(dataNascimento);
      mostrarFeedback("sucesso", "Alterações salvas!");
      iniciarRedirecionamento();
    } catch {
      mostrarFeedback("erro", "Erro ao salvar as alterações.");
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
    else if (novaSenha.length > 15)
      novosErros.novaSenha = "Máximo de 15 caracteres.";
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
      mostrarFeedback("sucesso", "Senha alterada!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setBlocoAberto(null);
      iniciarRedirecionamento();
    } catch {
      mostrarFeedback("erro", "Senha atual incorreta.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div className="eu-loading">Carregando...</div>;

  return (
    <div style={inlineStyles.overlay}>
      <div style={inlineStyles.container}>
        <div className="eu-header">
          <h2 className="eu-title">Editar Perfil</h2>
        </div>

        <div className="eu-body">
          {feedback.msg && (
            <div className={`eu-feedback eu-feedback--${feedback.tipo}`}>
              <span>
                {feedback.msg}
                {contador !== null && ` Redirecionando em ${contador}s...`}
              </span>
              {contador !== null && (
                <button
                  className="eu-continuar-btn"
                  onClick={cancelarRedirecionamento}
                >
                  Continuar editando
                </button>
              )}
            </div>
          )}

          <div className="eu-avatar-wrap">
            <div className="eu-avatar">{getIniciais()}</div>
          </div>

          <div className="eu-field">
            <label className="eu-label">Email</label>
            <input
              className="eu-input eu-input--readonly"
              type="email"
              value={email}
              readOnly
            />
            <span className="eu-hint">O email não pode ser alterado.</span>
          </div>

          <div className="eu-row">
            <div className="eu-field">
              <label className="eu-label">
                Nome de usuário <span className="eu-obrig">*</span>
              </label>
              <input
                className={`eu-input${erros.username ? " eu-input--erro" : ""}`}
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="seu_usuario"
              />
              {erros.username && (
                <span className="eu-erro-msg">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {erros.username}
                </span>
              )}
            </div>
            <div className="eu-field">
              <label className="eu-label">
                Data de nascimento <span className="eu-obrig">*</span>
              </label>
              <div className="eu-data-wrap">
                <input
                  className={`eu-input eu-input--pr${erros.data ? " eu-input--erro" : ""}`}
                  type="text"
                  value={dataNascimento}
                  onChange={(e) => handleDataChange(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateValue}
                  onChange={(e) => handleDatePicker(e.target.value)}
                  className="eu-date-hidden"
                />
                <button
                  className="eu-cal-btn"
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <i className="fa-solid fa-calendar-days"></i>
                </button>
              </div>
              {erros.data && (
                <span className="eu-erro-msg">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {erros.data}
                </span>
              )}
            </div>
          </div>

          <button
            className="eu-toggle-btn"
            onClick={() => toggleBloco("senha")}
          >
            Alterar senha
          </button>
          {blocoAberto === "senha" && (
            <div className="eu-expandable">
              {/* Senha atual */}
              <div className="eu-field">
                <label className="eu-label">Senha atual</label>
                <div className="eu-senha-wrap">
                  <input
                    className={`eu-input eu-input--pr${erros.senhaAtual ? " eu-input--erro" : ""}`}
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
                    className="eu-olho-btn"
                    onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                  >
                    <i
                      className={`fa-solid ${verSenhaAtual ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
                {erros.senhaAtual && (
                  <span className="eu-erro-msg">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {erros.senhaAtual}
                  </span>
                )}
              </div>
              {/* Nova senha */}
              <div className="eu-field">
                <label className="eu-label">Nova senha</label>
                <div className="eu-senha-wrap">
                  <input
                    className={`eu-input eu-input--pr${erros.novaSenha ? " eu-input--erro" : ""}`}
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
                    className="eu-olho-btn"
                    onClick={() => setVerNovaSenha(!verNovaSenha)}
                  >
                    <i
                      className={`fa-solid ${verNovaSenha ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
                {erros.novaSenha && (
                  <span className="eu-erro-msg">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {erros.novaSenha}
                  </span>
                )}
              </div>
              {/* Confirmar senha */}
              <div className="eu-field">
                <label className="eu-label">Confirmar nova senha</label>
                <div className="eu-senha-wrap">
                  <input
                    className={`eu-input eu-input--pr${erros.confirmarSenha ? " eu-input--erro" : ""}`}
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
                    className="eu-olho-btn"
                    onClick={() => setVerConfirmar(!verConfirmar)}
                  >
                    <i
                      className={`fa-solid ${verConfirmar ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
                {erros.confirmarSenha && (
                  <span className="eu-erro-msg">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {erros.confirmarSenha}
                  </span>
                )}
              </div>
              <div className="eu-expand-footer">
                <button
                  className="eu-btn-cancel-small"
                  onClick={() => {
                    setBlocoAberto(null);
                    setErros({});
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="eu-btn-confirm"
                  onClick={confirmarSenhaFn}
                  disabled={salvando}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="eu-footer">
          <button className="eu-btn-cancel" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="eu-btn-save"
            onClick={salvarPerfil}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
