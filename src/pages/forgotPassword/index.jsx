import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './index.css';


import iconHidden from '../../assets/img/senha_oculta.png';
import iconShow from '../../assets/img/senha_visivel.png';

const RecuperarSenha = () => {
    const navigate = useNavigate();
    

    const [step, setStep] = useState(1);
    
    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [showNovaSenha, setShowNovaSenha] = useState(false);
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

    const [status, setStatus] = useState('idle'); 
    const [message, setMessage] = useState('');

    
    const handleVerifyEmail = (e) => {
        e.preventDefault();
        
        if (!email) {
            setMessage('Por favor, digite seu e-mail.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

       
        setTimeout(() => {
            setStep(2);
            setStatus('idle');
        }, 1500);
    };


    const handleVerifyCode = (e) => {
        e.preventDefault();
        setMessage('');

        if (codigo === '123456') {
            setStep(3); 
            setStatus('idle');
        } else {
            setMessage('Código de verificação inválido.');
            setStatus('error');
        }
    };


    const handleResetPassword = (e) => {
        e.preventDefault();
        
        if (novaSenha !== confirmarSenha) {
            setMessage('Senhas não coincidem.');
            setStatus('error');
            return;
        }

        if (novaSenha.length < 8) {
            setMessage('A nova senha deve ter pelo menos 8 caracteres.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

        
        setTimeout(() => {
            setStep(4);
            setStatus('idle');
        }, 1500);
    };

    return (
        <div className="signin-container">
            <div className="signin-form">
                
               
                {step === 1 && (
                    <form onSubmit={handleVerifyEmail}>
                        <h2>Recuperar <span className="logo-text">Senha</span></h2>
                        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Insira seu e-mail para localizarmos sua conta.
                        </p>

                        {status === 'error' && message && (
                            <div className="error-message">{message}</div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="recovery-email">E-mail cadastrado</label>
                            <input 
                                type="email" 
                                id="recovery-email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com" 
                                disabled={status === 'loading'}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-signin" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Verificando...' : 'Avançar'}
                        </button>

                        <div className="signin-footer">
                            <Link to="/signin">Voltar para o login</Link>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <h2>Código de <span className="logo-text">Verificação</span></h2>
                        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Enviamos um código para <strong>{email}</strong>.<br/>
                            (Para testes, utilize <strong>123456</strong>)
                        </p>

                        {status === 'error' && message && (
                            <div className="error-message">{message}</div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="recovery-code">Código de 6 dígitos</label>
                            <input 
                                type="text" 
                                id="recovery-code" 
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                placeholder="Ex: 123456" 
                                maxLength="6"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-signin">
                            Validar Código
                        </button>

                        <div className="signin-footer">
                            <button type="button" onClick={() => setStep(1)} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline'}}>
                                Voltar e corrigir e-mail
                            </button>
                        </div>
                    </form>
                )}

     
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <h2>Redefinir <span className="logo-text">Senha</span></h2>
                        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Crie uma nova senha de acesso para sua conta.
                        </p>

                        {status === 'error' && message && (
                            <div className="error-message">{message}</div>
                        )}

                        <div className="form-group">
                            <label>Nova Senha</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showNovaSenha ? "text" : "password"} 
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    placeholder="Sua nova senha" 
                                    required
                                    disabled={status === 'loading'}
                                />
                                <button type="button" className="password-toggle-btn" onClick={() => setShowNovaSenha(!showNovaSenha)}>
                                    <img src={showNovaSenha ? iconShow : iconHidden} alt="Alternar" className="password-icon" />
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirmar Nova Senha</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showConfirmarSenha ? "text" : "password"} 
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    placeholder="Repita a nova senha" 
                                    required
                                    disabled={status === 'loading'}
                                />
                                <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                                    <img src={showConfirmarSenha ? iconShow : iconHidden} alt="Alternar" className="password-icon" />
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-signin" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Salvando...' : 'Salvar Nova Senha'}
                        </button>
                    </form>
                )}

                
                {step === 4 && (
                    <div style={{ textAlign: 'center' }}>
                        <h2>Sucesso! <span className="logo-text">🎉</span></h2>
                        <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>
                            Sua senha foi redefinida com sucesso. Você já pode acessar o sistema com as novas credenciais.
                        </p>
                        <button onClick={() => navigate('/signin')} className="btn-signin" style={{ marginTop: '30px' }}>
                            Ir para o Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecuperarSenha;