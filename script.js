document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Efeito de Sombra na Navbar ao realizar Scroll
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
        } else {
            navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.05)";
        }
    });

    // 2. Comportamento do Formulário (Evitar reload na simulação)
    const formContato = document.getElementById('form-contato');
    
    if(formContato) {
        formContato.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o envio real
            alert('Mensagem enviada com sucesso! (Simulação)');
            formContato.reset(); // Limpa os campos
        });
    }

});