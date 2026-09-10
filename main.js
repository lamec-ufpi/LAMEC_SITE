document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-background-image]').forEach((element) => {
        element.style.backgroundImage = element.dataset.backgroundImage;
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.btn-read-more');
        if (!button) return;
        const details = button.previousElementSibling;
        if (!details) return;
        const expanded = details.classList.toggle('expanded');
        details.classList.toggle('collapsed', !expanded);
        button.innerHTML = expanded
            ? 'Read Less <i class="fa-solid fa-chevron-up"></i>'
            : 'Read More <i class="fa-solid fa-chevron-down"></i>';
    });

    const navbar = document.getElementById('navbar');
    if (navbar) {
        const updateNavbarShadow = () => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 50);
        };
        updateNavbarShadow();
        window.addEventListener('scroll', updateNavbarShadow, { passive: true });
    }

    const contactForm = document.getElementById('form-contato');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Mensagem enviada com sucesso! (Simulação)');
            contactForm.reset();
        });
    }

    const heroSlider = document.getElementById('hero-slider');
    if (heroSlider) {
        const backgroundImages = [
            "url('https://via.placeholder.com/1920x1080/444/fff?text=LABORATORY+PHOTO+1')",
            "url('https://via.placeholder.com/1920x1080/267c94/fff?text=LABORATORY+PHOTO+2')",
            "url('https://via.placeholder.com/1920x1080/154c6b/fff?text=LABORATORY+PHOTO+3')"
        ];
        let currentSlide = 0;
        const changeSlide = (direction) => {
            currentSlide = (currentSlide + direction + backgroundImages.length) % backgroundImages.length;
            heroSlider.style.backgroundImage = backgroundImages[currentSlide];
        };
        document.querySelector('[data-slide="prev"], .slider-prev')?.addEventListener('click', () => changeSlide(-1));
        document.querySelector('[data-slide="next"], .slider-next')?.addEventListener('click', () => changeSlide(1));
    }

    const modal = document.getElementById('teamModal');
    if (modal) {
        const modalImg = document.getElementById('modalImg');
        const modalName = document.getElementById('modalName');
        const modalRole = document.getElementById('modalRole');
        const modalBio = document.getElementById('modalBio');
        const modalLattes = document.getElementById('modalLattes');
        const closeModal = () => modal.classList.remove('active');

        if (!modalImg || !modalName || !modalRole || !modalBio || !modalLattes) return;

        document.querySelectorAll('.modal-trigger').forEach((card) => {
            card.addEventListener('click', () => {
                const data = card.dataset;
                modalImg.style.backgroundImage = `url('${data.img}')`;
                modalName.textContent = data.name;
                modalRole.textContent = data.role;
                modalBio.innerHTML = data.bio;
                modalLattes.href = data.lattes;
                modal.classList.add('active');
            });
        });
        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    const countdownFields = ['days', 'hours', 'minutes', 'seconds'].map((id) => document.getElementById(id));
    if (countdownFields.every(Boolean)) {
        const targetDate = new Date('Mar 22, 2027 08:00:00').getTime();
        const updateCountdown = () => {
            const distance = Math.max(0, targetDate - Date.now());
            const values = [
                Math.floor(distance / 86400000),
                Math.floor((distance % 86400000) / 3600000),
                Math.floor((distance % 3600000) / 60000),
                Math.floor((distance % 60000) / 1000)
            ];
            countdownFields.forEach((field, index) => {
                field.textContent = String(values[index]).padStart(2, '0');
            });
        };
        updateCountdown();
        window.setInterval(updateCountdown, 1000);
    }

    const activateTab = (button, tabId) => {
        document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
        button.classList.add('active');
    };
    document.querySelectorAll('.tab-btn').forEach((button, index) => {
        button.addEventListener('click', () => {
            activateTab(button, button.dataset.tab || `day${index + 1}`);
        });
    });

    const journalList = document.getElementById('journal-list');
    const conferenceList = document.getElementById('conference-list');
    if (journalList && conferenceList) {
        const publicationsUrl = new URL('publications.json', window.location.href);
        fetch(publicationsUrl)
            .then((response) => {
                if (!response.ok) throw new Error('Erro ao carregar o JSON.');
                return response.json();
            })
            .then((data) => {
                const createPublication = (publication) => `
                    <article class="article-card">
                        <h3 class="article-title">${escapeHtml(publication.title)}</h3>
                        <p class="article-doi"><strong>Venue:</strong> ${escapeHtml(publication.details)}</p>
                        <div class="article-actions">
                            <a href="${escapeHtml(publication.pdf_link)}" class="btn-action btn-pdf" target="_blank" rel="noopener">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                            </a>
                        </div>
                        ${renderArticleDetails(publication)}
                    </article>`;
                journalList.innerHTML = data.journal_papers.map(createPublication).join('');
                conferenceList.innerHTML = data.conference_papers.map(createPublication).join('');
            })
            .catch(() => {
                journalList.innerHTML = '<li class="loading-state">Erro ao carregar os dados das publicações.</li>';
                conferenceList.innerHTML = '<li class="loading-state">Erro ao carregar os dados das publicações.</li>';
            });
    }
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
