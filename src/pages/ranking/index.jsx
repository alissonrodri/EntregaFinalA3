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
}