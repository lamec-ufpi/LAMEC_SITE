let eventData = null;
let allArticles = [];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('data-container');
    if (!container) return;

    try {
        const scriptData = document.getElementById('proceedings-json-data');
        if (scriptData) {
            eventData = JSON.parse(scriptData.textContent);
            allArticles = flattenArticles(eventData);
            window.allArticles = allArticles;
            
            bindProceedingsControls();
            
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            
            if (query) {
                const input = document.getElementById('searchInput');
                if (input) input.value = query;
                performSearch(query);
            } else if (window.location.pathname.includes('arquivo') && window.location.hash) {
                handleHashFilter();
            }
        } else {
            initializeProceedings();
        }
    } catch (error) {
        console.error("Erro ao carregar anais:", error);
    }
});

async function initializeProceedings() {
    const container = document.getElementById('data-container');
    if (!container) return;

    try {
        const jsonPath = window.STATIC_ROOT + 'proceedings_data.json';
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        eventData = await response.json();
        allArticles = flattenArticles(eventData);
        window.allArticles = allArticles;
        
        bindProceedingsControls();
        
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            const input = document.getElementById('searchInput');
            if (input) input.value = query;
            performSearch(query);
        } else if (window.location.pathname.includes('arquivo')) {
            handleHashFilter();
        }
    } catch (error) {
        container.innerHTML = `<div class="loading-state" style="color:red;">Erro ao carregar anais. Verifique se proceedings_data.json está na pasta static.</div>`;
    }
}

function performSearch(query) {
    query = normalize(query).trim();
    const filtered = allArticles.filter((article) => (
        normalize(`${article.title} ${article.authors} ${article.doi}`).includes(query)
    ));
    renderArticlesList(filtered);
}

function handleHashFilter() {
    const hash = window.location.hash.substring(1);
    if (hash === 'author') renderArticlesList([...allArticles].sort((a, b) => normalize(a.authors).localeCompare(normalize(b.authors))));
    else if (hash === 'title') renderArticlesList([...allArticles].sort((a, b) => normalize(a.title).localeCompare(normalize(b.title))));
    else if (hash === 'category') renderArticlesList([...allArticles].sort((a, b) => normalize(a.categoryName).localeCompare(normalize(b.categoryName))), true);
    else renderArchive(); 
}

window.addEventListener('hashchange', () => {
    if (window.location.pathname.includes('arquivo')) handleHashFilter();
});

function flattenArticles(data) {
    return data.volumes.flatMap((volume) => volume.categories.flatMap((category) => (
        category.articles.map((article) => ({
            ...article,
            volumeId: volume.id,
            volumeTitle: volume.title,
            volumeYear: volume.year,
            categoryName: category.name
        }))
    )));
}

function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderArchive() {
    const container = document.getElementById('archive-results') || document.getElementById('data-container');
    if (!container || !eventData) return;

    container.innerHTML = eventData.volumes.map((volume) => `
        <article class="volume-section" id="${escapeHtml(volume.id)}">
            <div class="volume-summary">
                <img class="volume-cover" src="${window.STATIC_ROOT}${escapeHtml(volume.cover_img)}" alt="Capa">
                <div class="volume-details">
                    <h1>${escapeHtml(volume.title)}</h1>
                    <p class="volume-year">Ano: ${escapeHtml(volume.year)}</p>
                    <a href="${window.BASE_URL}simcompi/proceedings/volume/${escapeHtml(volume.id)}/index.html" class="btn btn-outline">
                        Acessar artigos deste volume
                    </a>
                </div>
            </div>
        </article>`).join('');
}

function renderArticlesList(articles, grouped = false) {
    const container = document.getElementById('archive-results') || document.getElementById('data-container');
    if (!container) return;

    if (!articles.length) {
        container.innerHTML = '<div class="loading-state">Nenhum artigo encontrado.</div>';
        return;
    }

    const groups = grouped
        ? articles.reduce((result, article) => {
            (result[article.categoryName] ||= []).push(article);
            return result;
        }, {})
        : { '': articles };

    container.innerHTML = Object.entries(groups).map(([category, categoryArticles]) => `
        <section class="article-results-group">
            ${category ? `<h2 class="section-title-highlight">${escapeHtml(category)}</h2>` : ''}
            ${categoryArticles.map(renderArticleCard).join('')}
        </section>`).join('');
}

function renderArticleCard(article) {
    const abstract = article.abstract || 'Não informado.';
    
    // Agora o doi já vem null do Python se estiver vazio
    const doiHtml = article.doi 
        ? ` | <strong>DOI:</strong> <a href="https://doi.org/${escapeHtml(article.doi)}" target="_blank">${escapeHtml(article.doi)}</a>` 
        : '';

    return `
        <div class="article-card">
            <h3 class="article-title">${escapeHtml(article.title)}</h3>
            <p class="article-authors">${escapeHtml(article.authors)}</p>
            <p class="article-doi"><strong>Volume:</strong> ${escapeHtml(article.volumeTitle)} (${escapeHtml(article.volumeYear)})${doiHtml}</p>
            
            <div class="article-actions">
                <!-- Consume pdf_path limpo gerado no Python -->
                <a href="${window.STATIC_ROOT}${escapeHtml(article.pdf_path)}" class="btn btn-primary" target="_blank" rel="noopener">
                    <i class="fa-solid fa-file-pdf"></i> PDF
                </a>
            </div>
            
            <div class="article-details-container">
                <div class="abstract-text collapsed">
                    <strong>Abstract:</strong> ${escapeHtml(abstract)}
                </div>
                <button type="button" class="btn btn-text btn-read-more">Read More <i class="fa-solid fa-chevron-down"></i></button>
            </div>
        </div>`;
}

function bindProceedingsControls() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    form?.addEventListener('submit', (event) => {
        if (window.location.pathname.includes('arquivo')) {
            event.preventDefault();
            performSearch(input?.value || '');
        }
    });
}