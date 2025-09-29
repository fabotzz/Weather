const API_KEY = '28c7fb0c0c57bb57a34668c39ad54180';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
// =========================================

// Variáveis globais do mapa
let map;
let marker;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado! Iniciando aplicação...');
    
    // Elementos do DOM
    const elements = {
        cityInput: document.getElementById('city-input'),
        searchBtn: document.getElementById('search-btn'),
        loading: document.getElementById('loading'),
        weatherContainer: document.getElementById('weather-container'),
        errorMessage: document.getElementById('error-message'),
        cityName: document.getElementById('city-name'),
        weatherIcon: document.getElementById('weather-icon'),
        temperature: document.getElementById('temperature'),
        weatherDescription: document.getElementById('weather-description'),
        feelsLike: document.getElementById('feels-like'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('wind-speed'),
        pressure: document.getElementById('pressure'),
        map: document.getElementById('map') // Elemento do mapa
    };

    // Verificar se todos os elementos existem
    console.log('🔍 Verificando elementos:');
    for (const [key, element] of Object.entries(elements)) {
        console.log(`${key}:`, element ? '✅ Encontrado' : '❌ Não encontrado');
    }

    // Verificar elementos críticos
    if (!elements.searchBtn || !elements.cityInput) {
        showError('Erro: Elementos da página não carregaram corretamente.');
        return;
    }

    // Verificar se o elemento do mapa existe
    if (!elements.map) {
        console.error('❌ Elemento #map não encontrado no HTML!');
        showError('Erro: Container do mapa não encontrado.');
        return;
    }

    // Verificar chave API
    if (API_KEY === 'sua_chave_aqui') {
        showError('🔑 **COLE SUA CHAVE API**<br>Na linha 3 do arquivo script.js<br><br>Obtenha uma chave gratuita em: https://openweathermap.org/api');
        return;
    }

    // Verificar se Leaflet está carregado
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet não está carregado!');
        showError('❌ Biblioteca do mapa não carregada. Verifique sua conexão.');
        return;
    }

    // Inicializar o mapa
    initMap();

    // Configurar event listeners
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Buscar automaticamente ao carregar a página
    getWeatherData('São Paulo');

    // ========== FUNÇÕES PRINCIPAIS ==========

    function handleSearch() {
        const city = elements.cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        } else {
            showError('⚠️ Por favor, digite o nome de uma cidade');
        }
    }

    async function getWeatherData(city) {
        console.log(`📍 Buscando clima para: "${city}"`);
        
        showLoading();

        try {
            // Fazer requisição para a API de clima atual
            const weatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
            console.log('🔗 URL da API:', weatherUrl);

            const response = await fetch(weatherUrl);
            console.log('📡 Status da resposta:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Chave API inválida ou não autorizada');
                } else if (response.status === 404) {
                    throw new Error(`Cidade "${city}" não encontrada`);
                } else if (response.status === 429) {
                    throw new Error('Limite de requisições excedido. Tente novamente mais tarde.');
                } else {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
            }

            const weatherData = await response.json();
            console.log('✅ Dados do clima recebidos:', weatherData);

            // Exibir dados do clima
            displayWeatherData(weatherData);
            
            // Atualizar mapa com as coordenadas
            updateMap(weatherData.coord.lat, weatherData.coord.lon, weatherData.name, weatherData.weather[0].icon);
            
            // Mostrar resultados
            showWeather();

        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error);
            showError(`❌ ${error.message}`);
        } finally {
            hideLoading();
        }
    }

    function displayWeatherData(data) {
        // Atualizar todos os elementos com os dados recebidos
        if (elements.cityName) elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
        if (elements.temperature) elements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
        if (elements.weatherDescription) elements.weatherDescription.textContent = data.weather[0].description;
        if (elements.feelsLike) elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        if (elements.humidity) elements.humidity.textContent = `${data.main.humidity}%`;
        if (elements.windSpeed) elements.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        if (elements.pressure) elements.pressure.textContent = `${data.main.pressure} hPa`;

        // Atualizar ícone do clima
        if (elements.weatherIcon) {
            elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            elements.weatherIcon.alt = data.weather[0].description;
            elements.weatherIcon.style.display = 'block';
        }
    }

    // ========== FUNÇÕES DO MAPA ==========

    function initMap() {
        console.log('🔄 Inicializando mapa...');
        
        try {
            // Verificar se o container do mapa está visível e tem altura
            if (elements.map.offsetHeight === 0) {
                console.warn('⚠️ Container do mapa tem altura zero, ajustando...');
                elements.map.style.height = '300px';
            }

            // Criar mapa centrado no Brasil
            map = L.map('map', {
                center: [-14.2350, -51.9253],
                zoom: 4,
                zoomControl: false // Vamos adicionar manualmente depois
            });

            // Adicionar camada do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18,
                minZoom: 2
            }).addTo(map);

            // Adicionar controle de zoom personalizado
            L.control.zoom({
                position: 'topright'
            }).addTo(map);

            // Adicionar controle de escala
            L.control.scale({
                imperial: false,
                metric: true
            }).addTo(map);

            // Forçar redimensionamento após um pequeno delay
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    console.log('✅ Mapa redimensionado!');
                }
            }, 100);

            console.log('🗺️ Mapa inicializado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            // Mostrar mensagem de erro no container do mapa
            elements.map.innerHTML = `
                <div style="color: white; text-align: center; padding: 50px; background: rgba(255,0,0,0.1); border-radius: 10px;">
                    <h3>❌ Erro ao carregar o mapa</h3>
                    <p>${error.message}</p>
                    <small>Verifique o console para mais detalhes</small>
                </div>
            `;
        }
    }

    function updateMap(lat, lon, cityName, weatherIcon) {
        console.log(`📍 Atualizando mapa para: ${cityName} (${lat}, ${lon})`);
        
        if (!map) {
            console.error('❌ Mapa não inicializado!');
            return;
        }

        try {
            // Remover marcador anterior se existir
            if (marker) {
                map.removeLayer(marker);
            }

            // Centralizar mapa na nova localização
            map.setView([lat, lon], 10);

            // Criar ícone personalizado
            const customIcon = L.divIcon({
                className: 'weather-marker',
                html: `
                    <div style="
                        background: #3498db;
                        border: 3px solid white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    "></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // Adicionar novo marcador
            marker = L.marker([lat, lon], { icon: customIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="text-align: center; padding: 10px; min-width: 120px;">
                        <strong>${cityName}</strong><br>
                        <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" 
                             alt="Clima" 
                             style="width: 40px; height: 40px; margin: 5px 0;"><br>
                        <small>📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
                    </div>
                `)
                .openPopup();

            // Adicionar evento de clique no mapa para fechar popup
            map.on('click', function() {
                if (marker) {
                    marker.closePopup();
                }
            });

            // Forçar redimensionamento do mapa
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 50);

            console.log('✅ Mapa atualizado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao atualizar mapa:', error);
        }
    }

    // ========== FUNÇÕES DE CONTROLE DA INTERFACE ==========

    function showLoading() {
        console.log('🔄 Mostrando tela de carregamento...');
        if (elements.loading) elements.loading.classList.remove('hidden');
        if (elements.weatherContainer) elements.weatherContainer.classList.add('hidden');
        if (elements.errorMessage) elements.errorMessage.classList.add('hidden');
        if (elements.searchBtn) elements.searchBtn.disabled = true;
    }

    function hideLoading() {
        console.log('✅ Ocultando tela de carregamento...');
        if (elements.loading) elements.loading.classList.add('hidden');
        if (elements.searchBtn) elements.searchBtn.disabled = false;
    }

    function showWeather() {
        console.log('🌤️ Mostrando dados do clima...');
        if (elements.weatherContainer) elements.weatherContainer.classList.remove('hidden');
        if (elements.errorMessage) elements.errorMessage.classList.add('hidden');
        
        // Forçar redimensionamento do mapa quando o container ficar visível
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
    }

    function showError(message) {
        console.log('❌ Mostrando mensagem de erro:', message);
        if (elements.errorMessage) {
            elements.errorMessage.innerHTML = `<p>${message}</p>`;
            elements.errorMessage.classList.remove('hidden');
        }
        if (elements.weatherContainer) elements.weatherContainer.classList.add('hidden');
        if (elements.loading) elements.loading.classList.add('hidden');
    }

    // ========== FUNÇÕES AUXILIARES ==========

    // Função para buscar pela localização do usuário
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    reverseGeocode(lat, lon);
                },
                function(error) {
                    console.warn('❌ Geolocalização não permitida:', error);
                    showError('⚠️ Permissão de localização negada.');
                }
            );
        } else {
            showError('⚠️ Seu navegador não suporta geolocalização.');
        }
    }

    // Função para converter coordenadas em nome da cidade
    async function reverseGeocode(lat, lon) {
        try {
            showLoading();
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county;
                if (city) {
                    getWeatherData(city);
                } else {
                    throw new Error('Não foi possível determinar a cidade');
                }
            } else {
                throw new Error('Dados de localização inválidos');
            }
        } catch (error) {
            console.error('❌ Erro no reverse geocoding:', error);
            showError('❌ Não foi possível determinar sua localização.');
        }
    }

    // ========== BOTÃO DE LOCALIZAÇÃO ==========

    // Adicionar botão de localização
    const locationButton = document.createElement('button');
    locationButton.textContent = '📍 Minha Localização';
    locationButton.style.cssText = `
        background: #2ecc71;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        margin: 10px auto;
        display: block;
        font-size: 14px;
        transition: background 0.3s;
    `;
    
    locationButton.addEventListener('mouseenter', function() {
        this.style.background = '#27ae60';
    });
    
    locationButton.addEventListener('mouseleave', function() {
        this.style.background = '#2ecc71';
    });
    
    locationButton.addEventListener('click', getUserLocation);
    
    // Inserir botão após a barra de pesquisa
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.appendChild(locationButton);
    }

    console.log('✅ Aplicação totalmente carregada e configurada!');
});

// ========== TRATAMENTO DE ERROS GLOBAIS ==========

window.addEventListener('error', function(e) {
    console.error('💥 Erro global:', e.error);
});

// ========== REDIMENSIONAMENTO DA JANELA ==========

window.addEventListener('resize', function() {
    if (typeof map !== 'undefined' && map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 150);
    }
});