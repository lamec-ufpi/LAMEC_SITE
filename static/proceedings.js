let eventData = null;
let allArticles = [];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('data-container');
    if (!container) return;
    
    initializeProceedings();
});

async function initializeProceedings() {
    const container = document.getElementById('data-container');
    if (!container) return;

    try {
        // Nova configuração injetada
        const jsonPath = window.LAMEC_CONFIG.proceedingsApiUrl;
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
        } else if (window.location.pathname.includes('arquivo') && window.location.hash) {
            handleHashFilter();
        }
    } catch (error) {
        container.innerHTML = `<div class="loading-state" style="color:red;">Erro ao buscar dados dos anais. Verifique a API.</div>`;
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
                <img class="volume-cover" src="${window.LAMEC_CONFIG.staticRoot}${escapeHtml(volume.cover_img)}" alt="Capa">
                <div class="volume-details">
                    <h1>${escapeHtml(volume.title)}</h1>
                    <p class="volume-year">Ano: ${escapeHtml(volume.year)}</p>
                    <a href="${window.LAMEC_CONFIG.baseUrl}simcompi/proceedings/volume/${escapeHtml(volume.id)}/index.html" class="btn btn-outline">
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
    const template = document.getElementById('article-card-template');
    if (!template) return '';
    
    // Clona o HTML pronto do Jinja
    const clone = template.content.cloneNode(true);
    const isPubs = window.location.pathname.includes('publications');
    const abstractLabel = isPubs ? 'Abstract:' : 'Resumo:';
    
    // Substitui os textos com segurança
    clone.querySelector('.js-title').textContent = article.title;
    clone.querySelector('.js-authors i').textContent = article.authors;
    
    const abstract = article.abstract || 'Não informado.';
    clone.querySelector('.js-abstract').innerHTML = `<strong>${abstractLabel}</strong> ${escapeHtml(abstract)}`;
    
    // Exibe ou oculta Volume
    if (article.volumeTitle) {
        clone.querySelector('.js-volume').style.display = '';
        clone.querySelector('.js-vol-text').textContent = `${article.volumeTitle}`;
    }
    
    // Exibe ou oculta Link
    if (article.doi) {
        const linkWrapper = clone.querySelector('.js-link-wrapper');
        linkWrapper.style.display = '';
        const linkObj = linkWrapper.querySelector('.js-link');
        linkObj.href = article.doi;
        linkObj.textContent = article.doi;
    }
    
    // Regula o botão de PDF
    if (article.pdf_path && article.pdf_path !== '#') {
        const pdfBtn = clone.querySelector('.js-pdf');
        pdfBtn.style.display = '';
        pdfBtn.href = window.LAMEC_CONFIG.staticRoot + article.pdf_path;
    } else {
        clone.querySelector('.js-no-pdf').style.display = '';
    }
    
    // Transforma o Node de volta pra string pra caber no map().join('') do JS atual
    const div = document.createElement('div');
    div.appendChild(clone);
    return div.innerHTML;
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