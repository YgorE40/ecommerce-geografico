// frontend/app.js
const API_URL = 'http://localhost:3000';

// Elementos da Página de Autenticação (Login/Cadastro)
const authForm = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle-link');
const authTitle = document.getElementById('auth-title');
const btnSubmit = document.getElementById('btn-submit');
const registerFields = document.getElementById('register-fields');
const errorBox = document.getElementById('error-message');
const btnGps = document.getElementById('btn-gps');

let modoCadastro = false;

// ==========================================
// 1. ALTERNAR ENTRE LOGIN E CADASTRO
// ==========================================
if (toggleLink) {
    toggleLink.addEventListener('click', () => {
        modoCadastro = !modoCadastro;
        if (modoCadastro) {
            authTitle.innerText = "Criar Nova Conta";
            btnSubmit.innerText = "Cadastrar";
            registerFields.classList.remove('hidden');
            toggleLink.innerText = "Faça Login aqui";
        } else {
            authTitle.innerText = "Fazer Login";
            btnSubmit.innerText = "Entrar";
            registerFields.classList.add('hidden');
            toggleLink.innerText = "Cadastre-se aqui";
        }
        errorBox.classList.add('hidden');
    });
}

if (btnGps) {
    btnGps.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert("Seu navegador não suporta Geolocalização.");
            return;
        }
        btnGps.innerText = "Buscando...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('lat-input').value = position.coords.latitude.toFixed(6);
                document.getElementById('lon-input').value = position.coords.longitude.toFixed(6);
                btnGps.innerText = "GPS Obtido!";
            },
            (error) => {
                alert("Erro ao pegar GPS. Digite as coordenadas manualmente.");
                btnGps.innerText = "Pegar GPS Atual";
            }
        );
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');

        const email = document.getElementById('email-input').value;
        const CollegePassword = document.getElementById('senha-input').value;

        try {
            if (modoCadastro) {
                // Modo Cadastro
                const nome = document.getElementById('nome-input').value;
                const lat = document.getElementById('lat-input').value;
                const lon = document.getElementById('lon-input').value;

                const response = await fetch(`${API_URL}/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha: CollegePassword, lat: parseFloat(lat), lon: parseFloat(lon) })
                });

                const dados = await response.json();
                if (!response.ok) throw new Error(dados.erro || 'Erro no cadastro');

                alert("Cadastro realizado! Faça o login.");
                toggleLink.click(); // Volta para a tela de login automaticamente
            } else {
                // Modo Login
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha: CollegePassword })
                });

                const dados = await response.json();
                if (!response.ok) throw new Error(dados.erro || 'Erro no login');

                // Salva os dados da sessão (Exigência do Prof. Ricardo)
                localStorage.setItem('token', dados.token);
                localStorage.setItem('usuario_nome', dados.usuario.nome);
                
                // Redireciona para o Painel do E-commerce
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            errorBox.innerText = err.message;
            errorBox.classList.remove('hidden');
        }
    });
}

// ==========================================
// 4. LÓGICA DO DASHBOARD (MAPA GEOGRÁFICO)
// ==========================================
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('token');
        const nomeUsuario = localStorage.getItem('usuario_nome');
        const errorDash = document.getElementById('error-dashboard');

        // Se tentar burlar digitando a URL sem logar, chuta de volta (Filtro de Segurança)
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('boas-vindas').innerText = `Olá, ${nomeUsuario}!`;

        // Coordenadas padrão (caso precise centralizar o mapa antes de carregar as lojas)
        // Usando como base Goianésia / Goiás perto de -15.31, -49.01
        const centroMapa = [-15.3240, -49.1170];
        
        // Inicializa o mapa do Leaflet apontando para a div #mapa
        const mapa = L.map('mapa').setView(centroMapa, 14);

        // Adiciona as imagens do mapa do OpenStreetMap (Camada Visual)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapa);

        try {
            // Buscando as lojas mais próximas passando a localização simulada da URL
            const response = await fetch(`${API_URL}/lojas-proximas?lat=${centroMapa[0]}&lon=${centroMapa[1]}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` } // Passa o token JWT obrigatório
            });

            if (response.status === 401 || response.status === 403) {
                // Token expirou ou foi violado (Tratamento exigido pelo Prof. Ricardo)
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }

            const lojas = await response.json();
            if (!response.ok) throw new Error(lojas.erro || 'Erro ao buscar lojas');

            const listaLojas = document.getElementById('lista-lojas');
            
            // Renderiza as lojas na tela e no mapa
           lojas.forEach(loja => {
                const li = document.createElement('li');
                li.className = 'loja-card';
                const distKm = (loja.distancia_metros / 1000).toFixed(2);
                
                li.innerHTML = `
                    <div>
                        <strong>${loja.nome}</strong><br>
                        <small>${loja.categoria} • a ${distKm} km</small>
                    </div>
                `;
                listaLojas.appendChild(li);

                // MÁGICA DEFINITIVA: O Leaflet lê as coordenadas (lat e lon) que a API extraiu do PostGIS!
                L.marker([loja.lat, loja.lon]).addTo(mapa)
                    .bindPopup(`<b>${loja.nome}</b><br>${loja.categoria}<br>Distância: ${distKm} km`);
            });

        } catch (err) {
            errorDash.innerText = err.message;
            errorDash.classList.remove('hidden');
        }
    });

    // Botão de Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}