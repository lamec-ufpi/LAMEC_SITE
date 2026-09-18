# LAMEC & SIMCOMPI - Static Site Generator

> Plataforma web oficial do **Laboratório de Métodos de Modelagem Computacional (LAMEC)** da Universidade Federal do Piauí (UFPI) e portal principal do **Simpósio de Modelagem Computacional em Ciência e Tecnologia do Piauí (SIMCOMPI)**.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.2-black?logo=flask&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)
![Status](https://img.shields.io/badge/Status-Produção-success)

https://lamec-ufpi.com.br/
https://lamec-ufpi.github.io/LAMEC_SITE/

## 📌 Sobre o Projeto
Este repositório contém o código-fonte e o pipeline de infraestrutura do site do LAMEC. Arquitetura moderna de **Static Site Generator (SSG)** construída do zero utilizando Python. O objetivo principal foi eliminar dívidas técnicas, melhorar drasticamente a performance, aplicar acessibilidade e zerar os custos de hospedagem mantendo a resiliência a picos de tráfego.

## 🚀 Arquitetura

O site não utiliza bancos de dados em tempo de execução nem servidores dinâmicos. A inteligência reside no momento do *Build*:

* **Static Site Generation Customizado:** Utilização de *Flask Application Factory* combinado com `Flask-Frozen`. O pipeline processa dados de arquivos JSON, injeta em templates `Jinja2` (concebidos no padrão *DRY* com macros e componentes) e entrega um site 100% estático, determinístico e imutável na pasta `dist/`.
* **Pseudo-API Estática & Performance:** O *Freezer* compila uma rota em um arquivo estático `.json` que o JS consome via Fetch.
* **CI/CD Automatizada:** Deploy contínuo configurado via **GitHub Actions**. Qualquer push na branch principal aciona um workflow que instala dependências, roda a suíte de testes e, em caso de sucesso, constrói a pasta estática e a injeta no servidor.
* **Qualidade e Prevenção de Regressões:** O script `test_integrity.py` desenvolvido em *Pytest* roda estaticamente garantindo que nenhum PDF gere erro 404, detecta erros de encoding e impede duplicação humana de Lattes e perfis da equipe.

## 🛠️ Tecnologias Utilizadas

* **Backend / Build:** Python 3.11, Flask, Flask-Frozen, Pytest
* **Frontend:** Vanilla JavaScript, CSS3 (variáveis, flexbox, CSS Grid), HTML5 semântico
* **Infraestrutura:** GitHub Actions, GitHub Pages, Cloudflare (DNS e Proxy)

## 🤖 Desenvolvimento Auxiliado por IA
Para maximizar a eficiência e garantir as melhores práticas de arquitetura, este projeto contou com o apoio de grandes modelos de linguagem (**Claude, Gemini, ChatGPT e DeepSeek**) atuando como ferramentas de *pair-programming*. As IAs foram utilizadas estrategicamente para acelerar a refatoração do código legado, otimizar expressões regulares nos testes automatizados, desenhar fluxos de CI/CD e refinar a lógica de componentes do frontend, demonstrando a integração eficaz de IA no ciclo de vida de desenvolvimento de software.

## 💻 Desenvolvimento Local

Para clonar e rodar o pipeline de geração estática em sua máquina:

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU-USUARIO/LAMEC_SITE.git](https://github.com/SEU-USUARIO/LAMEC_SITE.git)
   cd LAMEC_SITE
   ```

   
2. **Crie um ambiente virtual e instale as dependências:**
    ```bash
    pip install -r requirements.txt
    
    ```


3. **Valide a integridade dos dados locais:**
    ```bash
    pytest app/tests/test_integrity.py -v
    
    ```


4. **Gere a build estática e inicie o servidor de testes:**
    ```bash
    python build.py
    python -m http.server -d dist 8000
    
    ```


*Abra `http://localhost:8000` no seu navegador para visualizar a versão de produção exatamente como será hospedada.*

## 📖 Manutenção e Atualização de Conteúdo

Consulte o arquivo **[maintenance_guide.md](https://www.google.com/search?q=maintenance_guide.md)** para o passo a passo seguro de edição de dados e publicação automática.

---

## ⚖️ Licença e Direitos Autorais

© LAMEC UFPI. Todos os direitos reservados.
O código, layout, fotografias e documentações técnicas deste repositório são de propriedade intelectual exclusiva dos desenvolvedores originais e do Laboratório de Métodos de Modelagem Computacional (LAMEC - UFPI). É vedada a cópia, distribuição, ou criação de trabalhos derivados deste template de frontend ou backend para fins comerciais ou pessoais de terceiros.
