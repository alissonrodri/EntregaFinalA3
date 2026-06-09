import { useState, useEffect } from 'react';
import api from '../../services/api';
import './index.css';

export default function Ranking() {
    const [jogos, setJogos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [top, setTop] = useState(10);
    const [empresaId, setEmpresaId] = useState('');
    const [inputEmpresa, setInputEmpresa] = useState('');
    
    
    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            setErro(null);
            try {

                const params = { top };
                if (empresaId) params.empresa = empresaId;

                const response = await api.get('/relatorios/jogos-mais-vendidos', { params });
                setJogos(response.data);
            } catch (err) {

                if (err.response?.status === 204) {
                    setJogos([]);
                } else {
                    setErro('Não foi possível carregar o ranking. Verifique se a API está rodando.');
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, [top, empresaId]);


    const handleFiltrar = () => {
        setEmpresaId(inputEmpresa);
    };


    const handleLimpar = () => {
        setInputEmpresa('');
        setEmpresaId('');
    };

    const getMedalha = (posicao) => {
        if (posicao === 0) return 'medalha ouro';
        if (posicao === 1) return 'medalha prata';
        if (posicao === 2) return 'medalha bronze';
        return '';
    };

    return (
        <div className='ranking-container'>
            <header className='ranking-header'>
                <div className='ranking-titulo-wrapper'>
                    <span className='ranking-icone'>🏆</span>
                    <div>
                        <h1 className='ranking-titulo'>Ranking de Vendas</h1>
                        <p className='ranking-subtitulo'>Os jogos mais vendidos da plataforma</p>
                    </div>
                </div>
            </header>


            <section className='ranking-filtros'>
                <div className='filtro-grupo'>
                    <label className='filtro-label' htmlFor='top-select'>
                        Exibir Top:
                    </label>
                    <select
                        id='top-select'
                        className='filtro-select'
                        value={top}
                        onChange={(e) => setTop(Number(e.target.value))}
                    >
                        <option value={5}>5 jogos</option>
                        <option value={10}>10 jogos</option>
                        <option value={20}>20 jogos</option>
                        <option value={50}>50 jogos</option>
                    </select>
                </div>


                <div className='filtro-grupo'>
                    <label className='filtro-label' htmlFor='empresa-input'>
                        Filtrar por Empresa (ID):
                    </label>
                    <div className='filtro-empresa-wrapper'>
                        <input
                            id='empresa-input'
                            type='number'
                            className='filtro-input'
                            placeholder='Ex: 1'
                            value={inputEmpresa}
                            onChange={(e) => setInputEmpresa(e.target.value)}
                            min='1'
                        />
                        <button
                            className='filtro-btn-aplicar'
                            onClick={handleFiltrar}
                            disabled={loading}
                        >
                            Filtrar
                        </button>
                        {empresaId && (
                            <button
                                className='filtro-btn-limpar'
                                onClick={handleLimpar}
                                disabled={loading}
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </section>


            
        </div>  
    )
}