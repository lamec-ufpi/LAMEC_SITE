document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-background-image]').forEach((element) => {
        element.style.backgroundImage = element.dataset.backgroundImage;
    });

    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

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
            navbar.style.boxShadow = window.scrollY > 50 ? "0 4px 15px rgba(0, 0, 0, 0.1)" : "0 2px 10px rgba(0, 0, 0, 0.05)";
        };
        updateNavbarShadow();
        window.addEventListener('scroll', updateNavbarShadow, { passive: true });
    }

    // Toggle para o Menu Mobile
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    // Lógica do JS Slider Home
    const homeSlides = document.querySelectorAll('.css-slider .slide');
    if (homeSlides.length > 0) {
        let currentHomeSlide = 0;
        const showHomeSlide = (index) => {
            homeSlides.forEach((slide, i) => {
                slide.style.opacity = i === index ? '1' : '0';
                slide.style.zIndex = i === index ? '10' : '0';
            });
        };
        document.querySelectorAll('.css-slider .slider-nav a').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const direction = btn.querySelector('.fa-angle-right') ? 1 : -1;
                currentHomeSlide = (currentHomeSlide + direction + homeSlides.length) % homeSlides.length;
                showHomeSlide(currentHomeSlide);
            });
        });
        showHomeSlide(0);
    }

    // Lógica do Slider Dinâmico (Sobre/Evento)
    const initSlider = (sliderId, images) => {
        const slider = document.getElementById(sliderId);
        if (!slider || images.length === 0) return;
        
        let currentSlide = 0;
        
        // Define a primeira imagem automaticamente
        if (slider.tagName.toLowerCase() === 'img') {
            slider.src = images[0];
        } else {
            slider.style.backgroundImage = `url('${images[0]}')`;
        }

        const changeSlide = (direction) => {
            currentSlide = (currentSlide + direction + images.length) % images.length;
            if (slider.tagName.toLowerCase() === 'img') {
                slider.src = images[currentSlide];
            } else {
                slider.style.backgroundImage = `url('${images[currentSlide]}')`;
            }
        };

        const prevBtn = slider.parentElement.querySelector('.slider-prev');
        const nextBtn = slider.parentElement.querySelector('.slider-next');
        prevBtn?.addEventListener('click', () => changeSlide(-1));
        nextBtn?.addEventListener('click', () => changeSlide(1));
    };
    
    // Slides
    initSlider('about-slider', [
        "/static/images/backgrounds/about/horizontal-banner-lamec-foto.jpeg",
        "/static/images/backgrounds/about/horizontal-banner-lamec-foto-2.jpeg",
    ]);

    initSlider('simcompi-1-slider', [
        "/static/images/simcompi/simcompi_1/slide/boi bumba.jpg",
        "/static/images/simcompi/simcompi_1/slide/janta com profs no i simcompi.jpg",
        "/static/images/simcompi/simcompi_1/slide/mesa de honra do i simcompi.jpg",
        "/static/images/simcompi/simcompi_1/slide/kurka palestra no i simcompi.jpg",
        "/static/images/simcompi/simcompi_1/slide/palestrantes e organizadores do i simcompi no encerramento.jpg",
        "/static/images/simcompi/simcompi_1/slide/poster-presentation no i simcompi.jpg"
    ]);

    initSlider('simcompi-2-slider', [
        "/static/images/simcompi/simcompi_2/slide/pessoas-assistindo-o-ii-simcompi.png",
        "/static/images/simcompi/simcompi_2/slide/feira1.png",
        "/static/images/simcompi/simcompi_2/slide/palestra-do-prof-fabro.png",
        "/static/images/simcompi/simcompi_2/slide/professores-e-organizacao-no-encerramento.png"
    ]);

    const modal = document.getElementById('teamModal');
    if (modal) {
        const modalImg = document.getElementById('modalImg');
        const modalName = document.getElementById('modalName');
        const modalRole = document.getElementById('modalRole');
        const modalBio = document.getElementById('modalBio');
        const modalLattes = document.getElementById('modalLattes');
        const closeModal = () => modal.classList.remove('active');

        document.querySelectorAll('.modal-trigger').forEach((card) => {
            card.addEventListener('click', () => {
                const data = card.dataset;
                modalImg.style.backgroundImage = `url('${data.img}')`;
                modalName.textContent = data.name;
                modalRole.textContent = data.role;
                if(data.bio) {
                    modalBio.innerHTML = data.bio;
                    modalBio.style.display = 'block';
                } else {
                    modalBio.style.display = 'none';
                }
                modalLattes.href = data.lattes;
                modal.classList.add('active');
            });
        });
        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    const countdownFields = ['days', 'hours', 'minutes', 'seconds'].map((id) => document.getElementById(id));
    if (countdownFields.every(Boolean)) {
        // Timestamp UTC: 22/03/2027 08:00h BRT = 11:00h UTC
        const targetDate = Date.UTC(2027, 2, 22, 11, 0, 0);
        const updateCountdown = () => {
            const distance = Math.max(0, targetDate - Date.now());
            const values = [
                Math.floor(distance / 86400000),
                Math.floor((distance % 86400000) / 3600000),
                Math.floor((distance % 3600000) / 60000),
                Math.floor((distance % 60000) / 1000)
            ];
            countdownFields.forEach((field, index) => field.textContent = String(values[index]).padStart(2, '0'));
        };
        updateCountdown();
        window.setInterval(updateCountdown, 1000);
    }
});

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getPdfUrl(pdfLink) {
    if (!pdfLink) return '#';
    let url = String(pdfLink).trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return escapeHtml(url);
    }
    // Já normalizado no loader Python (Fase 2)
    return '/static/' + escapeHtml(url);
}

function renderArticleDetails(article) {
    const abstract = article.abstract || 'Abstract não informado.';
    return `
        <div class="article-details-container">
            <div class="abstract-text collapsed">
                <strong>Abstract:</strong> ${escapeHtml(abstract)}
            </div>
            <button type="button" class="btn btn-text btn-read-more">Read More <i class="fa-solid fa-chevron-down"></i></button>
        </div>`;
}