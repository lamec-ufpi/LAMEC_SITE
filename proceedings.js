let eventData = null;
let allArticles = [];

document.addEventListener('DOMContentLoaded', initializeProceedings);

async function initializeProceedings() {
    const container = document.getElementById('data-container');
    if (!container) return;

    try {
        const response = await fetch('proceedings_data.json');
        if (!response.ok) throw new Error('Falha ao carregar proceedings_data.json.');

        eventData = await response.json();
        allArticles = flattenArticles(eventData);
        window.eventData = eventData;
        window.allArticles = allArticles;
        bindProceedingsControls();
        renderArchive();
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="loading-state error-state">
                Erro ao carregar os anais. Certifique-se de que o arquivo proceedings_data.json está disponível.
            </div>`;
    }
}

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
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeLink(value) {
    const link = String(value || '#');
    return /^(https?:|mailto:|tel:|#|\/)/i.test(link) ? link : '#';
}

function getContainer() {
    return document.getElementById('data-container');
}

function renderArchive() {
    const container = getContainer();
    if (!container || !eventData) return;

    container.innerHTML = eventData.volumes.map((volume) => `
        <article class="volume-section" id="${escapeHtml(volume.id)}">
            <div class="volume-summary">
                <img class="volume-cover" src="${escapeHtml(volume.cover_img)}" alt="Capa de ${escapeHtml(volume.title)}">
                <div class="volume-details">
                    <h2>${escapeHtml(volume.title)}</h2>
                    <p class="volume-year">Ano: ${escapeHtml(volume.year)}</p>
                    <a href="${escapeHtml(safeLink(volume.full_pdf_link))}" class="btn-download-full" target="_blank" rel="noopener">
                        <i class="fa-solid fa-file-pdf"></i> Baixar Volume Completo (PDF)
                    </a>
                    <button type="button" class="btn-action btn-outline volume-articles-btn" data-volume-id="${escapeHtml(volume.id)}">
                        Ver Artigos desta Edição
                    </button>
                </div>
            </div>
        </article>`).join('');

    container.querySelectorAll('.volume-articles-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const articles = allArticles.filter((article) => article.volumeId === button.dataset.volumeId);
            renderArticlesList(articles);
        });
    });
}

function renderCurrentEdition() {
    const container = getContainer();
    if (!container) return;
    container.innerHTML = `
        <div class="edition-message">
            <i class="fa-solid fa-hourglass-half"></i>
            <p>Os anais desta edição serão publicados e disponibilizados ao final do evento.</p>
        </div>`;
}

function renderArticlesList(articles, grouped = false) {
    const container = getContainer();
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
            ${category ? `<h2 class="category-title">${escapeHtml(category)}</h2>` : ''}
            ${categoryArticles.map(renderArticleCard).join('')}
        </section>`).join('');
}

function renderArticleCard(article) {
    return `
        <article class="article-card">
            <p class="article-volume">${escapeHtml(article.volumeTitle)} (${escapeHtml(article.volumeYear)})</p>
            <h3 class="article-title">${escapeHtml(article.title)}</h3>
            <p class="article-authors">${escapeHtml(article.authors)}</p>
            <p class="article-doi"><strong>DOI:</strong> <span>${escapeHtml(article.doi)}</span></p>
            <div class="article-actions">
                <a href="${escapeHtml(safeLink(article.pdf_link))}" class="btn-action btn-pdf" target="_blank" rel="noopener">
                    <i class="fa-solid fa-file-pdf"></i> PDF
                </a>
            </div>
            ${renderArticleDetails(article)}
        </article>`;
}

function renderArticleDetails(article) {
    const abstract = article.abstract || 'Abstract não informado.';
    const keywords = article.keywords || 'Palavras-chave não informadas.';
    return `
        <div class="article-details-container">
            <div class="abstract-text collapsed">
                <strong>Abstract:</strong> ${escapeHtml(abstract)}<br><br>
                <strong>Keywords:</strong> ${escapeHtml(keywords)}
            </div>
            <button type="button" class="btn-read-more">Read More <i class="fa-solid fa-chevron-down"></i></button>
        </div>`;
}

function searchArticles(term) {
    const query = normalize(term).trim();
    const filtered = allArticles.filter((article) => (
        normalize(`${article.title} ${article.authors} ${article.doi}`).includes(query)
    ));
    renderArticlesList(filtered);
}

function bindProceedingsControls() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        searchArticles(input?.value || '');
    });

    document.querySelectorAll('[data-action]').forEach((control) => {
        control.addEventListener('click', (event) => {
            event.preventDefault();
            const actions = {
                archive: renderArchive,
                current: renderCurrentEdition,
                author: () => renderArticlesList([...allArticles].sort((a, b) => normalize(a.authors).localeCompare(normalize(b.authors)))),
                title: () => renderArticlesList([...allArticles].sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)))),
                category: () => renderArticlesList([...allArticles].sort((a, b) => normalize(a.categoryName).localeCompare(normalize(b.categoryName))), true)
            };
            actions[control.dataset.action]?.();
        });
    });
}

window.renderArchive = renderArchive;
window.renderCurrentEdition = renderCurrentEdition;
window.renderArticlesList = renderArticlesList;
