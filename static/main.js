document.addEventListener('DOMContentLoaded', () => {
    // Background Dinâmico
    document.querySelectorAll('[data-background-image]').forEach((element) => {
        element.style.backgroundImage = element.dataset.backgroundImage;
    });

    // Botão Voltar ao Topo
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Toggle de Textos Longos
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

    // Sombra do Navbar
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

    // Lógica do Accordion para o Menu Mobile (Impede o clique de sumir com itens no celular)
    document.querySelectorAll('.navbar .dropdown > a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 900) {
                e.preventDefault();
                link.parentElement.classList.toggle('active');
            }
        });
    });

    // Lógica do CSS Slider na Home
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

    // Novo Controlador Genérico de Sliders Data-Driven
    document.querySelectorAll('[data-slides]').forEach(sliderElement => {
        try {
            const images = JSON.parse(sliderElement.dataset.slides);
            if (!images || images.length === 0) return;
            
            let currentSlide = 0;
            const isImgTag = sliderElement.tagName.toLowerCase() === 'img';
            
            // Define imagem inicial
            if (isImgTag) sliderElement.src = images[0];
            else sliderElement.style.backgroundImage = `url('${images[0]}')`;

            const changeSlide = (direction) => {
                currentSlide = (currentSlide + direction + images.length) % images.length;
                if (isImgTag) sliderElement.src = images[currentSlide];
                else sliderElement.style.backgroundImage = `url('${images[currentSlide]}')`;
            };

            const parent = sliderElement.parentElement;
            parent.querySelector('.slider-prev')?.addEventListener('click', () => changeSlide(-1));
            parent.querySelector('.slider-next')?.addEventListener('click', () => changeSlide(1));
        } catch (e) {
            console.error("Erro ao montar o slider.", e);
        }
    });

    // Lógica do Modal com Acessibilidade (A11y e Focus Trap)
    const modal = document.getElementById('teamModal');
    let lastFocusedElement = null;

    if (modal) {
        const modalImg = document.getElementById('modalImg');
        const modalName = document.getElementById('modalName');
        const modalRole = document.getElementById('modalRole');
        const modalBio = document.getElementById('modalBio');
        const modalLattes = document.getElementById('modalLattes');
        
        const closeModal = () => {
            modal.classList.remove('active');
            if (lastFocusedElement) lastFocusedElement.focus();
        };

        document.querySelectorAll('.modal-trigger').forEach((card) => {
            card.setAttribute('tabindex', '0'); // Permite navegação por teclado
            card.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });

            card.addEventListener('click', () => {
                lastFocusedElement = document.activeElement;
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
                
                // Manda o foco imediatamente para dentro do modal
                document.getElementById('closeModal')?.focus();
            });
        });
        
        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // Focus trap & Esc Handler
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'Tab') {
                const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        });
    }

    // Countdown Universal (Respeitando Timezone)
    const countdownContainer = document.querySelector('.countdown-container');
    if (countdownContainer && countdownContainer.dataset.targetDate) {
        // Javascript converte de string ISO diretamente para o fuso local do navegador
        const targetDate = new Date(countdownContainer.dataset.targetDate).getTime();
        const countdownFields = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));
        
        if (countdownFields.every(Boolean)) {
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
    }
});

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}