### Arquivo: .\app\blueprints\main.py
`$Lang
from flask import Blueprint, render_template, jsonify
from ..data.loader import load_publications, load_proceedings_all
from flask import Response

bp = Blueprint('main', __name__)

@bp.route('/')
def index(): return render_template('pages/index.html')

@bp.route('/about/')
def about(): return render_template('pages/about.html')

@bp.route('/publications/')
def publications():
    data = load_publications()
    return render_template('pages/publications.html',
                           journal_papers=data.get('journal_papers', []),
                           conference_papers=data.get('conference_papers', []))

@bp.route('/extension/bull-racing/')
def bull_racing(): 
    return render_template('extension/bull_racing.html')

@bp.route('/extension/faisca/')
def faisca(): 
    return render_template('extension/faisca.html')

@bp.route('/api/proceedings.json')
def proceedings_api():
    return jsonify(load_proceedings_all())
   
@bp.route('/robots.txt')
def robots():
    content = "User-agent: *\nAllow: /\nSitemap: https://lamec-ufpi.com.br/sitemap.xml"
    return Response(content, mimetype="text/plain")

@bp.route('/sitemap.xml')
def sitemap():
    # As principais pÃ¡ginas que o Google deve indexar
    pages = [
        {'loc': '/', 'changefreq': 'weekly', 'priority': '1.0'},
        {'loc': '/about/', 'changefreq': 'monthly', 'priority': '0.8'},
        {'loc': '/publications/', 'changefreq': 'monthly', 'priority': '0.9'},
        {'loc': '/research-team/', 'changefreq': 'monthly', 'priority': '0.8'},
        {'loc': '/alumni/', 'changefreq': 'yearly', 'priority': '0.6'},
        {'loc': '/simcompi/', 'changefreq': 'weekly', 'priority': '0.9'},
        {'loc': '/simcompi/submissions/', 'changefreq': 'weekly', 'priority': '0.8'},
        {'loc': '/simcompi/proceedings/', 'changefreq': 'monthly', 'priority': '0.8'},
        {'loc': '/simcompi/proceedings/arquivo/', 'changefreq': 'weekly', 'priority': '0.9'},
    ]
    
    # Injetando dinamicamente os volumes no Sitemap
    from ..data.loader import load_proceedings_all
    all_vols = load_proceedings_all().get("volumes", [])
    for vol in all_vols:
        pages.append({
            'loc': f"/simcompi/proceedings/volume/{vol['id']}/",
            'changefreq': 'yearly',
            'priority': '0.7'
        })

    xml_template = render_template('components/sitemap.xml', pages=pages)
    return Response(xml_template, mimetype="text/xml") 

# Rota especial de erro que o GitHub Pages reconhece nativamente
@bp.route('/404.html')
def not_found():
    return render_template('pages/404.html')
``n

### Arquivo: .\app\blueprints\people.py
`$Lang
from flask import Blueprint, render_template
from ..data.loader import load_team, load_alumni, load_professional, load_memoriam

bp = Blueprint('people', __name__)

@bp.route('/research-team/')
def research_team():
    return render_template('pages/research_team.html', team=load_team())

@bp.route('/alumni/')
def alumni():
    return render_template('pages/alumni.html', 
                           alumni=load_alumni(),
                           professional=load_professional(),
                           memoriam=load_memoriam())
``n

### Arquivo: .\app\blueprints\proceedings.py
`$Lang
from flask import Blueprint, render_template, abort
from ..data.loader import load_committees, load_event_info, load_proceedings_all, load_proceedings_volume
from ..config import EVENT

bp = Blueprint('proceedings', __name__)

# Evento
@bp.route('/simcompi/')
def simcompi(): return render_template('simcompi/simcompi.html')

@bp.route('/simcompi/submissions/')
def submissions(): return render_template('simcompi/submissions.html', event_info=load_event_info())

@bp.route('/simcompi/committees/')
def committees_page(): return render_template('simcompi/committees.html', committees=load_committees())

@bp.route('/simcompi/contact-us/')
def contact_us(): return render_template('simcompi/contact-us.html')

@bp.route('/simcompi/edicoes-anteriores/i-simcompi/')
def i_simcompi(): return render_template('simcompi/i_simcompi.html')

@bp.route('/simcompi/edicoes-anteriores/ii-simcompi/')
def ii_simcompi(): return render_template('simcompi/ii_simcompi.html')

# Anais
@bp.route('/simcompi/proceedings/')
def proceedings_index(): return render_template('proceedings/proceedings.html')

@bp.route('/simcompi/proceedings/apresentacao/')
def apresentacao(): return render_template('proceedings/apresentacao.html')

@bp.route('/simcompi/proceedings/expediente/')
def expediente(): return render_template('proceedings/expediente.html', committees=load_committees())

@bp.route('/simcompi/proceedings/normas/')
def normas(): return render_template('proceedings/normas.html')

@bp.route('/simcompi/proceedings/contato/')
def contato_anais(): return render_template('proceedings/contato_anais.html')

@bp.route('/simcompi/proceedings/arquivo/')
def arquivo(): return render_template('proceedings/arquivo.html', proceedings_data=load_proceedings_all())

@bp.route('/simcompi/proceedings/volume/<volume_id>/')
def volume(volume_id):
    vol = load_proceedings_volume(volume_id)
    if not vol:
        if volume_id == EVENT["current_volume"]:
            vol = {'id': EVENT["current_volume"], 'title': 'Volume Atual', 'year': EVENT["start_utc"][:4], 'categories': []}
        else:
            abort(404)
    return render_template('proceedings/volume.html', volume=vol)
``n

### Arquivo: .\app\data\loader.py
`$Lang
import json
from pathlib import Path
from .schemas import validate_article

# Aponta para a pasta /data na raiz do projeto
DATA_DIR = Path(__file__).parent.parent.parent / "data"

def _load_json(filename: str) -> dict:
    path = DATA_DIR / filename
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

def load_team() -> list: return _load_json("team.json").get("research_team", [])
def load_alumni() -> list: return _load_json("team.json").get("alumni", [])
def load_professional() -> list: return _load_json("team.json").get("professional_career", [])
def load_memoriam() -> list: return _load_json("team.json").get("in_memoriam", [])
def load_committees() -> dict: return _load_json("event_info.json").get("committees", {})
def load_publications() -> dict: return _load_json("publications.json")
def load_event_info() -> dict: return _load_json("event_info.json")

def load_proceedings_all() -> dict:
    volumes = []
    proc_dir = DATA_DIR / "proceedings"
    
    if proc_dir.exists():
        for f in proc_dir.glob("*.json"):
            raw = json.loads(f.read_text(encoding="utf-8"))
            
            # NormalizaÃ§Ã£o (ocorre 1x)
            if raw.get("full_pdf_link"):
                pdf_val = raw['full_pdf_link'].replace('proceedings/', '')
                raw["full_pdf_link"] = f"proceedings/{pdf_val}"
                
            if raw.get("cover_img"):
                img_val = raw['cover_img'].replace('images/', '')
                raw["cover_img"] = f"images/{img_val}"
                
            for cat in raw.get("categories", []):
                for article in cat.get("articles", []):
                    validate_article(article, raw.get('id', 'desconhecido'))
                    
                    pdf = article.get("pdf") or article.get("pdf_link", "")
                    if pdf:
                        clean_pdf = pdf.replace('../../../proceedings/', '').replace('proceedings/', '')
                        article["pdf_path"] = f"proceedings/{clean_pdf}"
                    else:
                        article["pdf_path"] = "#"
                    
                    # Trata DOI
                    doi_raw = article.get("doi") or ""
                    article["doi"] = str(doi_raw).strip() if str(doi_raw).strip() else None

            volumes.append(raw)
            
    volumes.sort(key=lambda x: x.get("year", 0), reverse=True)
    return {"volumes": volumes}

def load_proceedings_volume(volume_id: str) -> dict:
    all_vols = load_proceedings_all()
    return next((v for v in all_vols.get("volumes", []) if v["id"] == volume_id), None)
``n

### Arquivo: .\app\data\schemas.py
`$Lang
def validate_article(article, vol_id):
    assert "title" in article, f"Artigo sem tÃ­tulo no volume {vol_id}"
    assert "authors" in article, f"Artigo sem autores no volume {vol_id}"
``n

### Arquivo: .\app\templates\components\base.html
`$Lang
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}LAMEC{% endblock %}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    <link rel="icon" href="{{ url_for('static', filename='images/brand/camaleao-solo.png') }}">
    <script>
        // ConfiguraÃ§Ã£o injetada de forma segura (Enganando o Freezer com o truque do replace)
        window.LAMEC_CONFIG = {
            staticRoot: "{{ url_for('static', filename='style.css') }}".replace('style.css', ''),
            baseUrl: "{{ url_for('main.index') }}".replace('index.html', ''),
            proceedingsApiUrl: "{{ url_for('main.proceedings_api') }}"
        };
    </script>
</head>
<body>
    {% include "components/navbar.html" %}

    {% block content %}{% endblock %}

    {% include "components/footer.html" %}

    <a href="#" id="backToTop" class="back-to-top-float" aria-label="Voltar ao topo">
        <i class="fa-solid fa-chevron-up"></i>
    </a>

    <script src="{{ url_for('static', filename='main.js') }}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
``n

### Arquivo: .\app\templates\components\footer.html
`$Lang
<footer>
    <div class="container footer-content">
        <p>Â© LaboratÃ³rio de MÃ©todos de Modelagem Computacional - LAMEC, {{ current_year }}.</p>
    </div>
</footer>
``n

### Arquivo: .\app\templates\components\layout.html
`$Lang
{% extends "components/base.html" %}

{% block content %}
    <main class="container proceedings-layout">
        <aside class="sidebar">
            <div class="sidebar-widget">
                <div class="sidebar-title">Buscar nos Anais</div>
                <div class="sidebar-content">
                    <form action="{{ url_for('proceedings.arquivo') }}" method="GET" id="searchForm">
                        <input type="text" id="searchInput" name="q" class="search-input" placeholder="Buscar artigos..." required>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Buscar</button>
                    </form>
                </div>
            </div>

            <div class="sidebar-widget">
                <div class="sidebar-title">NavegaÃ§Ã£o</div>
                <div class="sidebar-content">
                    <ul class="sidebar-menu">
                        <li><a href="{{ url_for('proceedings.apresentacao') }}" class="{% if current_endpoint == 'proceedings.apresentacao' %}active{% endif %}">ApresentaÃ§Ã£o</a></li>
                        <li><a href="{{ url_for('proceedings.expediente') }}" class="{% if current_endpoint == 'proceedings.expediente' %}active{% endif %}">Corpo Editorial</a></li>
                        <li><a href="{{ url_for('proceedings.normas') }}" class="{% if current_endpoint == 'proceedings.normas' %}active{% endif %}">Normas para PublicaÃ§Ã£o</a></li>
                        <li><a href="{{ url_for('proceedings.contato_anais') }}" class="{% if current_endpoint == 'proceedings.contato_anais' %}active{% endif %}">Contato</a></li>
                        <li><a href="{{ url_for('proceedings.volume', volume_id=event.current_volume) }}">Volume atual: {{ event.current_volume_label }}</a></li>
                        <li><a href="{{ url_for('proceedings.arquivo') }}" class="{% if current_endpoint == 'proceedings.arquivo' %}active{% endif %}">Arquivo Completo</a></li>
                    </ul>
                </div>
            </div>

            <div class="sidebar-widget">
                <div class="sidebar-title">Explorar Arquivo</div>
                <div class="sidebar-content">
                    <ul class="sidebar-menu">
                        <li><a href="{{ url_for('proceedings.arquivo') }}#author" data-action="author">Por Autor</a></li>
                        <li><a href="{{ url_for('proceedings.arquivo') }}#title" data-action="title">Por TÃ­tulo</a></li>
                        <li><a href="{{ url_for('proceedings.arquivo') }}#category" data-action="category">Por Categoria</a></li>
                    </ul>
                </div>
            </div>
        </aside>

        <section class="main-content" id="data-container">
            {% block proceedings_content %}{% endblock %}
        </section>
    </main>
{% endblock %}
``n

### Arquivo: .\app\templates\components\macros.html
`$Lang
{% macro render_committee_table(committee_list) %}
<div class="table-responsive">
    <table class="styled-table">
        <thead><tr><th>Nome</th><th>InstituiÃ§Ã£o</th></tr></thead>
        <tbody>
            {% for member in committee_list %}
            <tr><td><strong>{{ member.name }}</strong></td><td>{{ member.institution }}</td></tr>
            {% endfor %}
        </tbody>
    </table>
</div>
{% endmacro %}

{% macro render_article_card(article, is_js_template=False) %}
    {% set is_pubs = 'publications' in request.path %}
    {% set abstract_label = 'Abstract:' if is_pubs else 'Resumo:' %}
<div class="article-card">
    <h3 class="article-title js-title">{{ '__TITLE__' if is_js_template else article.title }}</h3>
    <p class="article-authors js-authors"><i>{{ '__AUTHORS__' if is_js_template else article.authors }}</i></p>
    
    {% if is_js_template or article.volumeTitle %}
    <p class="article-doi js-volume" {% if is_js_template %}style="display:none;"{% endif %}>
        <strong>Volume:</strong> <span class="js-vol-text">{{ '__VOLUME__' if is_js_template else article.volumeTitle ~ ' (' ~ article.volumeYear ~ ')' }}</span>
    </p>
    {% endif %}

    {% if is_js_template or article.doi %}
    <p class="article-doi js-link-wrapper" {% if is_js_template %}style="display:none;"{% endif %}>
        <i class="fa-solid fa-link"></i> <strong>Link:</strong> <a href="{{ '__LINK__' if is_js_template else article.doi }}" target="_blank" rel="noopener" class="js-link">{{ '__LINK__' if is_js_template else article.doi }}</a>
    </p>
    {% endif %}
    
    <div class="article-actions">
        {% if is_js_template %}
            <a href="#" class="btn btn-primary js-pdf" target="_blank" rel="noopener" style="display:none;">
                <i class="fa-solid fa-file-pdf"></i> PDF
            </a>
            <span class="btn btn-outline js-no-pdf" style="cursor: not-allowed; opacity: 0.5; display:none;">
                <i class="fa-solid fa-file-pdf"></i> PDF IndisponÃ­vel
            </span>
        {% else %}
            {% set final_pdf = article.pdf_path or article.pdf_link %}
            {% if final_pdf %}
            <a href="{{ url_for('static', filename=final_pdf) }}" class="btn btn-primary" target="_blank" rel="noopener">
                <i class="fa-solid fa-file-pdf"></i> PDF
            </a>
            {% else %}
            <span class="btn btn-outline" style="cursor: not-allowed; opacity: 0.5;">
                <i class="fa-solid fa-file-pdf"></i> PDF IndisponÃ­vel
            </span>
            {% endif %}
        {% endif %}
    </div>
    
    <div class="article-details-container">
        <div class="abstract-text collapsed js-abstract">
            <strong>{{ abstract_label }}</strong> {{ '__ABSTRACT__' if is_js_template else (article.abstract | default('NÃ£o informado', true)) }}
        </div>
        <button type="button" class="btn btn-text btn-read-more">Read More <i class="fa-solid fa-chevron-down"></i></button>
    </div>
</div>
{% endmacro %}
``n

### Arquivo: .\app\templates\components\navbar.html
`$Lang
{% set is_proceedings = request.path.startswith('/simcompi/proceedings/') %}
{% set is_simcompi = request.path.startswith('/simcompi/') and not is_proceedings %}

{% if is_proceedings %}
<nav class="navbar navbar-simcompi navbar-proceedings" id="navbar">
  <div class="container nav-container">
    <div class="logo">
      <!-- Procure a linha 7 e substitua por esta (repare que removi o <br> e adicionei a sigla): -->
<a href="{{ url_for('proceedings.proceedings_index') }}" class="logo-text" style="font-size:large;">Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI)</br> <p style="font-size:medium; color:rgb(180, 180, 180); font-weight: normal;">ISSN: 3086-7940</p></a>
    </div>
    <button class="mobile-menu-toggle"><i class="fa-solid fa-bars"></i></button>
    <ul class="nav-links">          
        <li><a href="{{ url_for('proceedings.simcompi') }}" class="back-btn"><i class="fa-solid fa-arrow-left"></i> VOLTAR PARA O SIMCOMPI</a></li>
        <li><a href="{{ url_for('main.index') }}" class="back-btn"><i class="fa-solid fa-house"></i> LAMEC</a></li>
    </ul>
  </div>
</nav>

{% elif is_simcompi %}
<nav class="navbar navbar-simcompi" id="navbar">
  <div class="container nav-container">
    <div class="logo">
        <a href="{{ url_for('proceedings.simcompi') }}" class="logo-text">
            <img src="{{ url_for('static', filename='images/brand/logo-simcompi-navbar-white.png') }}" alt="SIMCOMPI" class="navbar-brand-img">
        </a>
    </div>
    <button class="mobile-menu-toggle"><i class="fa-solid fa-bars"></i></button>
    <ul class="nav-links">
      <li><a href="{{ url_for('proceedings.submissions') }}" class="{% if current_endpoint == 'proceedings.submissions' %}active{% endif %}">SUBMISSÃ•ES</a></li>
      <li><a href="{{ url_for('proceedings.proceedings_index') }}" class="{% if current_endpoint in ['proceedings.proceedings_index', 'proceedings.apresentacao', 'proceedings.expediente', 'proceedings.normas', 'proceedings.contato_anais', 'proceedings.arquivo', 'proceedings.volume'] %}active{% endif %}">ANAIS DO EVENTO</a></li>
      <li class="dropdown"><a href="#" class="{% if current_endpoint in ['proceedings.i_simcompi', 'proceedings.ii_simcompi'] %}active{% endif %}">EDIÃ‡Ã•ES ANTERIORES <i class="fa-solid fa-chevron-down"></i></a>
        <ul class="dropdown-menu">
            <li><a href="{{ url_for('proceedings.i_simcompi') }}" class="{% if current_endpoint == 'proceedings.i_simcompi' %}active{% endif %}">I SIMCOMPI</a></li>
            <li><a href="{{ url_for('proceedings.ii_simcompi') }}" class="{% if current_endpoint == 'proceedings.ii_simcompi' %}active{% endif %}">II SIMCOMPI</a></li>
        </ul>
      </li>
      <li><a href="{{ url_for('proceedings.committees_page') }}" class="{% if current_endpoint == 'proceedings.committees_page' %}active{% endif %}">COMISSÃ•ES</a></li>
      <li><a href="{{ url_for('proceedings.contact_us') }}" class="{% if current_endpoint == 'proceedings.contact_us' %}active{% endif %}">CONTATO</a></li>
      <li><a href="{{ url_for('main.index') }}" class="back-btn"><i class="fa-solid fa-house"></i> LAMEC</a></li>
    </ul>
  </div>
</nav>

{% else %}
<nav class="navbar" id="navbar">
    <div class="container nav-container">
        <div class="logo">
            <a href="{{ url_for('main.index') }}" class="logo-text">
                <img src="{{ url_for('static', filename='images/brand/lamec-logo.png') }}" alt="LAMEC" class="navbar-brand-img">
            </a>
        </div>
        <button class="mobile-menu-toggle"><i class="fa-solid fa-bars"></i></button>
        <ul class="nav-links">
            <li><a href="{{ url_for('main.index') }}" class="{% if current_endpoint == 'main.index' %}active{% endif %}">HOME</a></li>
            <li><a href="{{ url_for('main.publications') }}" class="{% if current_endpoint == 'main.publications' %}active{% endif %}">PUBLICATIONS</a></li>
            <li class="dropdown"><a href="{{ url_for('people.research_team') }}" class="{% if current_endpoint in ['people.research_team', 'people.alumni'] %}active{% endif %}">PEOPLE <i class="fa-solid fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ url_for('people.research_team') }}" class="{% if current_endpoint == 'people.research_team' %}active{% endif %}">RESEARCH TEAM</a></li>
                    <li><a href="{{ url_for('people.alumni') }}" class="{% if current_endpoint == 'people.alumni' %}active{% endif %}">ALUMNI</a></li>
                </ul>
            </li>
            <li><a href="{{ url_for('proceedings.simcompi') }}">SIMCOMPI</a></li>
            <li class="dropdown"><a href="#" class="{% if current_endpoint in ['main.bull_racing', 'main.faisca'] %}active{% endif %}">EXTENSION <i class="fa-solid fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ url_for('main.bull_racing') }}" class="{% if current_endpoint == 'main.bull_racing' %}active{% endif %}">BULL RACING</a></li>
                    <li><a href="{{ url_for('main.faisca') }}" class="{% if current_endpoint == 'main.faisca' %}active{% endif %}">FAÃSCA</a></li>
                </ul>
            </li>
            <li><a href="{{ url_for('main.about') }}" class="{% if current_endpoint == 'main.about' %}active{% endif %}">ABOUT</a></li>
        </ul>
    </div>
</nav>
{% endif %}
``n

### Arquivo: .\app\templates\components\_event_hero.html
`$Lang
<header class="simcompi-hero current-event-hero" style="background-image: linear-gradient(rgba(249, 252, 255, 0.6), rgba(179, 227, 255, 0.6)), url('{{ url_for('static', filename='images/backgrounds/rio-poty-fundo-banner-iii-simcompi.jpg') }}');">
    <img src="{{ url_for('static', filename='images/simcompi/simcompi_3/logo-horizonta-iii-simcompi.png') }}" alt="SIMCOMPI Logo" class="logo-image" style="max-width: 900px;">
    <!-- Injetando a data do Backend via Data-Attribute -->
    <div class="countdown-container" data-target-date="{{ event.start_utc }}">
        <div class="countdown-box"><span id="days">00</span><small>Dias</small></div>
        <div class="countdown-box"><span id="hours">00</span><small>Horas</small></div>
        <div class="countdown-box"><span id="minutes">00</span><small>Minutos</small></div>
        <div class="countdown-box"><span id="seconds">00</span><small>Segundos</small></div>
        <div class="countdown-info">{{ event.dates_label }}<br>AuditÃ³rio do Centro de Tecnologia, UFPI</div>
    </div>
</header>
``n

### Arquivo: .\app\templates\extension\bull_racing.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Bull Racing{% endblock %}

{% block content %}
    <header class="simcompi-hero" style="background-image: linear-gradient(rgba(12, 13, 13, 0.7), rgba(40, 1, 21, 0.7)), url('{{ url_for('static', filename='images/backgrounds/bull-banner-horizontal.jpg') }}');">
        <img src="{{ url_for('static', filename='images/brand/bullracing-logo.png') }}" alt="BULL RACING Logo" class="logo-image" style="max-width: 300px;">
    </header>

    <section class="simcompi-intro">
        <p>Bull Racing is the first Formula SAE team in PiauÃ­, formed by students from the Universidade Federal do PiauÃ­ (UFPI). The project brings together students from Mechanical Engineering, Electrical Engineering, Materials Engineering, Production Engineering and even Journalism, who work together to develop a high-performance racing car.</p>
        <br>
        <p>The team participates annually in the Formula SAE Brazil competition, where they seek to improve their knowledge in automotive engineering, project management and technological innovation. With dedication and a spirit of collaboration, Bull Racing represents PiauÃ­ on the national stage, proving that talent and perseverance can take innovation even further.</p>
        <div class="subscribe-btn-container">
            <a href="https://instagram.com/bullracing_fsae/" class="btn btn-primary" target="_blank" rel="noopener">Visit the Instagram</a>
        </div>
    </section>

    <section class="logos-wrapper">
        <h2><span>Sponsors and Supporters</span></h2>
        <h3>Diamond</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/extension/bull/bosch-logo.png') }}" alt="Bosch">
        </div>
        <h3>Gold</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/extension/bull/dremell-logo.png') }}" alt="Dremel">
            <img src="{{ url_for('static', filename='images/extension/bull/oig-logo.jpg') }}" alt="One Internet Group">
            <img src="{{ url_for('static', filename='images/extension/bull/sia-logo.svg') }}" alt="Sia Abrasives">
        </div>
        <h3>Silver</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/extension/bull/vmachado-logo.png') }}" alt="V Machado">
        </div>
        <h3>Bronze</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/extension/bull/autosuprir-logo.jpg') }}" alt="Autosuprir Auto PeÃ§as">
        </div>
    </section>
{% endblock %}
``n

### Arquivo: .\app\templates\extension\faisca.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Projeto FaÃ­sca{% endblock %}

{% block content %}
    <header class="simcompi-hero" style="background-image: linear-gradient(rgba(0, 2, 3, 0.7), rgba(0, 0, 0, 0.7)), url('{{ url_for('static', filename='images/backgrounds/home/fire-background.jpg') }}');">
        <img src="{{ url_for('static', filename='images/brand/faisca-logo.png') }}" alt="FAÃSCA Logo" class="logo-image" style="max-width: 300px;">
    </header>

    <section class="simcompi-intro">
        <p>FaÃ­sca is a project that aims to strengthen the female presence in mechanical engineering, promoting a more inclusive, welcoming and motivating environment. The initiative seeks to encourage female students to participate, offering support, inspiration, and representation to overcome challenges and drive change in the field.</p>
        
        <div class="subscribe-btn-container">
            <a href="https://instagram.com/faisca.ufpi/" class="btn btn-primary" target="_blank" rel="noopener">Visit the Instagram</a>
        </div>
    </section>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\404.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - PÃ¡gina nÃ£o encontrada{% endblock %}

{% block content %}
<main class="container" style="text-align: center; padding: 100px 20px; min-height: 60vh;">
    <h1 style="font-size: 5rem; color: var(--color-primary); margin-bottom: 10px;">404</h1>
    <h2 style="color: var(--color-secondary); margin-bottom: 30px;">PÃ¡gina nÃ£o encontrada</h2>
    <p style="margin-bottom: 40px; font-size: 1.1rem;">A pÃ¡gina que vocÃª tentou acessar nÃ£o existe ou foi movida.</p>
    <a href="{{ url_for('main.index') }}" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> Voltar para a Home</a>
</main>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\about.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - About{% endblock %}

{% block content %}
    {% set slides = [
        url_for('static', filename='images/backgrounds/about/horizontal-banner-lamec-foto.jpeg'),
        url_for('static', filename='images/backgrounds/about/horizontal-banner-lamec-foto-2.jpeg')
    ] %}
    <header class="about-hero" id="about-slider" data-slides='{{ slides | tojson | safe }}' style="transition: background-image 0.5s ease-in-out;">
        <button class="slider-btn slider-prev" aria-label="Previous slide"><i class="fa-solid fa-angle-left"></i></button>
        <button class="slider-btn slider-next" aria-label="Next slide"><i class="fa-solid fa-angle-right"></i></button>

        <div class="hero-text-box">
            <h1>About LAMEC</h1>
            <p>Computer Modeling Methods Laboratory (LAMEC) is a research laboratory at UFPI.</p>
            <p>The team develops projects and activities on real engineering problems using tools such as computational modeling, structural analysis, numerical simulations, and the development of innovative solutions.</p>
            <p>LAMEC's mission goes far beyond technical training. The lab is also a space for personal growth, autonomy building, and the development of a scientific and critical mindset.</p>
        </div>
    </header>

    <main class="container about-content">
        <div style="text-align: center; margin-bottom: 60px;">
            <img src="{{ url_for('static', filename='images/brand/lamec-logo.png') }}" alt="LAMEC Logo" style="width: 100%; max-width: 400px">
            <h2 style="color: var(--color-primary); font-size: 2rem; margin-bottom: 10px;">LaboratÃ³rio de MÃ©todos de Modelagem Computacional (LAMEC)</h2>
            <p style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 15px;"><b>Federal University of PiauÃ­ (UFPI) &bull; Teresina, Brazil</b></p>
            <p class="about-text" style="text-align: center; max-width: 850px; margin: 0 auto 25px auto;">Advancing research by analyzing and solving complex engineering problems, with an emphasis on computational modeling and simulation applied to the railway and offshore industries.</p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="https://www.researchgate.net/lab/LaMeC-lamec-ufpicom-Simone-dos-Santos" target="_blank" rel="noopener">
                    <img src="https://img.shields.io/badge/ResearchGate-LaMeC%20Lab-00ccb1?style=for-the-badge&logo=researchgate&logoColor=white" alt="ResearchGate" style="border-radius: 4px;">
                </a>
                <a href="https://instagram.com/lamec.ufpi" target="_blank" rel="noopener">
                    <img src="https://img.shields.io/badge/@lamec.ufpi-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" style="border-radius: 4px;">
                </a>
            </div>
        </div>
        <div class="section-title-highlight first">KNOWLEDGE<br>BUILDING</div>
        <p class="about-text"><em>LAMEC</em> is dedicated to the construction and dissemination of knowledge through applied research. The laboratory promotes an environment of continuous learning, encouraging the exchange of ideas between students and researchers, participation in scientific conferences and the publication of scientific articles. In addition, <em>LAMEC</em> values interdisciplinary collaboration, connecting computational modeling to various areas of engineering and applied sciences. The development of academic and industrial projects reinforces the laboratory's commitment to innovation and technological advancement, preparing members for complex challenges in research and the job market.</p>
        <div class="section-title-highlight">RESEARCH<br>TOPICS</div>
        <ul class="about-list">
            <li><strong>Multiphysics modeling</strong> â€“ Analysis involving fluid and structural behavior simultaneously.</li>
            <li><strong>Topological optimization</strong> â€“ Development of algorithms to optimize material geometries and properties.</li>
            <li><strong>Slope stability</strong> â€“ Computational analysis and assessment of soil and rock mass behavior to prevent failures.</li>
            <li><strong>Vibrations and metamaterials</strong> â€“ Study and design of periodic structures for vibration attenuation and wave control.</li>
            <li><strong>Numerical modeling of elastomers</strong> â€“ Computational simulation of the mechanical behavior of hyperelastic and rubber-like materials.</li>
        </ul>
        <p class="about-text"><em>LAMEC</em> stands out for its use of cutting-edge computational methods to solve challenging engineering problems, contributing to the advancement of knowledge and the development of new technologies.</p>
        <div class="section-title-highlight">ADMISSION</div>
        <p class="about-text">At <em>LAMEC</em>, we believe that passion and perseverance are the key factors for success in research. Unlike traditional selection processes, we do not consider academic performance indexes (IRA) or grades as admission criteria. Instead, we look for students who are truly motivated, curious, and willing to dedicate themselves to the challenges of computational modeling. We value individuals who are eager to learn, experiment, and push the boundaries of knowledge. Research requires resilience, critical thinking, and the ability to persist through complex problems.</p>
        <div class="section-title-highlight">COLLABORATION</div>
        <p class="about-text"><em>LAMEC</em> maintains a network of strategic collaborations with leading researchers and laboratories, strengthening its presence in the academic and industrial scenarios. The laboratory has partnerships with professors and research leaders from <em>USP, UNICAMP, UnB, and UFSM, among others</em>.</p>
        <p class="about-text"><em>LAMEC</em> is open to collaborations with professors, researchers, companies, and sponsors interested in advancing computational modeling in engineering. We believe that strong partnerships drive innovation, and we welcome opportunities for joint research projects, knowledge exchange, and industry applications.</p>
        <div class="contact-action">
            <a href="{{ url_for('main.index') }}#contact" class="btn btn-primary">CONTACT</a>
        </div>
    </main>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\alumni.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Alumni{% endblock %}

{% block content %}
    <header class="page-header">
        <h1>Alumni & Career</h1>
    </header>

    <main class="container" style="margin-top: 60px;">
        
        <h2 class="section-title"><span>ALUMNI</span></h2>
        <section class="team-grid">
            {% for member in alumni %}
            <div class="member-card modal-trigger" 
                 data-name="{{ member.name }}" 
                 data-role="{{ member.role }}"
                 data-img="{{ url_for('static', filename=member.img) }}"
                 data-lattes="{{ member.lattes }}"
                 data-bio="{{ member.bio }}">
                <div class="member-photo" style="background-image: url('{{ url_for('static', filename=member.img) }}');"></div>
                <div class="member-name-banner">{{ member.name }}</div>
            </div>
            {% endfor %}
        </section>

        <h2 class="section-title"><span>PROFESSIONAL CAREER</span></h2>
        <section class="team-grid">
            {% for member in professional %}
            <div class="member-card modal-trigger" 
                 data-name="{{ member.name }}" 
                 data-role="{{ member.role }}"
                 data-img="{{ url_for('static', filename=member.img) }}"
                 data-lattes="{{ member.lattes }}"
                 data-bio="{{ member.bio }}">
                <div class="member-photo" style="background-image: url('{{ url_for('static', filename=member.img) }}');"></div>
                <div class="member-name-banner">{{ member.name }}</div>
            </div>
            {% endfor %}
        </section>

        <h2 class="section-title"><span>IN MEMORIAM</span></h2>
        <section class="team-grid">
            {% for member in memoriam %}
            <div class="member-card modal-trigger" 
                 data-name="{{ member.name }}" 
                 data-role="{{ member.role }}"
                 data-img="{{ url_for('static', filename=member.img) }}"
                 data-lattes="{{ member.lattes }}"
                 data-bio="{{ member.bio }}">
                <div class="member-photo" style="background-image: url('{{ url_for('static', filename=member.img) }}');"></div>
                <div class="member-name-banner">{{ member.name }}</div>
            </div>
            {% endfor %}
        </section>

    </main>

    <!-- Modal Pessoas -->
    <div class="modal-overlay" id="teamModal">
        <div class="modal-content">
            <button class="close-btn" id="closeModal">&times;</button>
            <div class="modal-body">
                <div class="modal-img-container" id="modalImg"></div>
                <div class="modal-text">
                    <h3 id="modalName">Nome</h3>
                    <div class="modal-role" id="modalRole">FunÃ§Ã£o</div>
                    <div class="modal-bio" id="modalBio">Resumo</div>
                    <a target="_blank" class="btn btn-primary" id="modalLattes">
                        <i class="fa-solid fa-link"></i> Acessar Perfil / Lattes
                    </a>
                </div>
            </div>
        </div>
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\index.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - LaboratÃ³rio de MÃ©todos de Modelagem Computacional{% endblock %}

{% block content %}
    <div class="css-slider">
        <header class="slide" style="background-image: url('{{ url_for('static', filename='images/backgrounds/home/home-horizontal-banner-1.jpg') }}');">
            <div class="hero-content">
                <h1>LAMEC</h1>
                <p>LABORATÃ“RIO DE MÃ‰TODOS<br>DE MODELAGEM<br>COMPUTACIONAL</p>
            </div>
            <div class="slider-nav">
                <a><i class="fa-solid fa-angle-left"></i></a>
                <a><i class="fa-solid fa-angle-right"></i></a>
            </div>
        </header>

        <header class="slide" style="background-image: url('{{ url_for('static', filename='images/backgrounds/home/povo_bull.jpg') }}');">
            <div class="hero-content">
                <h1>BULL RACING FSAE</h1>
            </div>
            <div class="slider-nav">
                <a><i class="fa-solid fa-angle-left"></i></a>
                <a><i class="fa-solid fa-angle-right"></i></a>
            </div>
        </header>

        <header class="slide" style="background-image: url('{{ url_for('static', filename='images/backgrounds/home/fire-background.jpg') }}');">
            <div class="hero-content">
                <h1>PROJETO FAÃSCA</h1>
            </div>
            <div class="slider-nav">
                <a><i class="fa-solid fa-angle-left"></i></a>
                <a><i class="fa-solid fa-angle-right"></i></a>
            </div>
        </header>
    </div>

    <section class="intro-section container">
        <div class="intro-box">
            <p>The Laboratory of Computational Modeling Methods (LAMEC), affiliated with the Technology Center (CT) at the Federal University of PiauÃ­ (UFPI), is an institutional space dedicated to teaching, research, and academic development. It focuses on advanced studies and the qualification of students through scientific initiation programs. The laboratory specializes in analyzing and solving complex engineering problems, with an emphasis on computational modeling and simulation applied to the railway and offshore industries, contributing to scientific knowledge and technological advancement in these fields.</p>
            <br>
            <p>Our mission is to foster the development of undergraduate students by providing a solid scientific and technical foundation, stimulating critical thinking, intellectual autonomy, and engagement with high-level research.</p>
        </div>
    </section>
    
    <br>
   
    <section class="features-section container" id="about">
        <div class="feature-row">
            <div class="feature-image logo-large">
                <img src="{{ url_for('static', filename='images/brand/lamec-logo.png') }}" alt="LAMEC Logo" style="max-width: 80%;">
            </div>
            <div class="feature-text dark-card">
                <h3>About LAMEC</h3>
                <p>The LAMEC - Laboratory of Computational Modeling Methods is a space dedicated to the academic and scientific training of undergraduate students, linked to the Technology Center at the Federal University of PiauÃ­ (UFPI)...</p>
            </div>
        </div>
        <div class="feature-row reverse">
            <div class="feature-image placeholder-img" data-background-image="url('{{ url_for('static', filename='images/backgrounds/home1.jpg') }}')"></div>
            <div class="feature-text dark-card">
                <h3>Research Topics</h3>
                <p>LAMEC develops projects in areas such as dynamic analysis of offshore structures, soil-structure interaction, and fluid-structure interaction. Furthermore, the lab strongly encourages scientific production...</p>
            </div>
        </div>
        <div class="feature-row">
            <div class="feature-image placeholder-img" data-background-image="url('{{ url_for('static', filename='images/backgrounds/home2.jpg') }}')"></div>
            <div class="feature-text dark-card">
                <h3>Knowledge Building</h3>
                <p>At LAMEC, students are challenged to solve real engineering problems using tools such as computational modeling, structural analysis, numerical simulations, and the development of innovative solutions...</p>
            </div>
        </div>
        <div class="feature-row reverse">
            <div class="feature-image placeholder-img" data-background-image="url('{{ url_for('static', filename='images/backgrounds/home3.jpg') }}')"></div>
            <div class="feature-text dark-card">
                <h3>External Relations and Collab</h3>
                <p>One of LAMEC's great differentials is the direct collaboration with professors and researchers from top-tier universities in Brazil and abroad, such as USP, UNICAMP, UnB, and UFSM, among others...</p>
            </div>
        </div>
    </section>
    
    <br>
   
    <section class="quote-section container text-center">
        <p class="quote">"LAMEC's mission goes far beyond technical training. The lab is also a space for personal growth, autonomy building, and the development of a scientific and critical mindset..."</p>
        <a href="{{ url_for('main.about') }}" class="btn btn-primary">Read More &rarr;</a>
    </section>
    
    <br>

    <section class="projects-section container" style="padding-left: 0; padding-right: 0;">
        <div class="project-card" style="background-image: url('{{ url_for('static', filename='images/backgrounds/home/fem-mesh-background.png') }}');">
            <div class="project-content">
                <h2>III SIMCOMPI</h2>
                <p class="small">The next edition of the Symposium on Computational Modeling in Science and Technology in PiauÃ­ will take place from {{ event.dates_label }}.</p>
                <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-primary">Read More &rarr;</a>
            </div>
        </div>
        <div class="project-card dark-red-bg" style="background-image: url('{{ url_for('static', filename='images/backgrounds/home/fire-background.jpg') }}');">
            <div class="project-content">
                <h2 style="color: white;">PROJETO FAÃSCA</h2>
                <p class="small">Project Faisca promoting the participation, leadership, and innovation of women in Mechanical Engineering and STEM.</p>
                <a href="{{ url_for('main.faisca') }}" class="btn btn-primary">Read More &rarr;</a>
            </div>
        </div>
    </section>

    <br>

    <section class="contact-section" id="contact">
        <div class="contact-grid">
            <div class="contact-info dark-card">
                <p>We are here to assist you with any questions or information you may need. Please feel free to reach out to us through any of the contact methods below.</p>
                
                <h4>Contact us by e-mail</h4>
                <p>lamec@ufpi.edu.br</p>
                
                <h4>Address</h4>
                <p>LaboratÃ³rio de MÃ©todos de Modelagem Computacional<br>
                Universidade Federal do PiauÃ­ (UFPI)<br>
                Campus UniversitÃ¡rio Ministro PetrÃ´nio Portella<br>
                Ininga, Teresina - PI, 64049-550. Brasil.</p> 
                
                <h4>Office Hours</h4>
                <p>Monday - Friday: 9:00 AM - 5:00 PM<br>Saturday - Sunday: Closed</p>

                <h4>Contact the Boss</h4>
                <p>simone.santos@ufpi.edu.br</p>

                <div class="social-icons">
                    <a href="https://www.instagram.com/lamec.ufpi" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>
        </div>
    </section>

    <div class="map-container">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.285264304419!2d-42.802392788088454!3d-5.057437494898058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x78e39004998a887%3A0xe5acf85cba06c84f!2sLAMEC%20-%20Laborat%C3%B3rio%20de%20M%C3%A9todos%20de%20Modelagem%20Computacional!5e0!3m2!1spt-BR!2sbr!4v1789226196109!5m2!1spt-BR!2sbr" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\publications.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Publications{% endblock %}

{% block content %}
    <header class="page-header">
        <h1>Publications</h1>
    </header>

    <main class="container" style="margin-top: 40px;">
        {% from "components/macros.html" import render_article_card %}
        
        <h2 class="section-title">Journal Papers</h2>
        <div class="article-list" id="journal-list">
            {% for pub in journal_papers %}
                {{ render_article_card(pub) }}
            {% else %}
                <div class="loading-state">Nenhuma publicaÃ§Ã£o encontrada.</div>
            {% endfor %}
        </div>

        <h2 class="section-title" style="margin-top: 60px;">Conference Papers</h2>
        <div class="article-list" id="conference-list">
            {% for pub in conference_papers %}
                {{ render_article_card(pub) }}
            {% else %}
                <div class="loading-state">Nenhuma publicaÃ§Ã£o encontrada.</div>
            {% endfor %}
        </div>
    </main>
{% endblock %}
``n

### Arquivo: .\app\templates\pages\research_team.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Research Team{% endblock %}

{% block content %}
    <header class="page-header">
        <h1>Research Team</h1>
    </header>

    <main class="container" style="margin-top: 40px;">
        <section class="head-section modal-trigger" 
                 data-name="Simone dos Santos Hoefel, PhD." 
                 data-role="Laboratory Head"
                 data-img="{{ url_for('static', filename='images/team/simone_dona.jpg') }}"
                 data-lattes="https://lattes.cnpq.br/1096142351022318"
                 data-bio="Professor at the Federal University of PiauÃ­ and founder of the Laboratory of Computational Modeling Methods (LAMEC). She conducts research projects and activities related to the use of numerical methods, particularly in solid mechanics, structures, soils, fluid-structure interaction, vibration and optimization.">
            
            <div class="head-img" data-background-image="url('{{ url_for('static', filename='images/team/simone_dona.jpg') }}')"></div>
            <div class="head-info">
                <div class="head-title">Laboratory Head</div>
                <h2 style="border:none; margin-bottom: 20px;">Simone dos Santos Hoefel, PhD.</h2>
                <p>Bachelorâ€™s degree in Civil Engineering, master in Numerical Methods in Engineering, and Ph.D. in Mechanical Engineering. She is currently a professor at the Federal University of PiauÃ­ and the founder of LAMEC...</p>
            </div>
        </section>

        <section class="team-grid">
            {% for member in team %}
            <div class="member-card modal-trigger" 
                data-name="{{ member.name }}" 
                data-role="{{ member.role }}"
                data-img="{{ url_for('static', filename=member.img) }}"
                data-lattes="{{ member.lattes }}"
                data-bio="{{ member.bio | default('', true) }}">
                
                <div class="member-photo" style="background-image: url('{{ url_for('static', filename=member.img) }}')"></div>
                <div class="member-name-banner">{{ member.name | upper }}</div>
            </div>
            {% endfor %}
        </section>
    </main>

    <!-- Modal Pessoas -->
    <div class="modal-overlay" id="teamModal">
        <div class="modal-content">
            <button class="close-btn" id="closeModal">&times;</button>
            <div class="modal-body">
                <div class="modal-img-container" id="modalImg"></div>
                <div class="modal-text">
                    <h3 id="modalName">Researcher Name</h3>
                    <div class="modal-role" id="modalRole">Function</div>
                    <div class="modal-bio" id="modalBio"></div>
                    <a target="_blank" class="btn btn-primary" id="modalLattes">
                        <i class="fa-solid fa-link"></i> CV Lattes
                    </a>
                </div>
            </div>
        </div>
    </div>
{% endblock %}

``n

### Arquivo: .\app\templates\proceedings\apresentacao.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - ApresentaÃ§Ã£o (Anais){% endblock %}

{% block proceedings_content %}
    <div class="text-content">
        <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">Voltar aos anais do evento</a>
        <h1>ApresentaÃ§Ã£o</h1>
        
        <h2>Sobre os Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI)</h2>
        <p>Os Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI) consistem na publicaÃ§Ã£o cientÃ­fica oficial do evento, organizado pelo LaboratÃ³rio de MÃ©todos de Modelagem Computacional (LAMEC) da Universidade Federal do PiauÃ­ (UFPI). A publicaÃ§Ã£o Ã© dedicada Ã  divulgaÃ§Ã£o de pesquisas acadÃªmicas e tecnolÃ³gicas de alta qualidade relacionadas Ã  aplicaÃ§Ã£o de modelos computacionais.</p>

        <h2>MissÃ£o</h2>
        <p>Nossa missÃ£o Ã© promover o avanÃ§o do conhecimento cientÃ­fico e tecnolÃ³gico atravÃ©s da publicaÃ§Ã£o de artigos completos. Buscamos aproximar a pesquisa cientÃ­fica dos desafios reais do setor industrial, contribuindo para o desenvolvimento acadÃªmico e profissional de pesquisadores, docentes e estudantes.</p>

        <h2>VisÃ£o</h2>
        <p>Ser reconhecida como uma das principais publicaÃ§Ãµes de modelagem computacional do paÃ­s, mantendo os mais altos padrÃµes de qualidade editorial e contribuindo significativamente para o progresso da ciÃªncia, da engenharia e da forte integraÃ§Ã£o entre universidade e indÃºstria.</p>

        <h2>Valores</h2>
        <ul>
            <li><strong>ExcelÃªncia AcadÃªmica:</strong> Compromisso com a qualidade e rigor cientÃ­fico</li>
            <li><strong>Integridade:</strong> Ã‰tica e transparÃªncia em todos os processos editoriais</li>
            <li><strong>InovaÃ§Ã£o:</strong> Abertura a novas ideias, metodologias de pesquisa, ferramentas computacionais e tecnologias (como impressÃ£o 3D e metamateriais)</li>
            <li><strong>InclusÃ£o:</strong> Diversidade de perspectivas e democratizaÃ§Ã£o do conhecimento</li>
            <li><strong>Responsabilidade Social:</strong> ContribuiÃ§Ã£o para o desenvolvimento da sociedade</li>
        </ul>

        <h2>Escopo e Ãreas de Interesse</h2>
        <p>A publicaÃ§Ã£o aceita submissÃµes voltadas para avanÃ§os e desafios em modelos computacionais, destacando-se as seguintes Ã¡reas temÃ¡ticas:</p>
        <ul>
            <li>AnÃ¡lise estrutural, dinÃ¢mica e fadiga de materiais</li>
            <li> OtimizaÃ§Ã£o topolÃ³gica, multifÃ­sica e multiescalar </li>
            <li> InteraÃ§Ã£o solo-estrutura </li>
            <li> Engenharia tÃ©rmica, termodinÃ¢mica, climatizaÃ§Ã£o e eficiÃªncia energÃ©tica </li>
            <li> VibraÃ§Ãµes, acÃºstica e vibroacÃºstica </li>
            <li> AplicaÃ§Ãµes numÃ©ricas na indÃºstria (MÃ©todo dos Elementos Finitos, MÃ©todo dos Elementos de Contorno, etc.) </li>
        </ul>

        <h2>PÃºblico-Alvo</h2>
        <p>Nossa publicaÃ§Ã£o destina-se a:</p>
        <ul>
            <li>Pesquisadores e docentes universitÃ¡rios</li>
            <li>Estudantes de graduaÃ§Ã£o e pÃ³s-graduaÃ§Ã£o</li>
            <li>Profissionais das diversas Ã¡reas do conhecimento</li>
            <li>InstituiÃ§Ãµes de ensino e pesquisa</li>
            <li>Sociedade acadÃªmica em geral</li>
        </ul>

        <h2>Compromisso com a Qualidade</h2>
        <p>Todos os trabalhos submetidos passam por um rigoroso processo de avaliaÃ§Ã£o por pares (peer review), garantindo a qualidade e a relevÃ¢ncia cientÃ­fica das publicaÃ§Ãµes. Nosso corpo avaliador Ã© composto pela nossa ComissÃ£o CientÃ­fica, formada por pesquisadores renomados e especialistas de excelÃªncia em suas respectivas Ã¡reas representando instituiÃ§Ãµes de todo o paÃ­s (UFPI, UNB, USP, UNICAMP, entre outras).</p>

        <h2>Acesso Aberto</h2>
        <p>Os Anais do SIMCOMPI adotam a polÃ­tica de acesso aberto, disponibilizando gratuitamente todo o conteÃºdo publicado. Dessa forma, contribuÃ­mos para a democratizaÃ§Ã£o do conhecimento cientÃ­fico e tecnolÃ³gico, potencializando o aumento do impacto das pesquisas divulgadas na academia e na indÃºstria.</p>

        <h2>Normas e Contato</h2>
        <p>Para submeter seu artigo ou falar com a organizaÃ§Ã£o do evento, acesse as pÃ¡ginas oficiais do SIMCOMPI:</p>
        <div class="action-links">
            <a href="{{ url_for('proceedings.normas') }}" class="btn btn-outline"><i class="fa-solid fa-file-arrow-up"></i> Diretrizes para SubmissÃ£o</a>
            <a href="{{ url_for('proceedings.contato_anais') }}" class="btn btn-outline"><i class="fa-solid fa-envelope"></i> Entre em Contato</a>
        </div>

        <div class="info-box">
            <h3><i class="fa-solid fa-circle-info"></i> InformaÃ§Ãµes Importantes</h3>
            <ul>
                <li><strong>Periodicidade:</strong> Bienal</li>
                <li><strong>Idiomas aceitos:</strong> PortuguÃªs, InglÃªs</li>
                <li><strong>ISSN:</strong> 3086-7940</li>
                <li><strong>InstituiÃ§Ã£o ResponsÃ¡vel:</strong> LaboratÃ³rio de MÃ©todos de Modelagem Computacional (LAMEC)</li>
            </ul>
        </div>
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\arquivo.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - Arquivo de Anais{% endblock %}

{% block proceedings_content %}
    <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">&larr; Voltar aos anais</a>

    <h2 class="section-title">Arquivo Completo dos Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI)</h2>
    
    <div id="archive-results">
        {% for volume in proceedings_data.volumes %}
        <article class="volume-section" id="{{ volume.id }}">
            <div class="volume-summary">
                {% if volume.cover_img %}
                <img class="volume-cover" src="{{ url_for('static', filename=volume.cover_img) }}" alt="Capa do Volume">
                {% else %}
                <img class="volume-cover" src="{{ url_for('static', filename='images/brand/simcompi-logo.png') }}" alt="Capa IndisponÃ­vel" style="object-fit: contain; padding: 20px; background: #f0f0f0;">
                {% endif %}
                
                <div class="volume-details">
                    <h1>{{ volume.title }}</h1>
                    <p class="volume-year">Ano: {{ volume.year }}</p>
                    <a href="{{ url_for('proceedings.volume', volume_id=volume.id) }}" class="btn btn-outline">
                        Acessar artigos deste volume
                    </a>
                </div>
            </div>
        </article>
        {% else %}
        <div class="loading-state">Nenhum volume disponÃ­vel.</div>
        {% endfor %}
    </div>

    <!-- Template InvisÃ­vel pro JS clonar! -->
    <template id="article-card-template">
        {% from "components/macros.html" import render_article_card %}
        {{ render_article_card({}, is_js_template=True) }}
    </template>
{% endblock %}

{% block extra_js %}
    <!-- JS agora vai buscar os dados via Fetch na API -->
    <script src="{{ url_for('static', filename='proceedings.js') }}?v=4"></script>
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\contato_anais.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - Contato dos Anais{% endblock %}

{% block proceedings_content %}
    <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">â† Voltar aos anais</a>

    <h1 class="section-title">Contato do Corpo Editorial</h1>
    
    <div class="info-card">
        <div class="info-card-header">
            <i class="fa-solid fa-envelope"></i> Fale com os Editores
        </div>
        <div class="info-card-body">
            <p>Para dÃºvidas exclusivamente relacionadas a submissÃµes, prazos de correÃ§Ã£o, formataÃ§Ã£o dos artigos ou solicitaÃ§Ã£o de acesso aos volumes publicados nos Anais, entre em contato diretamente com a comissÃ£o editorial:</p>
            <br>
            <ul class="info-list">
                <li><strong>E-mail Principal:</strong> simcompiaui@gmail.com</li>
                <li><strong>Coordenadora Chefe:</strong> Profa. Dra. Simone dos Santos Hoefel (simone.santos@ufpi.edu.br)</li>
            </ul>
        </div>
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\expediente.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - Expediente{% endblock %}

{% block proceedings_content %}
    <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">&larr; Voltar aos anais do evento</a>

    <h1 class="section-title">Expediente e Corpo Editorial</h1>

    <div class="info-card">
        <div class="info-card-header">
            <i class="fa-solid fa-circle-info"></i> Editor-Chefe
        </div>
        <div class="info-card-body">
            <ul class="info-list">
                <li><strong>TÃ­tulo:</strong> Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI)</li>
                <li><strong>Periodicidade:</strong> Bienal</li>
                <li><strong>Idiomas aceitos:</strong> PortuguÃªs, InglÃªs</li>
            </ul>
            <ul class="info-list">
                <li><strong>ResponsÃ¡vel:</strong> Simone dos Santos Hoefel</li>
                <li><strong>EndereÃ§o:</strong>
                    LaboratÃ³rio de MÃ©todos de Modelagem Computacional<br>
                    Universidade Federal do PiauÃ­ (UFPI)<br>
                    Campus UniversitÃ¡rio Ministro PetrÃ´nio Portella<br>
                    Ininga, Teresina - PI, 64049-550. Brazil.</li>                
                <li><strong><i class="fa-solid fa-envelope"></i> E-mail:</strong> simone.santos@ufpi.edu.br</li>
            </ul>
        </div>
    </div>

    {% from "components/macros.html" import render_committee_table %}

    <h2 class="section-title">Conselho Editorial</h2>
    {{ render_committee_table(committees.organizing) }}

    <h2 class="section-title">ComissÃ£o cientÃ­fica</h2>
    {{ render_committee_table(committees.scientific) }}
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\normas.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}Normas para PublicaÃ§Ã£o{% endblock %}

{% block proceedings_content %}
    <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">â† Voltar aos anais</a>

    <h1 class="section-title">Normas para PublicaÃ§Ã£o</h1>
    <p>Os autores devem seguir rigorosamente as diretrizes de formataÃ§Ã£o dos modelos oficiais para publicaÃ§Ã£o nos anais do SIMCOMPI. O descumprimento das regras pode resultar em rejeiÃ§Ã£o automÃ¡tica pelo comitÃª cientÃ­fico.</p>
    
    <div class="resources-section" style="padding: 20px 0; background: transparent;">
        <div class="resource-block">
            <h3>Pacote de Templates (Word e LaTeX)</h3>
            <p>Baixe o pacote completo contendo as diretrizes de formataÃ§Ã£o e os templates oficiais para publicaÃ§Ã£o nos anais do evento.</p>
            <a href="{{ url_for('static', filename='simcompi-templates/TEMPLATES_SIMCOMPI27.zip') }}" class="btn btn-outline" style="margin-top: 10px;" download>
                <i class="fa-solid fa-download"></i> Baixar Pacote Completo (.zip)
            </a>
        </div>        
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\proceedings.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - Anais do evento{% endblock %}

{% block proceedings_content %}
    <div class="cards-grid">
        <div class="proc-card">
            <h3>ApresentaÃ§Ã£o</h3>
            <p>ConheÃ§a nossa revista e nossos objetivos.</p>
            <a href="{{ url_for('proceedings.apresentacao') }}" class="btn btn-primary">Acessar</a>
        </div>
        <div class="proc-card">
            <h3>Corpo Editorial</h3>
            <p>ConheÃ§a o expediente de editores.</p>
            <a href="{{ url_for('proceedings.expediente') }}" class="btn btn-primary">Acessar</a>
        </div>
        <div class="proc-card">
            <h3>Normas e SubmissÃµes</h3>
            <p>Regras de formataÃ§Ã£o para os autores.</p>
            <a href="{{ url_for('proceedings.normas') }}" class="btn btn-primary">Acessar</a>
        </div>
        <div class="proc-card">
            <h3>Contato</h3>
            <p>Fale com os editores dos anais.</p>
            <a href="{{ url_for('proceedings.contato_anais') }}" class="btn btn-primary">Acessar</a>
        </div>
    </div>

    <h2 class="section-title">III SIMCOMPI</h2>
    <p>O presente volume apenas serÃ¡ publicado ao final do evento.</p>
    <br>
    <h4>Veja os volumes anteriores em nosso arquivo de anais:</h4>
    <a href="{{ url_for('proceedings.arquivo') }}" class="btn btn-outline" style="margin-top: 10px;">Explorar volumes anteriores</a>
    <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-outline" style="margin-top: 10px;">Ver pÃ¡gina do evento</a>
{% endblock %}
``n

### Arquivo: .\app\templates\proceedings\volume.html
`$Lang
{% extends "components/layout.html" %}
{% block title %}LAMEC - {{ volume.title }}{% endblock %}

{% block proceedings_content %}
    <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-outline" style="margin-bottom: 20px;">&larr; Voltar aos anais</a>
    <a href="{{ url_for('proceedings.arquivo') }}" class="btn btn-outline" style="margin-bottom: 20px; margin-left: 10px;">&larr; Voltar para todos os volumes</a>

    <div class="section-title">
        <h1 style="font-size: 2rem;">{{ volume.title }}</h1>
        {% if volume.full_pdf_link %}
        <a href="{{ url_for('static', filename=volume.full_pdf_link) }}" class="btn btn-primary" target="_blank" rel="noopener">
            <i class="fa-solid fa-file-pdf"></i> Baixar volume completo
        </a>
        {% endif %}
    </div>

    {% if volume.categories %}
        {% from "components/macros.html" import render_article_card %}
        {% for category in volume.categories %}
            <h2 class="section-title-highlight">{{ category.name }}</h2>

            {% for article in category.articles %}
                {{ render_article_card(article) }}
            {% endfor %}
        {% endfor %}
    {% else %}
        <div class="loading-state">
            <p>Os anais deste volume serÃ£o disponibilizados apÃ³s o fim do evento.</p>
        </div>
    {% endif %}
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\committees.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - ComissÃµes do Evento{% endblock %}

{% block content %}
    <header class="page-header">
        <h1>ComissÃµes do Evento</h1>
    </header>

    <div class="container" style="text-align: left;">
        <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-outline" style="margin: 20px 0;"><i class="fa-solid fa-arrow-left"></i> Voltar para a pÃ¡gina do evento</a>
    </div>

    <main class="container" style="margin-bottom: 60px;">
        <div class="info-card">
            <div class="info-card-header">
                <i class="fa-solid fa-circle-info"></i> COORDENAÃ‡ÃƒO GERAL
            </div>
            <div class="info-card-body">
                <ul class="info-list">
                    <li><strong>ResponsÃ¡vel:</strong> Simone dos Santos Hoefel</li>
                    <li><strong>EndereÃ§o:</strong>
                    LaboratÃ³rio de MÃ©todos de Modelagem Computacional<br>
                    Universidade Federal do PiauÃ­ (UFPI)<br>
                    Campus UniversitÃ¡rio Ministro PetrÃ´nio Portella<br>
                    Ininga, Teresina - PI, 64049-550. Brazil.</li>   
                    <li><strong><i class="fa-solid fa-envelope"></i> E-mail:</strong> simcompiaui@gmail.com</li>
                </ul>
            </div>
        </div>

        {% from "components/macros.html" import render_committee_table %}

        <h2 class="section-title">ComissÃ£o organizadora</h2>
        {{ render_committee_table(committees.organizing) }}

        <h2 class="section-title">ComissÃ£o cientÃ­fica</h2>
        {{ render_committee_table(committees.scientific) }}
    </main>
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\contact-us.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - Contato do Evento{% endblock %}

{% block content %}

    <div class="container" style="text-align: left;">
        <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-outline" style="margin: 20px 0;"><i class="fa-solid fa-arrow-left"></i> Voltar para a pÃ¡gina do evento</a>
    </div>


    <main class="contact-section container" id="contact" style=" margin-bottom: 60px;">
        <h1 class="section-title">Contato do Evento</h1>
        <div class="contact-grid">
            <div class="contact-info dark-card">
                <p>Estamos Ã  disposiÃ§Ã£o para ajudar com dÃºvidas ou informaÃ§Ãµes sobre o SIMCOMPI. Entre em contato conosco:</p>
                <h4 style="margin-top: 20px;">E-mail Oficial do Evento</h4>
                <p> simcompiaui@gmail.com</p>
                
                <h4 style="margin-top: 20px;">Local do Evento</h4>
                <p>AuditÃ³rio do Centro de Tecnologia<br>Universidade Federal do PiauÃ­ (UFPI)<br>Teresina - PI, Brasil</p>

                <h4 style="margin-top: 20px;">Redes Sociais</h4>
                <div class="social-icons">
                    <a href="https://www.instagram.com/simcompi" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>
        </div>
    </main>
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\ii_simcompi.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - II SIMCOMP (2025){% endblock %}

{% block content %}
    <header class="past-edition-hero" style="background: linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(66, 207, 183, 1) 100%); display: flex; justify-content: center; align-items: center; height: 250px; padding: 20px;">
        <img src="{{ url_for('static', filename='images/simcompi/simcompi_2/ii-simcompi-horizontal-logo.png') }}" alt="II SIMCOMPI" style="max-width: 900px; max-height: 100%; object-fit: contain;">
    </header>

    <p class="past-edition-description">A segunda ediÃ§Ã£o do SIMCOMPI ocorreu de 14 a 17 de abril de 2025, no AuditÃ³rio do Centro de Tecnologia da Universidade Federal do PiauÃ­.</p>

    <div class="container" style="text-align: left;">
        <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-outline" style="margin: 20px 0;"><i class="fa-solid fa-arrow-left"></i> Voltar para a EdiÃ§Ã£o Atual</a>
    </div>
    
    <section class="schedule-section">
        <div class="posters-column">
            <img src="{{ url_for('static', filename='images/simcompi/simcompi_2/banner-ii-simcompi.png') }}" alt="SIMCOMP Poster">
        </div>
        <div class="text-column">
            <h2 class="section-title-highlight">Palestras</h2>
            <ul class="speaker-list">
                <li><strong> DinÃ¢mica de VeÃ­culos FerroviÃ¡rios de Carga </strong><span> Paulo Kurka </span></li>
                <li><strong> Fadiga por fretting em fios galvanizados de cabos de pontes: testes, modelagem e estimativa de vida </strong><span> Eduardo Martins </span></li>
                <li><strong> Modelagem, anÃ¡lise e controle de vibraÃ§Ãµes em turbinas eÃ³licas </strong><span> LaÃ­s Visnadi </span></li>
                <li><strong> InteraÃ§Ã£o Solo-Estrutura: Problemas de Grande Porte </strong><span> JosuÃ© Labaki </span></li>
                <li><strong> Metamateriais e impressÃ£o 3D: caminhos para inovaÃ§Ã£o na Engenharia MecÃ¢nica </strong><span> Adriano Fabro </span></li>       
            </ul>
            
            <h2 class="section-title-highlight">Minicursos</h2>
            <ul class="speaker-list">
                <li><strong> IntroduÃ§Ã£o a simulaÃ§Ã£o de falha por fadiga </strong><span> HÃ©lio Barbosa </span></li>
                <li><strong> Engenharia de ar condicionado e as tendÃªncias do setor </strong><span> Wellington Rebelo </span></li>
                <li><strong> Pyromat: Tabelas e propriedades termodinÃ¢micas com Python </strong><span> Juan do Vale </span></li>
                <li><strong> OtimizaÃ§Ã£o topolÃ³gica: uma poderosa ferramenta de projeto </strong><span> Aldemar Siqueira </span></li>
            </ul>

        </div>
    </section>

    <div class="full-width-gallery" style="background: var(--simcompi-bg-light); padding: 40px 0;">
        <div class="container" style="position: relative; text-align: center;">
            
            {% set slides = [
                url_for('static', filename='images/simcompi/simcompi_2/slide/pessoas-assistindo-o-ii-simcompi.png'),
                url_for('static', filename='images/simcompi/simcompi_2/slide/feira1.png'),
                url_for('static', filename='images/simcompi/simcompi_2/slide/palestra-do-prof-fabro.png'),
                url_for('static', filename='images/simcompi/simcompi_2/slide/professores-e-organizacao-no-encerramento.png')
            ] %}            
            <img id="simcompi-2-slider" src="{{ slides[0] }}" data-slides='{{ slides | tojson | safe }}' alt="Galeria de fotos" style="margin-bottom: 20px; max-width: 800px; width: 100%; height: 500px; object-fit: cover; border-radius: 8px; transition: opacity 0.3s;">
            
            <button class="slider-btn slider-prev" style="left: 0; color: var(--color-primary);"><i class="fa-solid fa-angle-left"></i></button>
            <button class="slider-btn slider-next" style="right: 0; color: var(--color-primary);"><i class="fa-solid fa-angle-right"></i></button>
            
        </div>
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://drive.google.com/drive/folders/1ldzZ7aEng5TXYjYCLAa523nnYtX0icgE" class="btn btn-primary" target="_blank" rel="noopener"><i class="fa-solid fa-images"></i> Ver Mais Fotos no Drive</a>
        </p>
    </div>
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\i_simcompi.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - I SIMCOMP (2019){% endblock %}

{% block content %}
    <header class="past-edition-hero" style="background: rgba(0, 101, 153); display: flex; justify-content: center; align-items: center; height: 250px; padding: 20px;">
        <img src="{{ url_for('static', filename='images/simcompi/simcompi_1/i-simcompi-horizontal-banner.jpg') }}" alt="I SIMCOMPI" style="max-width: 900px; max-height: 100%; object-fit: contain;">
    </header>
    
    <p class="past-edition-description">O <strong>I SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI)</strong> foi realizado na cidade de <strong>Teresina, PiauÃ­</strong>, de <strong>15 a 18 de abril de 2019</strong>.</p>
    
    <div class="container" style="text-align: left;">
        <a href="{{ url_for('proceedings.simcompi') }}" class="btn btn-outline" style="margin: 20px 0;"><i class="fa-solid fa-arrow-left"></i> Voltar para a EdiÃ§Ã£o Atual</a>
    </div>

    <section class="schedule-section">
        <div class="posters-column"> 
            <img src="{{ url_for('static', filename='images/simcompi/simcompi_1/i-simcompi-banner.png') }}" alt="SIMCOMP Poster">
        </div>

        <div class="text-column">
            <h2 class="section-title-highlight">Palestras</h2>
            <ul class="speaker-list">
                <li><strong>FormaÃ§Ã£o de conhecimento e impactos na carreira</strong><span>Dr. Marco Adolph (TROX - USA)</span></li>
                <li><strong>AnÃ¡lise multiescala utilizando o mÃ©todo dos elementos de contorno</strong><span>Prof. Dr Paulo Sollero (UNICAMP)</span></li>
                <li><strong>OtimizaÃ§Ã£o topolÃ³gica de estruturas submersas</strong><span>Prof. Dr. Renato Picelli (USP)</span></li>
                <li><strong>O programa espacial no Brasil e no mundo</strong><span>Prof. Dr. Carlos D'Andrade Souto (IAE/ITA)</span></li>
                <li><strong>SimulaÃ§Ã£o numÃ©rica de mecanismos dinÃ¢micos</strong><span>Prof. Dr. Paulo Roberto Gardel Kurka</span></li>
                <li><strong>ImportÃ¢ncia e aplicaÃ§Ãµes do MEF na indÃºstria</strong><span>Dr. CornÃ©lis Joannes Van Der Poel Filho (General Motors)</span></li>
                <li><strong>OtimizaÃ§Ã£o topolÃ³gica multifÃ­sica e multiescalar</strong><span>Prof. Dr. Renato Pavanello</span></li>
                
            </ul>
            
            <h2 class="section-title-highlight">Minicursos</h2>
            <ul class="speaker-list">
            <li><strong>Projeto de sistemas de climatizaÃ§Ã£o e eficiÃªncia energÃ©tica</strong><span>Dr. Marco Adolph</span></li>
                <li><strong>CriaÃ§Ã£o de animaÃ§Ãµes para destacar resultados de engenharia</strong><span>Prof. Dr. JosuÃ© Labaki</span></li>
                <li><strong>AcÃºstica e vibroacÃºstica no setor espacial</strong><span>Prof. Dr. Carlos D'Andrade Souto</span></li>
                <li><strong>Mentoria rÃ¡pida: elementos essenciais para direcionar sua carreira</strong><span>Dr. CornÃ©lis Joannes Van Der Poel</span></li>
            </ul>

            <h2 class="section-title-highlight">Mesa-redonda</h2>
            <ul class="speaker-list">
            <li><strong>Host</strong><span>Prof. Dr. Eduardo Costa GirÃ£o</span></li>
            </ul>
        </div>
    </section>

    <div class="full-width-gallery" style="background: var(--simcompi-bg-light); padding: 40px 0;">
        <div class="container" style="position: relative; text-align: center;">
            
            {% set slides = [
                url_for('static', filename='images/simcompi/simcompi_1/slide/boi-bumba.jpg'),
                url_for('static', filename='images/simcompi/simcompi_1/slide/janta-com-profs-no-i-simcompi.jpg'),
                url_for('static', filename='images/simcompi/simcompi_1/slide/mesa-de-honra-do-i-simcompi.jpg'),
                url_for('static', filename='images/simcompi/simcompi_1/slide/kurka-palestra-no-i-simcompi.jpg'),
                url_for('static', filename='images/simcompi/simcompi_1/slide/palestrantes-e-organizadores-do-i-simcompi-no-encerramento.jpg'),
                url_for('static', filename='images/simcompi/simcompi_1/slide/poster-presentation-no-i-simcompi.jpg')
            ] %}
            <img id="simcompi-1-slider" src="{{ slides[0] }}" data-slides='{{ slides | tojson | safe }}' alt="SessÃ£o de pÃ´steres" style="margin-bottom: 20px; max-width: 800px; width: 100%; height: 500px; object-fit: cover; border-radius: 8px; transition: opacity 0.3s;">
            
            <button class="slider-btn slider-prev" style="left: 0; color: var(--color-primary);"><i class="fa-solid fa-angle-left"></i></button>
            <button class="slider-btn slider-next" style="right: 0; color: var(--color-primary);"><i class="fa-solid fa-angle-right"></i></button>
            
        </div>
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://drive.google.com/drive/folders/1BQ2BCc9T1mQ1QUzKvE0ZoieRF4iMWiqn" class="btn btn-primary" target="_blank" rel="noopener"><i class="fa-solid fa-images"></i> Ver Mais Fotos no Drive</a> 
        </p>
    </div>

    <section class="award-section">
        <h2 class="section-title-highlight">PrÃªmio do simpÃ³sio de 2019</h2>
        <p class="award-text">Na primeira ediÃ§Ã£o do evento, o estudante <strong>Juan Gabriel Queiroz Blanche</strong> recebeu o prÃªmio de <strong>melhor pesquisa</strong> com o pÃ´ster "<em>AnÃ¡lise de vibraÃ§Ã£o livre de uma viga cÃ´nica rotativa</em>".</p>
        <div class="award-image-container">
            <img src="{{ url_for('static', filename='images/simcompi/simcompi_1/juan-award.jpg') }}" alt="CerimÃ´nia de premiaÃ§Ã£o">
        </div>
    </section>
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\simcompi.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - SIMCOMPI{% endblock %}

{% block content %}
    {% include "components/_event_hero.html" %}

    <section class="simcompi-intro">
        <p>A terceira ediÃ§Ã£o do <strong>SIMCOMPI</strong> serÃ¡ realizada de <strong>{{ event.dates_label }}</strong>, no <strong>AuditÃ³rio do Centro de Tecnologia da Universidade Federal do PiauÃ­</strong>. O SIMCOMPI Ã© um evento nacional organizado pelo LAMEC que reÃºne especialistas para discutir avanÃ§os e desafios relacionados Ã  aplicaÃ§Ã£o de modelos computacionais.</p>
        <br>
        <p>Em sua terceira ediÃ§Ã£o, o simpÃ³sio destaca a integraÃ§Ã£o entre universidade e indÃºstria, oferecendo um espaÃ§o dedicado a aproximar a pesquisa cientÃ­fica dos desafios reais do setor industrial. Esperamos por vocÃª!</p>
        
        <div class="subscribe-btn-container">
            <a href="https://www.even3.com.br/iii-simcompi-687611" class="btn btn-primary" target="_blank" rel="noopener">INSCREVA-SE AGORA</a>
        </div>
    </section>

    <div style="width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px;">
        <div id="even3-widget-speaker" style="height: auto"></div>
        <script src="https://www.even3.com.br/widget/js?e={{ event.even3_slug }}&t=speaker&lang=pt"></script>
    </div>

    <!-- <div style="width: 100%; max-width: 1200px; margin: 40px auto; text-align: center; padding: 0 20px;">
        <iframe src="https://instagram.com/simcompi/embed" width="100%" height="700px" style="border: none; max-width: 1200px; display: inline-block;" title="Convidados do Evento"></iframe>
    </div> -->
    
    <section class="logos-wrapper">
        <h3>Organizadores</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/brand/lamec-logo.png') }}" alt="LAMEC">
            <img src="{{ url_for('static', filename='images/brand/crea-logo.jpg') }}" alt="CREA PI">
        </div>

        <h3>Parceiros institucionais</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/brand/prh-59-logo.jpg') }}" alt="PRHANP">
            <img src="{{ url_for('static', filename='images/brand/ufpi-logo.png') }}" alt="BrasÃ£o da UFPI">
        </div>

        <h3>Patrocinadores</h3>
        <div class="logos-container">
            <img src="{{ url_for('static', filename='images/brand/fapepi-logo.png') }}" alt="FAPEPI">
            <img src="{{ url_for('static', filename='images/brand/vida-verde-logo.png') }}" alt="Vida Verde">
        </div>
    </section>
{% endblock %}
``n

### Arquivo: .\app\templates\simcompi\submissions.html
`$Lang
{% extends "components/base.html" %}
{% block title %}LAMEC - SIMCOMPI Submissions{% endblock %}

{% block content %}
    {% include "components/_event_hero.html" %}

    <section class="important-dates container">
        <h2 class="section-title">Datas importantes</h2>
        <ul class="dates-list">
            <li>Prazo para submissÃ£o de resumo: <strong>{{ event_info.dates.abstract_deadline }}</strong></li>
            <li>Aceite dos resumos: <strong>{{ event_info.dates.abstract_acceptance }}</strong></li>
            <li>Abertura da submissÃ£o de artigo completo: <strong>{{ event_info.dates.full_paper_open }}</strong></li>
            <li>Prazo para submissÃ£o de artigo completo: <strong>{{ event_info.dates.full_paper_deadline }}</strong></li>
            <li>Aceite dos artigos completos: <strong>{{ event_info.dates.full_paper_acceptance }}</strong></li>
            <li>Prazo para submissÃ£o da versÃ£o revisada: <strong>{{ event_info.dates.revised_version }}</strong></li>
            <li>SimpÃ³sio: <strong>{{ event_info.dates.symposium }}</strong></li>
        </ul>
    </section>

    <section class="bg-light-blue submission-section" id="guidelines" style="padding-bottom: 60px;">
        <div id="even3-widget-submission" class="even3-embed-container" height="auto"></div>
        <script src="https://www.even3.com.br/widget/js?e={{ event.even3_slug }}&t=submission&lang=pt"></script>
        
        <div class="container" style="text-align: center; margin-top: 40px;">
            <a href="{{ url_for('proceedings.proceedings_index') }}" class="btn btn-primary" style="margin-bottom: 40px;">Ver anais do evento</a>
            
            <div style="text-align: left; background: white; padding: 30px; border-radius: 8px;">
                <h2 class="section-title-highlight">Normas e Templates</h2>
                <p style="margin-bottom: 20px;">Acesse a pÃ¡gina exclusiva de normas dos anais para obter os modelos obrigatÃ³rios (LaTeX e Word) e as regras de formataÃ§Ã£o completas.</p>
                <a href="{{ url_for('proceedings.normas') }}" class="btn btn-outline" style="margin-bottom: 20px;">Ver Normas de SubmissÃ£o Completas</a>
                
                <div class="resources-section" style="padding: 20px 0 0 0; background: transparent; border-top: 1px solid #eee; margin-top: 10px;">
                    <div class="resource-block">
                        <h3 style="color: var(--color-primary); font-size: 1.4rem; margin-bottom: 8px;">Pacote de Templates (Word e LaTeX)</h3>
                        <p>Baixe o pacote completo contendo as diretrizes de formataÃ§Ã£o e os templates oficiais para submissÃ£o no evento.</p>
                        <a href="{{ url_for('static', filename='simcompi-templates/TEMPLATES_SIMCOMPI27.zip') }}" class="btn btn-outline" style="margin-top: 10px;" download>
                            <i class="fa-solid fa-download"></i> Baixar Pacote Completo (.zip)
                        </a>
                    </div>                
                </div>
            </div>
        </div>
    </section>
{% endblock %}
``n

### Arquivo: .\app\tests\check_assets.py
`$Lang
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = BASE_DIR / "static"

def run():
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_proceedings_all, load_team, load_alumni

    expected_assets = set()

    # Coleta assets dos anais
    proc_data = load_proceedings_all()
    for vol in proc_data.get('volumes', []):
        if vol.get('cover_img'): expected_assets.add(vol['cover_img'])
        if vol.get('full_pdf_link'): expected_assets.add(vol['full_pdf_link'])
        for cat in vol.get('categories', []):
            for art in cat.get('articles', []):
                if art.get('pdf_path') and art.get('pdf_path') != '#':
                    expected_assets.add(art['pdf_path'])

    # Coleta assets da equipe
    for p in load_team() + load_alumni():
        if p.get('img') and "placeholder" not in p['img']:
            expected_assets.add(p['img'].replace('images/', 'images/'))

    errors = []
    for asset in expected_assets:
        if not (STATIC_DIR / asset).exists():
            errors.append(f"ARQUIVO FALTANDO: {asset}")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print("VerificaÃ§Ã£o de assets concluÃ­da com sucesso.")

if __name__ == "__main__":
    run()
``n

### Arquivo: .\app\tests\test_integrity.py
`$Lang
import pytest
from pathlib import Path
import sys

# CORREÃ‡ÃƒO AQUI: adicionado mais um .parent para apontar para a verdadeira RAIZ do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

FORBIDDEN_CHARS = ["ÃƒÆ’Ã†â€™", "ÃƒÆ’Ã¢â‚¬Å¡", "ÃƒÂ¢Ã¢â€šÂ¬", "\ufffd", "ÃƒÆ’Ã‚Â§", "ÃƒÆ’Ã‚Â£", "ÃƒÆ’Ã‚Â©", "ÃƒÆ’Ã‚Â³", "ÃƒÆ’Ã‚Â­", "ÃƒÆ’", "ÃƒÂ©", "ÃƒÂ³", "ÃƒÂ§", "ÃƒÂ£", "ÃƒÂµ", "ÃƒÂ¡", "ÃƒÂ¢", "ÃƒÂª", "ÃƒÂº"]

def test_no_mojibake():
    """Garante ausÃªncia de problemas de codificaÃ§Ã£o (mojibake)."""
    erros = []
    arquivos = list(TEMPLATES_DIR.rglob("*.html")) + list(DATA_DIR.rglob("*.json"))
    for f in arquivos:
        text = f.read_text(encoding="utf-8")
        for token in FORBIDDEN_CHARS:
            if token in text:
                erros.append(f"Mojibake detectado: '{token}' em {f.name}")
    assert not erros, "\n".join(erros)

def test_team_photos_are_unique():
    """Testa se ocorreu bug de copy-paste resultando em membros usando a mesma foto."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_team, load_alumni
    
    people = load_team() + load_alumni()
    seen = {}
    for p in people:
        img = p.get("img")
        if not img or "placeholder" in img: 
            continue
            
        assert img not in seen, f"BUG DE CÃ“PIA: {p['name']} usa a mesma foto de {seen[img]} ({img})"
        seen[img] = p["name"]

def test_lattes_not_placeholder():
    """Garante que links Lattes nÃ£o sÃ£o placeholders inÃºteis."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_team, load_alumni
    people = load_team() + load_alumni()
    invalid_links = ("http://lattes.cnpq.br/", "https://lattes.cnpq.br/", "")
    
    for p in people:
        if "lattes" in p:
            assert p["lattes"].strip() not in invalid_links, f"Lattes invÃ¡lido para: {p['name']}"

def test_static_files_exist_in_proceedings():
    """Garante que nenhum PDF listado nos anais darÃ¡ pÃ¡gina 404."""
    sys.path.insert(0, str(BASE_DIR))
    from app.data.loader import load_proceedings_all
    data = load_proceedings_all()
    erros = []
    
    for vol in data.get('volumes', []):
        if vol.get('cover_img'):
            if not (STATIC_DIR / vol['cover_img']).exists():
                erros.append(f"Capa 404: {vol['cover_img']}")
                
        if vol.get('full_pdf_link'):
            if not (STATIC_DIR / vol['full_pdf_link']).exists():
                erros.append(f"PDF Volume 404: {vol['full_pdf_link']}")
                
        for cat in vol.get('categories', []):
            for art in cat.get('articles', []):
                # Testa direto a variÃ¡vel final de caminho de PDF gerada pelo loader
                pdf_path = art.get('pdf_path')
                if pdf_path and pdf_path != "#":
                    path = STATIC_DIR / pdf_path
                    if not path.exists():
                        erros.append(f"PDF Artigo 404: {pdf_path} ({art.get('title')})")

    assert not erros, "\n".join(erros)

if __name__ == "__main__":
    print("Iniciando suÃ­te de testes de integridade...")
    exit_code = pytest.main(["-v", __file__])
    input("\nPressione ENTER para fechar a janela...")
    sys.exit(exit_code)
``n

### Arquivo: .\app\config.py
`$Lang
import datetime

EVENT = {
    "edition": "III",
    "name": "SIMCOMPI",
    "dates_label": "22 a 24 de marÃ§o de 2027",
    "start_utc": "2027-03-22T11:00:00+00:00",
    "venue": "AuditÃ³rio do Centro de Tecnologia, UFPI",
    "even3_slug": "iii-simcompi-687611",
    "current_volume": "vol_3_2027",
    "current_volume_label": "Vol. 3 2027"
}

CURRENT_YEAR = datetime.datetime.now().year
``n

### Arquivo: .\app\__init__.py
`$Lang
from flask import Flask, request
from .config import EVENT, CURRENT_YEAR

def create_app():
    # Aponta as pastas estÃ¡ticas e templates subindo um nÃ­vel, jÃ¡ que a pasta app/ estÃ¡ isolada
    app = Flask(__name__, template_folder='templates', static_folder='../static')

    # InjeÃ§Ã£o Global: mata hardcodes nos templates
    @app.context_processor
    def inject_global():
        return dict(
            current_endpoint=request.endpoint, 
            event=EVENT, 
            current_year=CURRENT_YEAR
        )

    # Registro dos Blueprints
    from .blueprints.main import bp as main_bp
    from .blueprints.people import bp as people_bp
    from .blueprints.proceedings import bp as proceedings_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(proceedings_bp)

    return app
``n

### Arquivo: .\data\proceedings\vol_1_2019.json
`$Lang
{
  "id": "vol_1_2019",
  "title": "Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI) Vol. 1 2019",
  "year": 2019,
  "cover_img": "simcompi/simcompi_1/i-simcompi-capa-anais.png",
  "full_pdf_link": "vol1/vol1_complete_simcompi.pdf",
  "categories": [
    {
      "name": "Desenvolvimento de ferramentas computacionais",
      "articles": [
        {
          "title": "Aplicativo Android para verificaÃ§Ã£o de elementos de aÃ§o sob forÃ§a axial",
          "authors": "Rodrigo Diniz Filgueiras, Eduardo Martins Fontes do RÃªgo",
          "doi": null,
          "abstract": "Considerando-se a crescente utilizaÃ§Ã£o de estruturas metÃ¡licas na modernidade e a popularizaÃ§Ã£o dos smartphones, pensou-se na implementaÃ§Ã£o de um aplicativo Android a fim de executar as situaÃ§Ãµes de verificaÃ§Ã£o e dimensionamento de elementos de aÃ§o submetidos Ã  forÃ§a axial, cujas diretrizes de cÃ¡lculo sÃ£o baseadas na ABNT NBR 8800 (2008). O objetivo deste trabalho Ã© que o aplicativo, chamado SteelApp, desenvolvido no ambiente do Android Studio, utilizando a linguagem de programaÃ§Ã£o Java, apresente resultados confiÃ¡veis tais como os obtidos em softwares para desktop. A ferramenta gratuita destinar-se-Ã¡ aos estudantes de engenharia civil como tambÃ©m poderÃ¡ auxiliar profissionais da Ã¡rea que lidam com questÃµes prÃ¡ticas de dimensionamento.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/filgueiras-fontes-2019-aplicativo-android-para-verificacao-de-elementos-de-aco-sob-forca-axial.pdf"
        },
        {
          "title": "Dimensionamento de redes de distribuiÃ§Ã£o de Ã¡gua com AutoCAD e EPANET",
          "authors": "JosÃ© Paulo da Silveira Neto, Alessandro de AraÃºjo Bezerra, Renata Shirley de Andrade AraÃºjo, Jordana Madeira Alaggio Ribeiro",
          "doi": null,
          "abstract": "Segundo Gomes (1997), dentre os componentes de um sistema de abastecimento de Ã¡gua, a rede de distribuiÃ§Ã£o Ã© responsÃ¡vel por distribuir Ã¡gua potÃ¡vel ao consumidor final. Para auxiliar no dimensionamento dessas redes, existem softwares como o Epanet, que executa simulaÃ§Ãµes hidrÃ¡ulicas de redes de distribuiÃ§Ã£o pressurizadas, conforme explica Rossman (2000). No entanto, a composiÃ§Ã£o do traÃ§ado no programa implica em atividades bastante repetitivas e que demandam um grande esforÃ§o por parte do projetista. A automaÃ§Ã£o, como sugere Castro (2004), surge entÃ£o como uma alternativa para solucionar esse problema, permitindo maior economia de tempo e esforÃ§o e reduzindo significativamente o risco de erros no projeto. O objetivo deste trabalho foi desenvolver um pacote computacional para otimizar o processo de simulaÃ§Ãµes hidrÃ¡ulicas de redes de distribuiÃ§Ã£o de Ã¡gua no Epanet, atravÃ©s de uma interface interativa com o AutoCAD que promova rapidez e confiabilidade na entrada de dados e traÃ§ado da rede.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/silveira-bezerra-araujo-2019-desenvolvimento-de-redes-de-distribuicao-de-agua-envolvendo-o-autocad-e-o-epanet.pdf"
        },
        {
          "title": "Ferramenta computacional para dimensionamento de coberturra em madeira",
          "authors": "JoÃ£o Pedro Silva Soares, Eduardo Martins Fontes do RÃªgo",
          "doi": null,
          "abstract": "As estruturas de madeira sÃ£o empregadas na construÃ§Ã£o civil desde a antiguidade, principalmente devido Ã  sua disponibilidade na natureza e Ã  sua capacidade de isolamento tÃ©rmica (PFEIL, 2003). Essas estruturas tambÃ©m possuem tipos de conexÃµes fÃ¡ceis de serem executadas e a capacidade de serem ampliadas de acordo com futura necessidade. Na atualidade, a madeira como material estrutural Ã© utilizada principalmente em coberturas de determinadas estruturas, cujo dimensionamento Ã© facilitado pela utilizaÃ§Ã£o de programas computacionais (software) de cÃ¡lculo estrutural. Visando otimizar o cÃ¡lculo de estruturas de cobertura em madeira, este trabalho se propÃµe a desenvolver um software em C# apto a dimensionar a capacidade da estrutura de cobertura de resistir aos esforÃ§os solicitantes. Tal dimensionamento Ã© embasado nas consideraÃ§Ãµes e orientaÃ§Ãµes presentes na norma especÃ­fica.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/soares-fontes-2019-ferramenta-computacional-para-dimensionamento-de-cobertura-em-madeira.pdf"
        },
        {
          "title": "Modelagem computacional de sistemas elevatÃ³rios",
          "authors": "Natanael Basilio Pires, Renata Shirley de Andrade AraÃºjo, Alessandro de AraÃºjo Bezerra",
          "doi": null,
          "abstract": "A Ã¡gua Ã© um recurso essencial na realizaÃ§Ã£o de diversas atividades humanas e seu consumo gera uma demanda por sistemas de infraestrutura urbana, como de esgotamento sanitÃ¡rio e drenagem urbana, por exemplo, nesses sistemas Ã© comum a utilizaÃ§Ã£o de fornecedores de energia para o escoamento adequado de fluxo, que sÃ£o os sistemas elevatÃ³rios ou de recalque, formados por tubulaÃ§Ãµes, acessÃ³rios e bombas. Para realizaÃ§Ã£o de projetos nessa Ã¡rea vÃ¡rios parÃ¢metros referentes a tubulaÃ§Ã£o e ao conjunto motor-bomba devem ser considerados, o que torna o mesmo uma atividade complexa e trabalhosa, dessa forma, vÃ¡rios projetista utilizam de softwares computacionais, como o AutoCAD, para realizaÃ§Ã£o desse tipo de projeto, entretanto, o mesmo nÃ£o possui ferramentas especÃ­ficas para a realizaÃ§Ã£o desse tipo de projeto. Dessa forma, esse trabalho busca utilizar-se da programaÃ§Ã£o presente no AutoCAD, como o AutoLISP e o Visual Basic Applications (VBA) para criar ferramentas que permitam a representaÃ§Ã£o e criaÃ§Ã£o de projetos de sistemas elevatÃ³rios de maneira prÃ¡tica e eficiente.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/basilio-araujo-bezerra-2019-modelagem-computacional-de-sistemas-elevatorios.pdf"
        },
        {
          "title": "ProgramaÃ§Ã£o aplicada Ã  inserÃ§Ã£o de elementos grÃ¡ficos em ambiente AutoCAD",
          "authors": "Paulo Roberto Queiroz de Almeida, Renata Shirley de Andrade AraÃºjo, Alessandro De AraÃºjo Bezerra",
          "doi": null,
          "abstract": "Ã‰ de conhecimento geral que a Ã¡gua Ã© um recurso fundamental para a sociedade, sendo, portanto, importante objeto de estudo. PÃ¡dua (2008) informa que o alto grau de qualidade da Ã¡gua Ã© indicativo de saÃºde e essencial para a sociedade em geral. Muitos sÃ£o os fatores que proporcionam uma boa qualidade Ã  Ã¡gua, um deles Ã© a rede de transporte, esta que, segundo Porto (2006), podem ser bastante complexas, devido aos vÃ¡rios componentes da rede e consequentemente o dimensionamento, operaÃ§Ã£o e manutenÃ§Ã£o desse sistema sÃ£o considerados uma parte bastante dispendiosa do projeto global de abastecimento. Nesse contexto, softwares projetados para melhoria dessas redes de distribuiÃ§Ã£o sÃ£o de grande interesse de estudo, visto que sÃ£o capazes de simplificar tarefas, ou reduzir esforÃ§os repetitivos, provenientes de atividades ligadas Ã  Ã¡rea de projetos. O AutoCAD Ã© um software compatÃ­vel para o planejamento das redes e jÃ¡ bastante utilizado, pois sua linguagem de programaÃ§Ã£o, AutoLISP, permite personalizaÃ§Ã£o de comandos e Ã© de aprendizagem relativamente simples. Valdivino (2011) cita a possibilidade de utilizar seus inÃºmeros comandos originais e acessar um banco de dados do prÃ³prio AutoCAD, facilitando a manipulaÃ§Ã£o das entidades do desenho, como vantagem dessa linguagem de programaÃ§Ã£o. Este trabalho tem como objetivo a criaÃ§Ã£o de ferramentas de inserÃ§Ã£o de elementos grÃ¡ficos que simulam alguns dos acessÃ³rios utilizados nas redes de distribuiÃ§Ã£o, na forma de comandos customizados por meio do ambiente integral de desenvolvimento (IDE, sigla em inglÃªs) do software AutoCAD.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/queiroz-araujo-bezerra-2019-programacao-aplicada-a-insercao-de-elementos-graficos-em-ambiente-autocad.pdf"
        }
      ]
    },
    {
      "name": "Engenharia AeronÃ¡utica",
      "articles": [
        {
          "title": "AnÃ¡lise em CFD da geometria da garganta de uma tubeira",
          "authors": "Kassio Felipe da Costa Serra, JoÃ£o Manoel Torres Lobato",
          "doi": null,
          "abstract": "A tubeira de motor de foguete Ã© um dispositivo que Ã© usado para converter a energia termoquÃ­mica gerada na cÃ¢mara de combustÃ£o em energia cinÃ©tica. O principio Ã© converter gases de alta pressÃ£o e baixa velocidade em gases de baixa pressÃ£o e alta velocidade, resultado pela queima do propelente que sai do motor, ampliando o empuxo. O dipositivo Ã© dividido em trÃªs partes, subsÃ´nica convergente, garganta e supersonica divergente. Este trabalho tem como objetivo de analisar a geometria da garganta em formato circular e triangular se terÃ¡ influÃªncia na pressÃ£o total e na velocidade distribuida na tubeira, com a ajuda do software ANSYS, poderemos utilizar tÃ©cnicas de simulaÃ§Ãµes computacionais para chegar em melhores resultados.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/serra-lobato-2019-analise-em-cfd-da-geometria-da-garganta-de-uma-tubeira.pdf"
        },
        {
          "title": "Estudo prospectivo sobre o uso de materiais polimÃ©ricos na engenharia aeroespacial",
          "authors": "Millena de Cassia Sousa e Silva, Yvo Borges da Silva, ValdivÃ¢nia Albuquerque do Nascimento",
          "doi": null,
          "abstract": "A facilidade e o baixo custo de processamento fizeram com que os materiais polimÃ©ricos se tornassem abundantemente presentes na nossa vida cotidiana, apÃ³s dÃ©cadas de uso restrito, devido ao seu custo de obtenÃ§Ã£o, os compÃ³sitos polimÃ©ricos, tambÃ©m denominados avanÃ§ados, tÃªm ampliado a sua utilizaÃ§Ã£o em diferentes setores da indÃºstria moderna. Existe uma gama de tipos de polÃ­meros para aplicaÃ§Ãµes avanÃ§adas: polÃ­meros com excelentes estabilidade tÃ©rmica e oxidativa, para o uso em aplicaÃ§Ãµes aeroespaciais; plÃ¡sticos utilizados na engenharia. Os termoplÃ¡sticos reforÃ§ados com fibras continuas tÃªm sido utilizados amplamente no setor aeroespacial por serem mais resistentes que os metais, possuÃ­rem baixa absorÃ§Ã£o de umidade entre outras caracterÃ­sticas.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/cassia-borges-albuquerque-2019-estudo-prospectivo-sobre-a-utilizacao-de-materiais-polimericos-na-engenharia-aeroespacial.pdf"
        },
        {
          "title": "NitretaÃ§Ã£o por plasma em gaiola catÃ³dica do aÃ§o AISI 444: investigaÃ§Ã£o e anÃ¡lise dos parÃ¢metros de tratamento",
          "authors": "Renan Matos MonÃ§Ã£o, Bruno Barbosa de Aquino, RÃ´mulo Ribeiro MagalhÃ£es",
          "doi": null,
          "abstract": "Tratamentos de superficie tÃªm assumido um papel de crescente importÃ¢ncia entre as tÃ©cnicas de processamento de materiais. A nitretaÃ§Ã£o por plasma convencional Ã© um processo bem aceito industrialmente, porque apresenta vÃ¡rias vantagens em relaÃ§Ã£o aos outros processos de nitretaÃ§Ã£o (a gÃ¡s e em banho de sais), tais como maior economia de gases e menor duraÃ§Ã£o do processo. Segundo Bermudez (1999), dentre as vÃ¡rias aplicaÃ§Ãµes industriais da nitretaÃ§Ã£o por plasma, se destaca a indÃºstria de armamento e aeroespacial em que canos de canhÃ£o, peÃ§as do guiamento de mÃ­sseis e outros componentes do mesmo podem utilizar a tÃ©cnica para aprimorar suas propriedades mecÃ¢nicas. AlÃ©m disso, segundo Silva (2016) Ã© possÃ­vel tambÃ©m utilizar a nitretaÃ§Ã£o a plasma para o compressor de um motor de uma caÃ§a aeronÃ¡utico. Uma tÃ©cnica alternativa de nitretaÃ§Ã£o iÃ´nica Ã© a ASPN (Active Screen Plasma Nitriding), onde as amostras ficam envolvidas por uma tela polarizada catodicamente e com ela Ã© possÃ­vel obter uma camada nitretada perfeitamente uniforme independente da forma da amostra. Desta forma o plasma atua na tela e nÃ£o nas superficies das amostras. (Sousa, 2004). Nesse trabalho serÃ¡ utilizada uma tÃ©cnica mais recente (2007) de nitretaÃ§Ã£o, denominada de nitretaÃ§Ã£o em gaiola catÃ³dica (NGC). Esta tÃ©cnica Ã© derivada da ASPN, mas que utiliza o efeito do catodo oco para aumentar a eficiÃªncia do processo de nitretaÃ§Ã£o, proporcionando um aumento de dureza e espessura de camada. O objetivo deste trabalho Ã© tratar termoquimicamente o aÃ§o AISI 444, melhorando suas propriedades como dureza, resistÃªncia ao desgaste, rugosidade e resistÃªncia a corrosÃ£o. AlÃ©m de descobrir os melhores parÃ¢metros de tratamento.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/mocao-aquino-magalhaes-2019-nitretacao-a-plasmacom-gaiola-catodica-do-aco-aisi-444_investigacao-e-analise-dos-parametros-de-tratamento.pdf"
        }
      ]
    },
    {
      "name": "EficiÃªncia EnergÃ©tica",
      "articles": [
        {
          "title": "AnÃ¡lise de eficiÃªncia energÃ©tica em uma rede de distribuiÃ§Ã£o de ar comprimido para uma fÃ¡brica de bicicletas",
          "authors": "Luiz Henrique Portela de Abreu, Renan Matos MonÃ§Ã£o, WÃªnio FharÃ¡ Alencar Borges",
          "doi": null,
          "abstract": "O ar comprimido fornece energia para uma intensa variedade de operaÃ§Ãµes fabris, dentre elas podemos destacar o controle e automaÃ§Ã£o de processos, esmerilhar, furar, parafusar, pintar e pressurizar (EP, 2003). Na maioria das indÃºstrias nÃ£o hÃ¡ uma autocrÃ­tica do sistema de ar comprimido buscando melhorias constantes e as condiÃ§Ãµes de operaÃ§Ã£o sÃ£o somente as necessÃ¡rias para que a produÃ§Ã£o de ar seja mantida (CAGI, 2004). AtravÃ©s de observaÃ§Ãµes e estudos preliminares, foi levantada a hipÃ³tese de que a linha de distribuiÃ§Ã£o de ar comprimido da unidade avaliada possuÃ­a defeitos e irregularidades que estavam influenciando no rendimento das mÃ¡quinas e ferramentas pneumÃ¡ticas utilizadas e um aumento nas horas de trabalho do compressor. Assim, este trabalho, atravÃ©s de uma anÃ¡lise de eficiÃªncia energÃ©tica, visa apresentar o projeto do layout, a anÃ¡lise da queda de pressÃ£o e a estimativa da quantidade de vazamentos na rede de distribuiÃ§Ã£o de ar comprimido de uma fÃ¡brica de bicicleta em Teresina (PI).",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/abreu-mocao-borges-2019-analise-da-eficiencia-energetica-em-rede-de-distribuicao-de-ar-comprimido-para-uma-fabrica-de-bicicletas.pdf"
        },
        {
          "title": "AvaliaÃ§Ã£o de monitoramento de sistema fotovoltaico conectado Ã  rede e seus impactos na qualidade da energia na UFPI",
          "authors": "Tatyane Mityko Dias Fussuma, FÃ¡bio Rocha Barbosa",
          "doi": null,
          "abstract": "O monitoramento de Qualidade de Energia Ã© necessÃ¡rio para caracterizar os fenÃ´menos eletromagnÃ©ticos em uma localidade tÃ­pica, diagnosticar incompatibilidades entre a fonte de energia elÃ©trica e a carga, alÃ©m de refinar tÃ©cnicas de modelagem (IEEE, 2009). No presente trabalho, realiza-se a avaliaÃ§Ã£o do monitoramento de um Sistema Fotovoltaico Conectado Ã  Rede, composto por 114 painÃ©is fotovoltaicos do tipo policristalino, cuja potÃªncia nominal Ã© de 36KW, e sua influÃªncia na qualidade de energia elÃ©trica na rede de distribuiÃ§Ã£o na UFPI. Sob uma Ã³tica especifica, objetiva-se estimar a economia de energia na instituiÃ§Ã£o apÃ³s sua instalaÃ§Ã£o e calcular o tempo de retorno financeiro do mesmo. No qual Ã© realizado um estudo de caracterizaÃ§Ã£o do perfil da tensÃ£o e verificaÃ§Ã£o da injeÃ§Ã£o de componentes harmÃ´nicos na rede, analisando assim a influÃªncia da instalaÃ§Ã£o do SFCR na qualidade da rede que atende o local onde estÃ¡ instalado o sistema fotovoltaico.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/fussuma-rocha-2019-avaliacao-do-monitoramento-do-sistema-fotovoltaico-conectado-a-rede-e-seus-impactos-na-qualidade-de-energia-da-ufpi.pdf"
        },
        {
          "title": "Uso de materiais supercondutores de alta temperatura em sistemas de energia: uma prospecÃ§Ã£o tecnolÃ³gica",
          "authors": "Laura Almeida Pereira dos Santos, ValdivÃ¢nia Albuquerque do Nascimento, Felipe Pereira Siqueira e Silva",
          "doi": null,
          "abstract": "Os materiais supercondutores de alta temperatura apresentam-se como potenciais promotores de importantes desenvolvimentos na Ã¡rea energÃ©tica. Algumas das suas caracterÃ­sticas possibilitam o desenvolvimento de novas tecnologias que de outra forma seriam impraticÃ¡veis ou impossÃ­veis, tendo como exemplo dessas caracterÃ­sticas as suas propriedades eletromagnÃ©ticas e o seu nivel de diamagnetismo. Dentre os problemas energÃ©ticos com que a sociedade se confronta atualmente e que o emprego desses materiais pode influenciar de maneira positiva podemos citar a necessidade, nÃ£o sÃ³ econÃ´mica, mas tambÃ©m ambiental, de reduzir as perdas associadas Ã  geraÃ§Ã£o, transporte e distribuiÃ§Ã£o de energia [1]. Esse trabalho tem como objetivo realizar uma busca na literatura de materiais supercondutores de alta temperatura em sistemas de energia.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/almeida-albuquerque-siqueira-2019-utilizacao-de-materiais-supercondutores-de-alta-temperatura-em-sistemas-de-energia_uma-prospeccao-tecnologica.pdf"
        },
        {
          "title": "Uso de nanocompÃ³sitos metÃ¡licos para eficiÃªncia energÃ©tica na produÃ§Ã£o industrial: uma prospecÃ§Ã£o tecnolÃ³gica",
          "authors": "Yvo Borges da Silva, Millena de CÃ¡ssia Sousa e Silva, ValdivÃ¢nia Albuquerque do Nascimento",
          "doi": null,
          "abstract": "Os nanocompositos sÃ£o materiais em que pelo menos um de seus componentes apresentam dimensÃµes nanomÃ©tricas. O interesse pelos nanocompÃ³sitos metÃ¡licos tem crescido acentuadamente, uma vez que estes compostos tendem a apresentar melhores propriedades quando comparados com os compÃ³sitos convencionais. A preocupaÃ§Ã£o com a elevaÃ§Ã£o do consumo de combustÃ­veis e energia na atividade industrial, tem estimulado o desenvolvimento de tÃ©cnicas para a quantificaÃ§Ã£o das entradas e saÃ­das de energia na indÃºstria, possibilitando o cÃ¡lculo do balanÃ§o energÃ©tico. Os balanÃ§os energÃ©ticos sÃ£o indicadores relacionadores de energia e constituem promissora abordagem tÃ©cnica para se avaliar e investigar problemas relacionados Ã  sustentabilidade e eficiÃªncia de sistemas industriais.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/borges-cassia-albuquerque-2019-utilizacao-de-nanocompositos-metalicos-para-eficiencia-energetica-na-producao-industrial-uma-prospeccao-tecnologica.pdf"
        }
      ]
    },
    {
      "name": "MÃ©todo dos Elementos de Contorno",
      "articles": [
        {
          "title": "A boundary element method formulation to modeling the gas coning phenomenon in oil wells",
          "authors": "Pedro Lucas Sanches Fonseca Silva, Jennifer Slayder Santos Sousa, LuÃ­s Jorge Mesquita de Jesus",
          "doi": null,
          "abstract": "For years the water/gas coning phenomenon in oil reservoirs has been a big challenge for the upstream industry. It happens because the conification causes serious limitations on the well productivity, increasing the production costs.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/sanches-slayder-jesus-2019-a-boundary-element-method-formulation-to-modeling-the-gas-coning-phenomenomn-in-oil-wells.pdf"
        }
      ]
    },
    {
      "name": "MÃ©todo dos Elementos Finitos",
      "articles": [
        {
          "title": "Free vibration of a rotating tapered beam",
          "authors": "Juan Gabriel Queiroz Blanche, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Rotating beams are widely found in several engineering structures such as wind turbine blades, industrial fans and gas turbine engine. Blade is one of the most critical mechanical component in rotating machines, as result, the behavior of rotating beams structures has received a lot of attention. Therefore, different configurations of blades was investigated with classical theory of beam by many researchers, such as Euler-Bernoulli and Timoshenko. Since blades rarely has uniform area along the length, a non-prismatic analysis becomes more accurate and reliable motivating several authors to investigate the effect of tapering on rotating beams. In this paper, the vibration frequency of a tapered rotating beam is investigated. The finite element method is used, a non-constant flexural rigidity and mass per unit over the element is developed using a cubic polynomial. The effects of taper ratio and rotational speed are analyzed and the mode shapes are determined for some values of taper parameters. The results obtained shown that Rayleigh-Ritz method for Finite Elements finds the natural frequencies of a rotating tapered cantilever Euler-Bernoulli beam with high precision.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/blanche-hoefel-2019-free-vibration-of-a-rotating-tapered-beam.pdf"
        },
        {
          "title": "Free vibration of a beam-column on two-parameter elastic foundation",
          "authors": "Lucas Oliveira Siqueira, RÃ´mulo Luz Cortez, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "The behavior of the Euler-Bernoulli beam on elastic foundation has been extensively studied in the modern engineering. There are many applications for beam on elastic foundation mainly in mechanical and civil engineering, like shafts supported on ball, roller, or journal bearings, vibrating machines on elastic foundations, network of beams in the construction of floor systems for ships, buildings, submerged floating tunnels, buried pipelines, railroad tracks etc. The purpose of this work is to analyze the influence of the axial load on the dynamic response of an axial-loaded Euler-Bernoulli beam resting on two-parameter foundation. Some examples presents the influence of the axial load and the foundation in the natural frequencies of the beam. Also, mode shapes were determined for some classical boundary conditions. The results obtained by FEM are discussed and compared with the exact solution.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/siqueira-cortez-hoefel-2019-free-vibration-of-a-beam-column-on-two-parameter-elastic-foundation.pdf"
        },
        {
          "title": "Modelagem numÃ©rica de problema de contato",
          "authors": "Vinicius da Silva Costa, Eduardo Martins Fontes do RÃªgo",
          "doi": null,
          "abstract": "O principal mecanismo causador de falha nos cabos condutores Ã© a fadiga provocada pela aÃ§Ã£o continua do vento, e ocorre frequentemente nos pontos de fixaÃ§Ã£o do cabo, como por exemplo, grampos de suspensÃ£o. No ponto de fixaÃ§Ã£o, hÃ¡ a restriÃ§Ã£o do movimento do cabo, alÃ©m do contato entre seus fios constituintes e o grampo. Ambos sÃ£o sujeitos ao movimento relativo entre si, gerando o processo de fretting entre os mesmos e induzindo, por fadiga, a nucleaÃ§Ã£o e crescimento de trincas. A consequÃªncia Ã© o rompimento dos componentes ou do prÃ³prio cabo, que se materializa em transtornos Ã  populaÃ§Ã£o atendida (FADEL, 2010). O problema de contato Ã© simplificado para um modelo numÃ©rico bidimensional (2D), onde o custo computacional Ã© reduzido. Para isso utiliza-se o software ANSYS, que baseia-se no mÃ©todo dos elementos finitos. Desta forma, pretende-se obter computacionalmente as TensÃµes de contato.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/costa-fontes-2019-modelagem-numerica-de-problema-de-contato.pdf"
        },
        {
          "title": "Nonlocal Finite Element AnÃ¡lise de Euler-Bernoulli Nanobeams",
          "authors": "Aldemar Pontes de Siqueira Neto, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Nanostructured materials present outstanding features like elevated modulus of elasticity and yield strength, high flexibility and conductivity. This materials are widely applied to nanoelectronics, nanodevices, nanosensors and nanocomposites. Various nonclassical elasticity theories were developed to study the mechanical behaviour of nanostructures, among them, nonlocal elasticity theory (ERINGEN, 1983) is the most used. In this theory, a nonlocal parameter which accounts for small scale effects is included in the constitutive equations. Carbon nanotubes are an extensively studied nanostructure often modelled as an Euler-Bernoulli nanobeam. In the present work, governing equations for bending, buckling and free vibration of an Euler-Bernoulli nanobeam are presented. A finite element model is developed to investigate the influence of nonlocal parameter, slenderness, rotational inertia and boundary conditions on deflections, buckling loads and natural frequencies. Numerical results obtained are discussed and compared with results obtained by other researchers.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/siqueira-hoefel-2019-nonlocal-finite-element-analysis-of-euler-bernoulli-nanobeams.pdf"
        },
        {
          "title": "SimulaÃ§Ã£o numÃ©rica para anÃ¡lise estrutural de estruturas de suporte de basculador ferroviÃ¡rio pelo mÃ©todo dos elementos finitos",
          "authors": "Rodrigo da Silva Melo, Leonardo VinÃ­cius Lisboa da Cruz, Anaximandro Souza",
          "doi": null,
          "abstract": "A modelagem computacional Ã© uma Ã¡rea de conhecimento que se baseia no processo de aplicaÃ§Ã£o de modelos matemÃ¡ticos, com tÃ©cnicas de computaÃ§Ã£o, para o entendimento de problemas complexos, que incluem diversas Ã¡reas da ciÃªncia. Nesse sentido, foram analisados cavaletes por meio de modelagem computacional que servem de suporte para os viradores de vagÃµes da empresa Vale, dispositivos para descarga de minÃ©rio em pÃ¡tios de estocagem da empresa. O objetivo do presente trabalho Ã© a realizaÃ§Ã£o de anÃ¡lises estÃ¡ticas e anÃ¡lises de fadiga dos cavaletes suporte de viradores de vagÃ£o. Com o auxilio da modelagem computacional e simulaÃ§Ãµes numÃ©ricas, parÃ¢metros importantes foram analisados com o objetivo de auxiliar nas anÃ¡lises de manutenÃ§Ã£o, visto que a interpretaÃ§Ã£o dos dados Ã© fundamental, considerando a vida Ãºtil e a durabilidade desses elementos que sÃ£o de grande importÃ¢ncia para a rotina da empresa.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/melo-lisboa-souza-2019-simulacao-numerica-para-analise-estrutural-dos-cavaletes-suporte-de-viradores-de-vagao-por-meio-do-metododos-elementos-finitos.pdf"
        },
        {
          "title": "Vibration response of a beam-column on a Pasternak foundation",
          "authors": "RÃ´mulo Luz Cortez, Lucas Oliveira Siqueira, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Several researchers over the years have sought describe and analyze problems of soil-structure interaction. For example, Arboleda-Monsalve et al. (2008) used the finite element method (FEM) to analyze the dynamic of a Timoshenko beam-column resting on elastic foundation with general constraints ends, and Abohadima et al. (2015) investigated the free and forced vibration of an axial-loaded Timoshenko beam resting on a elastic foundation using the Recursive Differentiation Method (RDM). Further, Soares et al. (2017), also using the FEM, investigated the dynamic behave of a Timoshenko beam resting on a Pasternak foundation. In this context, the purpose of this work is investigate the dynamic behavior of an axial-loaded Timoshenko beam resting on a two-parameter elastic foundation. FEM is developed and compared with the analytical solution. Foundation parameters and the axial load contributions are investigated in several numerical examples for beams with different end restraints.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/cortez-siqueira-hoefel-2019-vibration-response-of-a-beam-column-on-a-pasternak-foundation.pdf"
        }
      ]
    },
    {
      "name": "Modelagem e IdentificaÃ§Ã£o de Sistemas",
      "articles": [
        {
          "title": "Estudo e aplicaÃ§Ã£o de sensor LIDAR em carros autÃ´nomos",
          "authors": "Darieldon de Brito Medeiros, Denilson Alves de Sousa, JosÃ© Maria Pires de Menezes JÃºnior",
          "doi": null,
          "abstract": "Segundo Santos e Khoshelham (2015), o crescimento de sistemas de sensores de imageamento e navegaÃ§Ã£o tornou o mapeamento tridimensional uma tarefa essencial para diversas Ã¡reas da engenharia, tais como o sistema de localizaÃ§Ã£o e mapeamento simultÃ¢neo (SLAM), para inspeÃ§Ã£o de infraestruturas, cartografia, dentre outras. De acordo com Wang et al. (2017) para os casos que os veÃ­culos autÃ´nomos operam com certa proximidade com pedestres, o reconhecimento e o rastreamento de pedestres em movimento sÃ£o funÃ§Ãµes bÃ¡sicas do sistema de prevenÃ§Ã£o de colisÃ£o.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/brito-alves-pires-2019-estudo-e-aplicacao-de-sensor-lidar-em-carros-autonomos.pdf"
        },
        {
          "title": "Modelagem baseada em agentes para derrame de Ã³leo",
          "authors": "Pedro Lucas Sanches Fonseca Silva, Jennifer Slayder Santos Sousa, LuÃ­s Jorge Mesquita de Jesus",
          "doi": null,
          "abstract": "A Modelagem Baseada em Agentes (MBA) Ã© uma tÃ©cnica de modelagem extremamente rica que permite lidar com sistemas complexos a partir de suas unidades constituintes e gerar resultados atravÃ©s das interaÃ§Ãµes entre estas.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/fonseca-slayder-jesus-2019-modelagem-baseada-em-agentes-para-derrame-de-oleo.pdf"
        },
        {
          "title": "Modelagem de um modelo didÃ¡tico para um servomotor",
          "authors": "Luan da Silva Bezerra, JosÃ© Medeiros de AraÃºjo JÃºnior",
          "doi": null,
          "abstract": "Os servomotores sÃ£o mÃ¡quinas eletromecÃ¢nicas, cujos eixos apresentam movimentos rotacionais proporcionais a um sinal de entrada, como por exemplo, sinais do tipo PWM. Esses servos sÃ£o utilizados em aplicaÃ§Ãµes que exigem um movimento rotativo preciso, sendo bastante utilizados em impressoras, sistemas de controle como o Ball and Beam, mÃ¡quinas-ferramenta, pÃªndulos e braÃ§os robÃ³ticos. O interesse neste sisterna Ã© motivado por sua precisÃ£o, fÃ¡cil manutenÃ§Ã£o e baixo custo. Para as mais diversas aplicaÃ§Ãµes com servos, idealmente deve-se utilizar algoritmos de controle, de modo a se otimizar mais ainda a precisÃ£o do deslocamento angular gerado pelo seu eixo. Neste caso, Ã© necessÃ¡rio que seja realizado o levantamento do modelo matemÃ¡tico que represente a dinÃ¢mica do servomotor, onde esse modelo vai relacionar o sinal de saÃ­da (deslocamento angular) em relaÃ§Ã£o a sua entrada (sinal PWM). A modelagem matemÃ¡tica desses tipos de motores Ã© um fator de real importÃ¢ncia na busca de um melhor desempenho. Aplicando leis fÃ­sicas inerentes a sua natureza, como as leis de Newton e as leis de Kirchhoff, chegamos nas equaÃ§Ãµes que relacionam matematicamente as variÃ¡veis do modelo e tornam possÃ­vel o projeto de controladores. Dessa forma, o presente trabalho consiste em obter o modelo matemÃ¡tico de um servomotor, e em seguida, aplicar o mesmo em um sistema de controle. AlÃ©m dessas equaÃ§Ãµes, tem-se tambÃ©m uma implementaÃ§Ã£o computacional de um controlador, e com isso, desenvolvimento de uma ferramenta didÃ¡tica para o estudo e aprimoramento das tÃ©cnicas de modelagens e de controle.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/bezerra-araujo-2019-modelagem-de-um-modelo-didatico-para-um-servomotor.pdf"
        },
        {
          "title": "Modelagem da atitude de a Quadrotor Drone",
          "authors": "Pedro Iago Carvalho Martins, OtacÃ­lio da Mota Almeida",
          "doi": null,
          "abstract": "A atitude em um drone quadrotor corresponde aos dois Ã¢ngulos que localizam o seu plano de atuaÃ§Ã£o em relaÃ§Ã£o Ã  horizontal. O controle de atitude corrige a inclinaÃ§Ã£o de um drone quadrotor atravÃ©s de alteraÃ§Ãµes de velocidade, e portanto de forÃ§a de propulsÃ£o, nas suas quatro hÃ©lices. Ajustando a atitude e a propulsÃ£o total, Ã© possÃ­vel equilibrar um quadrotor em uma altura fixa, bem como o locomover de um ponto a outro (BRESCIANI, 2008). No referente trabalho analisou-se um drone restrito ao balanÃ§o horizontal como na Figura 1, no LaboratÃ³rio de Controle e AutomaÃ§Ã£o da UFPI, fixado por cordas em um eixo horizontal, enquanto no outro eixo controlou-se a atitude, acionando-se dois motores de forma simÃ©trica. Assim, identificou-se um modelo de funÃ§Ã£o de transferÃªncia por aproximaÃ§Ã£o Ã  curva de Nyquist, obtida com mediÃ§Ãµes de entrada e saÃ­da no mÃ©todo do relÃ© (ASTROM, 1995).",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/carvalho-mota-2019-modelando-a-atitude-de-um-drone-quadrotor.pdf"
        }
      ]
    },
    {
      "name": "Nanotecnologia",
      "articles": [
        {
          "title": "AvanÃ§os da nanotecnologia farmacÃªutica aplicados ao desenvolvimento: uma prospecÃ§Ã£o tecnolÃ³gica",
          "authors": "Nayara de Oliveira Sobrinho, MoisÃ©s das Virgens Santana, Hitalo de Jesus Bezerra da Silva",
          "doi": null,
          "abstract": "Segundo a literatura, verificou-se que a gama de nanoparticulas (NPs) Ã© eficaz na administraÃ§Ã£o de fÃ¡rmacos direcionados (Chow et al., 2015). Ao longo da Ãºltima dÃ©cada, relatos na literatura descreveram vÃ¡rios tipos de nanoparticulas com uma variedade de usos possÃ­veis, incluindo lipossomas, nanocÃ¡psulas polimÃ©ricas, nanocÃ¡psulas de nÃºcleo lipÃ­dico, nanopartÃ­culas lipÃ­dicas sÃ³lidas, carreadores lipÃ­dicos nanoestruturados, nanoemulsÃµes, nanocristais, nanoparticulas metÃ¡licas (Islan et al., 2017). Estes sistemas podem melhorar os perfis de liberaÃ§Ã£o e estabilidade das drogas, mantendo sua concentraÃ§Ã£o dentro de uma faixa terapÃªutica e superando as barreiras biolÃ³gicas para captaÃ§Ã£o celular (Canbolat et al., 2014). As nanoestruturas tambÃ©m sÃ£o adequadas como agentes de imagem que possuem funcionalidade avanÃ§ada, incluindo resposta a estÃ­mulos internos e externos na Ã¡rea de doenÃ§a alvo. O uso de nanopartÃ­culas permite aumentar a eficÃ¡cia terapÃªutica com baixos riscos de efeitos colaterais (Contri et al., 2014, Fang e Al-Suwayeh, 2012, Frank et al., 2015). Melhorias na seguranÃ§a, entrega de fÃ¡rmacos nÃ£o-viral especÃ­fica ao alvo, captaÃ§Ã£o celular, bem como estabilidade e atividade intracelular sÃ£o as principais razÃµes para o desenvolvimento de nanossistemas multifuncionais, inteligentes e comutÃ¡veis (Li et al., 2010). Nesse sentido, esse trabalho tem como objetivo fazer um levantamento de dados com os nÃºmeros de artigos e patentes depositadas nas principais bases de dados, lincando os avanÃ§os da nanotecnologia aplicada ao desenvolvimento de fÃ¡rmacos.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/sobrinho-virgens-jesus-2019-avancos-da-nanotecnologia-farmaceutica-aplicados-ao-desenvolvimento_uma-prospeccao-tecnologica.pdf"
        },
        {
          "title": "Electronic Properties of Nitrogen-Doped Graphene Nanowiggles",
          "authors": "Anderson Soares da Costa AzevÃªdo, Eduardo Costa GirÃ£o",
          "doi": null,
          "abstract": "Early researchers demonstrated considerably interest in investigating nanoscale carbon materials. This is due to their remarkable properties and promising potential applications in novel nanoelectronic devices (Son et al., 2006). These materials include: fullerenes, carbon nanotubes and graphene nanoflakes. In this work, we investigate the electronic properties and emergence of magnetic states in periodic nitrogen-doped graphene structures of complex geometry inspired into nanostructures fabricated and reported in the literature (Cai et al., 2010).",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/azevedo-girao-2019-electronic-properties-of-nitrogen-doped-graphene-nanowiggles.pdf"
        },
        {
          "title": "Eletronic structure of carbon nanocage with bipartite structure: a DFT study",
          "authors": "FÃ¡bio Nascimento de Sousa, Eduardo Costa GirÃ£o",
          "doi": null,
          "abstract": "The carbon is one of the chemical elements most found in nature. A of its main characteristics is the formation of polymorphs under various conditions of temperature and pressure. The figure. 1 shows some of the main forms allotropic of the carbon. Although nanotubes and graphene are the most studied elements of the carbon nanostructures family, cage-like structure, like fullerenes[1], are subject de constant interest in the area. Such structure have potencial applications drug delivery(fig. 2a)[2] or as elements in nanojunctions(fig. 2b). For exemple[3].",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/nascimento-girao-2019-electronic-structure-of-carbon-nanocage-with-bipartite-structure-a-dft-study.pdf"
        },
        {
          "title": "Estados magnÃ©ticos em nanoflocos de grafeno",
          "authors": "Caio Vitor Teixeira Costa, Eduardo Costa GirÃ£o",
          "doi": null,
          "abstract": "A quantidade de alÃ³tropos do carbono como grafite, diamante, fulereno - e as propriedades particulares que cada um possuÃ­a fez com que a quÃ­mica do carbono fosse vista como potencialmente capaz de gerar uma nova geraÃ§Ã£o de dispositivos. Nesse contexto, o grafeno, com sua elevada mobilidade eletrÃ´nica [1] e resistÃªncia mecÃ¢nica[1], mostra-se como um dos materiais mais indicados a ocupar o posto hoje pertencente ao Silicio. PorÃ©m, o grafeno Ã© um semicondutor de gap(expressÃ£o do inglÃªs relacionado ao espaÃ§o entre as bandas de conduÃ§Ã£o e de valÃªncia do material) zero[2], e a existÃªncia dessa lacuna de energia Ã© fundamental para se controlar o transporte eletrÃ´nico[3]. Tendo isso em vista, buscam-se maneiras de se abrir esse gap de energia em torno do nÃ­vel de Fermi, com o objetivo de tornar mais fÃ¡cil sua integraÃ§Ã£o em dispositivos eletrÃ´nicos. As duas estratÃ©gias mais usadas pela comunidade cientifica se baseiam na dopagem e em \"cortes\" do grafeno ao longo de uma ou de duas de suas direÃ§Ãµes. A primeira estratÃ©gia se baseia na inclusÃ£o de impurezas na estrutura do grafeno, como por exemplo substituindo-se Ã¡tomos de carbono por outros de diferentes elementos, como Boro e NitrogÃªnio, de forma estratÃ©gica. JÃ¡ o segundo mÃ©todo gera estruturas finitas em uma das dimensÃµes do sistema, chamadas de nanoflocos de grafeno (ou GNFs, do inglÃªs graphene nanoflakes) que sÃ£o subunidades do grafeno com tamanho e geometria limitado nas suas duas dimensÃµes. Essas estruturas apresentam propriedades que dependem da largura da fita e da geometria de suas bordas. Em particular, as GNFs chamam a atenÃ§Ã£o por ter estados localizados nas bordas, facilitando o estudo por meio de cÃ¡lculos computacionais de suas propriedades elÃ©tricas e magnÃ©ticas[4]. Neste trabalho tem-se como objetivo realizar um estudo teÃ³rico dos GNFS contendo estados de borda com spin polarizado e descrever as propriedades de diferentes configuraÃ§Ãµes magnÃ©ticas.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/teixeira-girao-2019-estados-magneticos-em-nanoflocos-de-grafeno.pdf"
        },
        {
          "title": "Estados magnÃ©ticos em nanoflocos de grafeno contendo anti-dots",
          "authors": "Herus Teixeira Lopes, Eduardo GirÃ£o Costa",
          "doi": null,
          "abstract": "A sociedade anseia por inovaÃ§Ãµes tecnolÃ³gicas, como dispositivos cada vez menores e mais eficientes. Por consequÃªncia, a busca por possÃ­veis substitutos ao silÃ­cio movimenta a comunidade cientÃ­fica. Hoje estudam-se diversos candidatos a componentes bÃ¡sicos de uma futura eletrÃ´nica visando o alcance da escala nanomÃ©trica. Entre os diversos novos materiais estudados em Fisica da MatÃ©ria Condensada, pode-se citar o grafeno. Neste trabalho, sÃ£o investigadas as propriedades eletrÃ´nicas de nano flocos hexagonais de grafeno com borda zig zag com defeitos estruturais compostos de poros. Os poros sÃ£o constituidos de \"furos\" triangulares centrais como uma modificaÃ§Ã£o da estrutura. Este estudo utiliza a Teoria do Funcional da Densidade (DFT) para a investigaÃ§Ã£o dos estado eletrÃ´nicos dos sistemas estudados, como serÃ¡ descrito adiante.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/teixeira-girao-2019-estados-magneticos-em-nanoflocos-de-grafeno-contendo-anti-dots.pdf"
        }
      ]
    },
    {
      "name": "Sistemas Inteligentes",
      "articles": [
        {
          "title": "ClassificaÃ§Ã£o de amostras metalogrÃ¡ficas de aÃ§os-rÃ¡pidos",
          "authors": "Marcus Patrick Acioli da Silva, JosÃ© Maria Pires de Menezes JÃºnior, Francisco Riccelly Pereira Feitosa",
          "doi": null,
          "abstract": "Metalografia Ã© a tÃ©cnica de estudar as propriedades fÃ­sicas, quÃ­micas e mecÃ¢nicas dos metais e seus produtos. Essas propriedades estÃ£o intrinsecamente relacionadas com a natureza das microestruturas que constituem um material. A observaÃ§Ã£o desses parÃ¢metros permite realizar anÃ¡lises qualitativas e quantitativas de um material. Em posse desses dados, Ã© possÃ­vel a classificaÃ§Ã£o de um material de acordo com seus microconstituintes. No presente estudo, propÃµe-se a classificaÃ§Ã£o de amostras metalogrÃ¡ficas de aÃ§os-rÃ¡pidos atravÃ©s de tÃ©cnicas de VisÃ£o Computacional e Aprendizado de MÃ¡quinas.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/acioli-pires-feitosa-2019-classificacao-de-amostras-metalograficas-de-acos-rapidos.pdf"
        },
        {
          "title": "IdentificaÃ§Ã£o do fenÃ´meno de transferÃªncia grafo-fÃ´nico-fonolÃ³gica PB-ILE utilizando redes neurais artificiais",
          "authors": "Atos Apollo Silva Borges, Aratuza Rodrigues Silva Rocha, FÃ¡bio Rocha Barbosa",
          "doi": null,
          "abstract": "Os fenÃ´menos de transferÃªncia entre lÃ­nguas cometidos por falantes nÃ£o nativos jÃ¡ sÃ£o conhecidos e bem documentados na literatura. Contudo, o reconhecimento e a classificaÃ§Ã£o dos mesmos sÃ£o feitos, principalmente, atravÃ©s de transcriÃ§Ãµes, um processo lento e trabalhoso. A identificaÃ§Ã£o rÃ¡pida desse tipo de fenÃ´meno seria de grande valia para sistemas de nivelamento de alunos de lÃ­ngua estrangeira, podendo ser usados em escolas de idiomas, sistemas de ensino Ã  distÃ¢ncia, aprendizes autodidatas, aplicativos de lÃ­ngua estrangeira ou atÃ© mesmo por pesquisadores linguistas. No presente trabalho, foi realizada uma verificaÃ§Ã£o das possibilidades de tÃ©cnicas e ferramentas que podem ser utilizadas na classificaÃ§Ã£o automÃ¡tica desses processos de transferÃªncia, em especial do fenÃ´meno de transferÃªncia grafo-fÃ´nico-fonolÃ³gica de SonorizaÃ§Ã£o de <s> (SOS), guiado sob uma Ã³tica do paradigma conexionista da linguagem.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/borges-aratuza-barbosa-2019-identificacao-de-fenomeno-de-transferencia-grafo-fonico-fonologica-pb-ile.pdf"
        },
        {
          "title": "IdentificaÃ§Ã£o e classificaÃ§Ã£o do fenÃ´meno de transferÃªncia apagamento de (AH) PB-ILE utilizando RNA do tipo MLP",
          "authors": "Washington LuÃ­s Pinho Rodrigues Filho, Aratuza Rodrigues Silva Rocha, FÃ¡bio Rocha Barbosa",
          "doi": null,
          "abstract": "Durante a aprendizagem de uma nova lÃ­ngua, manifesta-se uma processo chamado de fonologia da interlingua. Esse processo, que ocorre nos estÃ¡gios iniciais do aprendizado, caracteriza como um surgimento de um sistema linguistico diferente da lÃ­ngua estrangeira alvo (L2) por conta das caracteristicas da lÃ­ngua nativa (L1), a qual ainda exerce influÃªncia sobre o sistema em criaÃ§Ã£o (ROCHA, 2012). Tal fenÃ´meno, que se manifesta durante o processo de transferÃªncia de conhecimento grafo-fÃ´nico-fonolÃ³gico de L1 para L2 (ZIMMER e ALVES, 2006). No presente trabalho, foi proposta a identificaÃ§Ã£o do fenÃ´meno de transferÃªncia AH utilizando RNA do tipo MLP. Para isso, foram colhidas produÃ§Ãµes na ferramenta Google Tradutor que sÃ£o de palavras inglesas produzidas pelo software nas opÃ§Ãµes de Ã¡udio InglÃªs e PortuguÃªs Brasileiro como pode ser visto na figura 1. Logo apÃ³s, foram extraidos dois descritores de sinal para servirem de dados para o treinamento da rede neural e, posteriormente, seren identificados e classificados por ela.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/pinho-aratuza-barbosa-2019-identificacao-e-classificacao-do-fenomeno-de-transferencia-apagamento-de-ah-pb-ile-utilizando-rna-do-tipo-mlp.pdf"
        }
      ]
    },
    {
      "name": "Teoria de controle e aplicaÃ§Ãµes",
      "articles": [
        {
          "title": "Controladores com estrutura fuzzy PID aplicados a malha de temperatura de uma incubadora neonatal",
          "authors": "JosÃ© Borges do Carmo Neto, Luno Gomes de Oliveira, Gabryel Figueiredo Soares, OtacÃ­lio da Mota Almeida",
          "doi": null,
          "abstract": "Alguns autores declaram, por exemplo, que em aplicaÃ§Ãµes de controle de processo, mais de 95% dos controladores implementados atÃ© hoje sÃ£o do tipo Pl ou PID (VILANOVA, 2012). Entretanto, no projeto de controladores convencionais, com os Pl e PID, considera-se apenas as relaÃ§Ãµes lineares entre as variÃ¡veis do processo controlado, o que impÃµe severas limitaÃ§Ãµes na performance de controle, frente a sistemas que possuem modelagens complexas, nÃ£o-linearidades ou incertezas (ASTROM, 2001). Em um estudo com cerca de 150,000 malhas de controle em 250 plantas industriais ao redor do mundo mostrou que 68% de todos os controladores tÃªm performances inaceitÃ¡veis (VILANOVA, 2012). No presente trabalho, lÃ³gica fuzzy Ã© aplicada na sintonia de controladores com estrutura PID, com o objetivo de melhorar a performance do controlador e diminuir o esforÃ§o de controle sobre a malha.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/carmo-gomes-figueiredo-mota-2019-controladores-com-estrutura-fuzzy-pid-aplicados-a-malha-de-temperatura-de-uma-incubadora-neonatal.pdf"
        },
        {
          "title": "Controle fuzzy em um tanque de nÃ­vel didÃ¡tico",
          "authors": "Francisco LeÃ£o de Oliveira, JosÃ© Medeiros de AraÃºjo JÃºnior",
          "doi": null,
          "abstract": "A indÃºstria aplica em vÃ¡rios de seus processos tanques acoplados para realizaÃ§Ã£o de diversas funÃ§Ãµes, como o armazenamento e transporte de liquidos. IndÃºstrias petroquÃ­micas, de celulose ou de tratamento de liquidos, normalmente apresentam processamento de lÃ­quidos por reaÃ§Ãµes quÃ­micas ou tratamento de misturas. Este processamento requer continuamente um controle criterioso sobre o nÃ­vel do fluido, assim como regulaÃ§Ã£o do fluxo entre os tanques. O presente trabalho apresenta a implementaÃ§Ã£o de um controle fuzzy em uma planta didÃ¡tica, onde deseja-se obter a resposta ao degrau do controle fuzzy e compara-la a uma tÃ©cnica clÃ¡ssica de controle, como exemplo a um controle PID, para que assim possa ser visto a eficiÃªncia dessa classe de controle.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/leao-medeiros-2019-controle-fuzzy-aplicado-em-um-tanque-de-nivel-didatico.pdf"
        },
        {
          "title": "Desenvolvimento de hardware didÃ¡tico para ensino de controle digital",
          "authors": "Gabryel Figueiredo Soares, JosÃ© B. do Carmo Neto, Luno Gomes de Oliveira, OtacÃ­lio da Mota Almeida",
          "doi": null,
          "abstract": "Os sistemas de controle estÃ£o cada vez mais presentes nas diversas Ã¡reas do conhecimento, logo hÃ¡ necessidade da aplicaÃ§Ã£o prÃ¡tica das teorias discutidas em sala de aula. Tendo em vista a necessidade de ensinar tÃ©cnicas de controle digital para futuros profissionais de engenharia nas Ã¡reas de controle e automaÃ§Ã£o, faz-se necessÃ¡rio o desenvolvimento de plantas didÃ¡ticas aplicadas ao ensino de tÃ©cnicas de controle apresentadas em sala de aula, simulando processos industriais com suas reais dificuldades. O presente trabalho tem como objetivo desenvolver uma planta de controle didÃ¡tica que possibilite Ã  aplicaÃ§Ã£o prÃ¡tica dos controladores simulados.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/figueiredo-carmo-gomes-mota-2019-desenvolvimento-de-hardware-didatico-para-ensino-de-controle-digital.pdf"
        },
        {
          "title": "Desenvolvimento de um robÃ´ manipulador do tipo SCARA",
          "authors": "Victor Eduardo Alves da Silva Carvalho, NÃ¡dia Raquel Matos Oliveira, JosÃ© Maria Pires Menezes Junior",
          "doi": null,
          "abstract": "Ã‰ indiscutivel a importÃ¢ncia da RobÃ³tica e seu papel em inÃºmeras aplicaÃ§Ãµes, desde o seu envolvimento em aplicaÃ§Ãµes na Ã¡rea da saÃºde (BONATTI, 2014) Ã  Ã¡rea militar (ACKERMAN, 2015). Uma ramificaÃ§Ã£o importante da mesma, Ã© o estudo de robÃ´s manipuladores, que possuem a capacidade de manusear objetos e realizar operaÃ§Ãµes de forma mais rÃ¡pida e precisa que um ser humano. O uso deste tipo de robÃ´, em ambientes industriais, Ã© imprescindÃ­vel para eficiÃªncia da produÃ§Ã£o, por exemplo (AHRENS, 2012). Com isso, Ã© importante o estudo do mesmo e realizar a modelagem matemÃ¡tica e implementaÃ§Ã£o via simulaÃ§Ã£o. Assim, propÃµe-se a modelagem e simulaÃ§Ã£o da cinemÃ¡tica de um robÃ´ manipulador com estrutura fisica baseado no manipulador SCARA (Selective Compliance Assembly Robot Arm). RobÃ´s do tipo SCARA sÃ£o utilizados na indÃºstria por serem precisos, compactos e apresentarem um excelente rendimento em atividades repetitivas.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/carvalho-oliveira-pires-2019-desenvolvimento-de-um-robo-manipulador-do-tipo-scara.pdf"
        },
        {
          "title": "Projeto de um controlador PID aplicado a um tanque de nÃ­vel didÃ¡tico",
          "authors": "Vanessa dos Santos ConceiÃ§Ã£o, JosÃ© Medeiros de AraÃºjo JÃºnior",
          "doi": null,
          "abstract": "Em projeto de sistemas de controle Ã© necessÃ¡rio o modelo matemÃ¡tico do processo a ser controlado. Como os modelos sÃ£o obtidos, inicialmente, na forma de equaÃ§Ãµes diferenciais, normalmente faz-se o uso da Transformada de Laplace para se ter uma representaÃ§Ã£o mais prÃ¡tica, devido a sua vantagem de facilitar o entendimento em relaÃ§Ã£o ao desempenho, resposta do sistema e atÃ© anÃ¡lise de estabilidade obtida graficamente (FRANKLIN, 2013). Com essa transformada, as EDO's, que sÃ£o funÃ§Ãµes no domÃ­nio do tempo, sÃ£o convertidas para funÃ§Ãµes onde o domÃ­nio sÃ£o variÃ¡veis complexas, e essa representaÃ§Ã£o Ã© denominada de FunÃ§Ã£o de TransferÃªncia. Por meio dessas funÃ§Ãµes, pode-se verificar se o sistema apresenta dinÃ¢mica lenta, resposta oscilatÃ³ria e erro em relaÃ§Ã£o Ã s condiÃ§Ãµes desejadas aplicadas na entrada (ROSARIO, 2009), (OGATA, 1998). Com base em tÃ©cnicas da teorÃ­a de controle, este trabalho apresenta a modelagem de um sistema de tanques de nÃ­vel, bem como a sua anÃ¡lise em malha fechada, de tal forma a se verificar quantitativamente a sua dinÃ¢mica, e a partir dessas informaÃ§Ãµes, realizar o projeto de um controlador PID, utilizando o mÃ©todo LGR (Lugar GeomÃ©trico das RaÃ­zes). A inclusÃ£o desse controlador visa melhorar a dinÃ¢mica do sistema, fazendo com que o mesmo apresente uma resposta satisfatÃ³ria, possibilitando a sua melhor aplicaÃ§Ã£o em processos industriais.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/conceicao-medeiros-2019-projeto-de-um-controlador-pid-aplicado-em-um-tanque-de-nivel-didatico.pdf"
        },
        {
          "title": "Sistema de acionamento para incubadora neonatal",
          "authors": "Raimundo da Silva Nunes Neto, Gabryel Figueiredo Soares, OtacÃ­lio da Mota Almeida",
          "doi": null,
          "abstract": "Incubadoras Neonatais sÃ£o equipamentos hospitalares de suma importÃ¢ncia para a manutenÃ§Ã£o da vida de bebÃªs rescÃ©m-nascidos prematuros e com problemas de saÃºde. Esses equipamentos sÃ£o responsÃ¡veis por proporcionar um ambiente termoneutro para o neonato, que ao nascer possuem limitada capacidade de reagir a situaÃ§Ãµes adversas (SILVADO, 1993), nescessita que haja um controle rigorosos dos parÃ¢metros de umidade, temperatura e fluxo de ar do ambiente. No presente trabalho Ã© abordado o desenvolvimento de um hardware base, que satisfaz as determinaÃ§Ãµes da NBR IEC 60601-2-19, para o acionamento de um Incubadora Neonatal presente no laboratÃ³rio de Controle e TelecomunicaÃ§Ãµes do Curso de Engenharia ElÃ©trica - UFPI. Com o hardware, Ã© possivel aferir dados de temperatura e umidade do ambiente, e dessa forma, facilitar a implementaÃ§Ã£o de diversas tÃ©cnicas de controle, a fim de manter, de forma rigorosa, os padrÃµes estabelecidos para os parÃ¢metros dentro da incubadora.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol1/nunes-figueiredo-mota-2019-sistema-de-acionamento-para-incubadora-neonatal.pdf"
        }
      ]
    }
  ]
}
``n

### Arquivo: .\data\proceedings\vol_2_2025.json
`$Lang
{
  "id": "vol_2_2025",
  "title": "Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI) Vol. 2 2025",
  "year": 2025,
  "cover_img": "simcompi/simcompi_2/ii-simcompi-capa-anais.png",
  "full_pdf_link": "vol2/vol2_complete_simcompi.pdf",
  "categories": [
    {
      "name": "Desenvolvimento de ferramentas computacionais",
      "articles": [
        {
          "title": "SimulaÃ§Ã£o MATLAB de controle psicromÃ©trico aplicado a sistemas de refrigeraÃ§Ã£o",
          "authors": "Ãlvaro Barreto da Silva, Lucas Rodrigues Soares da Silva",
          "doi": null,
          "abstract": "A psicrometria, o ramo focado no estudo das propriedades fÃ­sicas do ar Ãºmido, Ã© muito relevante para a engenharia de climatizaÃ§Ã£o. A psicrometria possibilita o estudo e o controle de variÃ¡veis psicromÃ©tricas bÃ¡sicas para manter o conforto tÃ©rmico e a economia de energia em sistemas de ar condicionado. Ã€ medida que ambientes climatizados se tornam cada vez mais necessÃ¡rios em paÃ­ses tropicais e diante das questÃµes e imprecisÃµes associadas Ã  leitura manual das cartas psicromÃ©tricas, a aplicaÃ§Ã£o de simulaÃ§Ã£o computacional aparece como uma alternativa avanÃ§ada e precisa. Com base nesse raciocÃ­nio, este trabalho sugere o emprego do MATLAB para modelar e simular os processos de desumidificaÃ§Ã£o e resfriamento, a fim de oferecer uma ferramenta intuitiva e estÃ¡vel para o controle de sistemas HVAC.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/barreto-rodrigues-2025-simulacao-em-matlab-de-controle-psicrometrico-aplicado-a-sistemas-de-refrigeracao.pdf"
        },
        {
          "title": "Desenvolvimento do sistema de monitoramento de grandezas elÃ©tricas em mÃ¡quinas eletromecÃ¢nicas",
          "authors": "JoÃ£o Ferreira Borges Filho, OtacÃ­lio da Mota Almeida, Raphael Lima de Paiva",
          "doi": null,
          "abstract": "A procura do mercado por tÃ©cnicas de controle industrial tem crescido bastante nos Ãºltimos 20 anos [15]. Contudo, ainda nÃ£o Ã© possÃ­vel determinar, de maneira trivial, quando esses mÃ©todos irÃ£o compensar uma carga computacional mais robusta e podem trazer de fato, melhorias de desempenho que as estruturas mais simples de controle [16]. O controlador PID Ã© atualmente a estrutura de controle mais empregada em sistemas industriais. Tal fato decorre de sua rapidez de atuaÃ§Ã£o, simplicidade e eficiÃªncia no controle de processos [20]. Este projeto de pesquisa visa dar continuidade na modernizaÃ§Ã£o e comissionamento das plantas experimentais disponÃ­veis no LaboratÃ³rio do Grupo de RobÃ³tica, AutomaÃ§Ã£o e Sistemas Inteligentes (GRASI) do Curso de Engenharia ElÃ©trica da UFPI desenvolver aprofundamentos nos algoritmos de identificaÃ§Ã£o e controle, incluindo o Auto-Ajuste dos controladores PID, o Controle Inteligente, o Controle PID e Preditivo. SerÃ£o dado continuidade na melhoria e modernizaÃ§Ã£o do tÃºnel de levitaÃ§Ã£o a ar com fris e o tanque duplo multivariÃ¡vel acoplado e do torno mecÃ¢nico Veker TVK-1660ECO. Contudo, a automaÃ§Ã£o industrial vem para ajudar na sociedade, e o seu uso tem inÃºmeras vantagens, como por exemplo: operadores humanos com tarefas de trabalhos pesadas ou monÃ³tonas podem ser substituÃ­dos; operadores humanos que exercem atividades perigosas, como temperaturas extremas, atmosferas radioativas, ou equipamentos cortantes. O manuseio de cargas grandes e pesadas, a manipulaÃ§Ã£o de equipamentos minÃºsculos, entre outros.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/borges-mota-paiva-2025-desenvolvimento-do-sistema-de-monitoramento-das-grandezas.pdf"
        }
      ]
    },
    {
      "name": "Nanotecnologia",
      "articles": [
        {
          "title": "Propriedades eletrÃ´nicas de tripentafenos retangulares dopados com nitrogÃªnio",
          "authors": "Lourdes Maria de Oliveira Santos, Eduardo Costa GirÃ£o",
          "doi": null,
          "abstract": "Nos Ãºltimos anos, o ramo da nanociÃªncia tem se desenvolvido substancialmente no mundo acadÃªmico, ganhando uma posiÃ§Ã£o de destaque, sob a luz de grande interesse pela comunidade cientÃ­fica (MacÃ©do, et al, 2022; Kumar, Yadav, Prasad, 2023; Silva, et al, 2020; Silva, et al, 2022; Van Noorden, 2011; Vega, Saillard, 2007; Zeng, et al, 2020) e de altos investimentos pelas industrias. As nanoetruturas apresentam aplicaÃ§Ãµes em variadas Ã¡reas como medicina, eletrÃ´nica, ciÃªncia dos materiais, energia, aeroespacial, automotiva, ambiental e entre outros, uma vez que tÃªm apresentado uma alta capacidade de otimizar processos nesses Ã¢mbitos. O conhecimento existente acerca das nanoestruturas jÃ¡ nos proporciona tÃ©cnicas e procedimentos, bem como a criaÃ§Ã£o de equipamentos como o microscÃ³pio de varredura por tunelamento, para a manipulaÃ§Ã£o, produÃ§Ã£o e estudo das mesmas. No entanto, Ã© necessÃ¡rio que mais conhecimento seja produzido na Ã¡rea a fim de proporcionar uma produÃ§Ã£o efetiva, em larga escala, baixo custo e sustentÃ¡vel de nanomateriais, assim como utiliza-los em aplicaÃ§Ãµes especÃ­ficas, como nos circuitos presentes em chips, de modo que possam competir comercialmente com outros materiais dominantes no mercado global, como o silÃ­cio. Este trabalho tem como objetivo investigar alteraÃ§Ãµes na estrutura eletrÃ´nica de um tripentafeno de rede retangular, alÃ³tropo do carbono bidimensional baseado na concatenaÃ§Ã£o direta de molÃ©culas de acepentaleno, mediante dopagens substitucionais com nitrogÃªnio.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/oliveira-girao-2025-propriedades-eletronicas-de-tripentafenos-retangulares-dopados-com-nitrogenio.pdf"
        }
      ]
    },
    {
      "name": "Modelagem e IdentificaÃ§Ã£o de Sistemas",
      "articles": [
        {
          "title": "Modelagem computacional de um sistema de minigeraÃ§Ã£o agrivoltaica em uma granja no estado do PiauÃ­",
          "authors": "Atos A. S. Borges, Juan de A. GonÃ§alves, Thiago M. S. Rocha, Ãtalo F. e Silva",
          "doi": null,
          "abstract": "Os sistemas agrivoltaicos (AgroPV) emergem como uma soluÃ§Ã£o inovadora e sustentÃ¡vel para a integraÃ§Ã£o de produÃ§Ã£o de energia fotovoltaica com a agricultura. Esses sistemas combinam a geraÃ§Ã£o de eletricidade a partir da radiaÃ§Ã£o solar com o uso do mesmo espaÃ§o fÃ­sico para atividades agrÃ­colas, tanto vegetais como animais, otimizando o uso de recursos naturais, como a luz solar e o espaÃ§o disponÃ­vel (GOETZBERGER; ZASTROW, 1982; DINESH; PEARCE, 2016). No contexto da avicultura, a associaÃ§Ã£o de sistemas fotovoltaicos Ã  criaÃ§Ã£o de aves tem se mostrado promissora (VIDOTTO et al., 2024). Como o desenvolvimento tecnolÃ³gico crescente dos empreendimentos de avicultura, o setor vem continuamente aumentando sua demanda pelo consumo de energia elÃ©trica. AutomatizaÃ§Ã£o de produÃ§Ã£o, controle climÃ¡tico das plantas de produÃ§Ã£o e produÃ§Ãµes em maior escala sÃ£o fatores que contribuem diretamente para o aumento do consumo de energia elÃ©trica desse tipo de produÃ§Ã£o (HANDLER; PEARCE, 2022). O presente trabalho propÃµe a modelagem tridimensional e simulaÃ§Ã£o de um empreendimento agrivoltaico de minigeraÃ§Ã£o fotovoltaica aliada a uma indÃºstria privada de avicultura. O objetivo do estudo Ã© construir um modelo virtual para avaliar o potencial de geraÃ§Ã£o de energia elÃ©trica, analisando a presenÃ§a e o impacto de sombreamentos, dimensionamento de perdas elÃ©tricas, perdas de irradiÃ¢ncia e mÃ©tricas de performance de geraÃ§Ã£o. O estudo Ã© baseado em um caso prÃ¡tico em desenvolvimento a partir da parceria entre o NÃºcleo de FormaÃ§Ã£o e Pesquisa em Energias RenovÃ¡veis e TelecomunicaÃ§Ãµes do PiauÃ­ (NUFPERPI) e uma empresa do setor privado de energia renovÃ¡vel.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/borges-goncalves-rocha-silva-2025-modelagem-computacional-de-um-sistema-de-minigeracao-agrivoltaica-em-um-empreendimento-de-avicultura-no-estado-do-piaui.pdf"
        },
        {
          "title": "IdentificaÃ§Ã£o e controle dos motores de um robÃ´ micromouse diferencial",
          "authors": "HÃ¤ndel Mateus Carvalho Sarmento, Otacilio da Mota Almeida",
          "doi": null,
          "abstract": "Os robÃ´s solucionadores de labirintos surgiram na dÃ©cada de 1950 como dispositivos autÃ´nomos e compactos, e, desde os anos 1970, competiÃ§Ãµes de micromouses se tornaram populares, especialmente no Reino Unido e no JapÃ£o, conforme pode ser visto na Figura 1. A competiÃ§Ã£o envolve robÃ´s mÃ³veis autÃ´nomos (Figura 2) para resolver um labirinto composto de 16x16 cÃ©lulas de 180x180 mmÂ². A padronizaÃ§Ã£o da competiÃ§Ã£o foi introduzida pela revista do IEEE Spectrum em 1977. O robÃ´ tem um tempo limitado para resolver um labirinto, cuja configuraÃ§Ã£o Ã© estabelecida no inÃ­cio da competiÃ§Ã£o. O robo tem como objetivo sair de um dos cantos do labirinto e alcanÃ§ar o centro no menor tempo possivel. O autoÃ´mato Ã© pontuado de acordo com trÃªs parÃ¢metros: velocidade, eficiÃªncia em resolver labirinto, e confiabilidade do Micromouse. O desenvolvimento desses robÃ´s envolve etapas essenciais, sendo o controle e a automaÃ§Ã£o fundamentais para otimizar a navegaÃ§Ã£o. Este trabalho foca no controle simulado de percursos em linha reta para o micromouse do LaboratÃ³rio de Controle e AutomaÃ§Ã£o da Engenharia ElÃ©trica UFPI apresentado na Figura 2, ajustando independentemente as velocidades lineares de suas rodas para melhorar a eficiÃªncia dos deslocamentos.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/sarmento-mota-2025-identificacao-e-controle-dos-motores-de-um-robo.pdf"
        },
        {
          "title": "Regulador de Fluxo Diafragma-Ãris para AplicaÃ§Ã£o em uma Planta DidÃ¡tica de LevitaÃ§Ã£o a Ar",
          "authors": "JoÃ£o Marcos V. A. M. Silva, Douglas de AraÃºjo FranÃ§a, OtacÃ­lio da Mota Almeida",
          "doi": null,
          "abstract": "A engenharia necessita de experimentos prÃ¡ticos na formaÃ§Ã£o de engenheiros, sendo essencial o estudo e prÃ¡tica em sistemas protÃ³tipos com problemas dinÃ¢micos para modelagem e adequaÃ§Ã£o matemÃ¡tica, garantindo a capacidade teÃ³rica e prÃ¡tica de tomada de decisÃµes (Chacon et al., 2017). Nos cursos de engenharia elÃ©trica, especialmente em controle e automaÃ§Ã£o de sistemas dinÃ¢micos, a experimentaÃ§Ã£o conecta teoria e prÃ¡tica, e a construÃ§Ã£o de uma planta didÃ¡tica assegura essa conexÃ£o. A adiÃ§Ã£o de uma planta de levitaÃ§Ã£o a ar inspirada nos estudos de ChoÅ‚odowicz e Orlowski (2017) e Chacon et al. (2017), junto a um inÃ©dito regulador de fluxo para o LaboratÃ³rio de Controle Digital da Universidade Federal do PiauÃ­ traz consigo uma abordagem diferente das empregadas no laboratÃ³rio.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/silva-franca-mota-2025-regulador-de-fluxo-diafragma-iris-para-aplicacao-em-uma-planta-didatica-de-levitacao-a-ar.pdf"
        }
      ]
    },
    {
      "name": "Metamateriais",
      "articles": [
        {
          "title": "MitigaÃ§Ã£o passiva de frequÃªncias de vibraÃ§Ã£o em estruturas offshore",
          "authors": "Thierry Miqueias Melo Madeira, DÃ¡rio Carvalho Viveiros, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Offshore platforms operate in environments subject to constant wave action, which induces dynamic loads on structural components, particularly the support legs or tendons (Fig. la). These loads propagate as mechanical vibrations throughout the structure and may compromise its integrity, performance, and service life. Among passive vibration mitigation strategies, periodic structures have attracted increasing interest due to their ability to generate band gaps specific frequency ranges where the propagation of waves is naturally attenuated. This behavior is directly influenced by the geometry and material distribution along the structure (Fig. 1b). This study investigates the vibrational behavior of stepped and bimaterial periodic beams, focusing on how geometric variations influence wave attenuation.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/melo-viveiros-hoefel-2025-passive-mitigation-of-vibration-frequencies-on.pdf"
        },
        {
          "title": "Estruturas periÃ³dicas para atenuaÃ§Ã£o de vibraÃ§Ãµes em trilhos",
          "authors": "Iasmin BrandÃ£o Leal, JenÃ¡rio Souza dos Reis JÃºnior, Profa. Dra. Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Railway tracks are subject to dynamic loads that generate vibrations in rails, ballast, and underlying structures. These vibrations can cause noise, accelerate maintenance needs, and affect nearby infrastructure. Periodic structures offer a passive solution by creating band gaps - frequency ranges where wave propagation is suppressed. In rail systems, such effects can be achieved using components like pads or dampers with varying mass and stiffness. This study analyzes how changes in the mass ratio between adjacent elements influence the formation and width of the first band gap, using analytical models and Wave Finite Element Method (WFEM) simulations.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/brandao-reis-hoefel-2025-periodic-structures-for-vibration-attenuation-in-tracks.pdf"
        },
        {
          "title": "Paredes superficiais periÃ³dicas para atenuaÃ§Ã£o de vibraÃ§Ãµes no solo",
          "authors": "Jenario Souza dos Reis JÃºnior, Profa. Dra. Simone dos Santos Hoefel, Prof. Dr. JosuÃ© Labaki",
          "doi": null,
          "abstract": "Ground vibrations caused by construction, traffic, earthquakes, and other external sources can compromise structural integrity and disturb the operation of sensitive equipment, such as particle accelerators. These facilities demand efficient vibration mitigation strategies to ensure stability and precision. Among the proposed solutions, surface walls (Carneiro et al., 2022) and periodic walls stand out for their ability to reflect and absorb vibrational energy, increasing structural resilience to dynamic disturbances In this work, the interaction between a novel model of periodic walls and the soil is analyzed using a coupled formulation based on the Indirect Boundary Element Method (IBEM) and the Finite Element Method (FEM), the IBEM-FEM coupling scheme. FEM is used to model the walls and IBEM is employed to modeled the soil. To represent a substantial range of phenomena relevant to geotechnical and seismic engineering practice, the proposed models account for ground vibration induced by Rayleigh waves.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/reis-hoefel-labaki-2025-periodic-surface-walls-for-ground-vibration-attenuation.pdf"
        },
        {
          "title": "PropagaÃ§Ã£o de ondas em trilhos ferroviÃ¡rios periÃ³dicos: anÃ¡lise de flexÃ£o lateral e vertical",
          "authors": "Isadora Rodrigues de Souza, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "Vibrations in railway tracks, resulting from wheel-rail interactions, can lead to structural damage, passenger discomfort, and environmental disturbances. Periodic structures offer a promising solution by generating bandgaps frequency ranges that inhibit wave propagation which can be classified into two types: Bragg scattering bandgaps (BSBG) and local resonance bandgaps (LRBG). This work analyzes a periodic rail track with uniformly spaced supports, using the Wave and Finite Element Method, which combines finite element modeling with Floquet-Bloch theory to analyze periodic structures. The influence of variations in sleeper spacing and pad stiffness on the attenuation of vertical and lateral bending waves is investigated through dispersion curves, which describe the correlation between angular frequency and propagation constants (DOS REIS; DE SOUZA; HOEFEL, 2024).",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/rodrigues-hoefel-2025-wave-propagation-in-periodic-railway-tracks-lateral-and-vertical-bending-analysis.pdf"
        }
      ]
    },
    {
      "name": "Estruturas Offshore e Engenharia PetrolÃ­fera",
      "articles": [
        {
          "title": "Modelagem numÃ©rica de Partially Submerged Beam-column",
          "authors": "Davi KauÃª de Sousa Gomes, Simone dos Santos Hoefel",
          "doi": null,
          "abstract": "The offshore industry often employs excessive structural material due to the unpredictable nature of the marine environment (Fig. 1). Submerged structures are subject to various hydrodynamic forces, including drag, inertia, added mass, diffraction, Froude-Krylov, and wave slamming forces. This study aims to contribute to reducing over-dimensioning, thereby lowering manufacturing costs and CO2 emissions. The Morison equation is applied to estimate wave-induced forces, and the structure is modeled using a beam-column element.",
          "keywords": "NÃ£o informadas",
          "pdf": "vol2/gomes-hoefel-2025-numerical-modeling-of-partially-submerged-beam-column.pdf"
        }
      ]
    }
  ]
}
``n

### Arquivo: .\data\proceedings\vol_3_2027.json
`$Lang
{
  "id": "vol_3_2027",
  "title": "Anais do SimpÃ³sio de Modelagem Computacional em CiÃªncia e Tecnologia do PiauÃ­ (SIMCOMPI) Vol. 3 2027",
  "year": 2027,
  "cover_img": "simcompi/simcompi_3/iii-simcompi-capa-anais.png",
  "full_pdf_link": "",
  "categories": []
}
``n

### Arquivo: .\data\event_info.json
`$Lang
{
  "dates": {
    "abstract_deadline": "15/06/2026",
    "abstract_acceptance": "20/07/2026",
    "full_paper_open": "21/07/2026",
    "full_paper_deadline": "10/10/2026",
    "full_paper_acceptance": "01/12/2026",
    "revised_version": "15/12/2026",
    "symposium": "22 a 24 de marÃ§o de 2027"
  },
  "committees": {
    "general": [
      {"name": "Simone dos Santos Hoefel", "institution": "UFPI"}
    ],
    "organizing": [
      {"name": "Simone dos Santos Hoefel", "institution": "UFPI"},
      {"name": "Bruna Silveira Lira", "institution": "UFPI"},
      {"name": "Wallison Angelim Medeiros", "institution": "UFPI"}
    ],
    "scientific": [
      {"name": "Adriano Todorovic Fabro", "institution": "UNB"},
      {"name": "Anderson Soares da Costa AzevÃªdo", "institution": "USP"},
      {"name": "Daniel Candeloro Cunha", "institution": "UNICAMP"},
      {"name": "Ediman Dias Novo", "institution": "UFPI"},
      {"name": "Eduardo Martins Fontes Do RÃªgo", "institution": "UFPI"},
      {"name": "Francisco Wellington Dourado Rebelo", "institution": "UFPI"},
      {"name": "HÃ©lio De Paula Barbosa", "institution": "UFPI"},
      {"name": "LaÃ­s Bittencourt Visnadi", "institution": "UNB"},
      {"name": "MÃ¡rcio Davi TenÃ³rio Correia Alves", "institution": "UFPI"},
      {"name": "Waydson Martins Ferreira", "institution": "UFPI"}
    ]
  }
}
``n

### Arquivo: .\data\publications.json
`$Lang
{
    "journal_papers": [
        {
            "title": "Dynamic Analysis of Elastically Supported Timoshenko Beam.",
            "details": "Revista Interdisciplinar de Pesquisa em Engenharia, v.2, p. 71-85, 2017.",
            "pdf_link": "publications/azevedo-vasconcelos-hoefel-2016-dynamic-analysis-of-elastically-supported-timoshenko-beam.pdf",
            "authors": "Anderson Soares da Costa AzevÃªdo, Ana Carolina Azevedo Vasconcelos, Simone dos Santos Hoefel",
            "abstract": "The flexible beams carrying attachments and ends elastically restrained against rotational and translation inertia often appear in engineering structures, modal analysis of those structures is important and necessary in structural design. In case of structure with large aspect ratio of height and length the Timoshenko beam theory (TBT) is used, instead of the Euler-Bernoulli theory (EBT), since it takes both shear and rotary inertia into account. Shear effect is extremely large in higher vibration modes due to reduced mode half wave length. In this paper, the full development and analysis of TBT for transversely vibrations uniform beam are presented for elastically supported ends. A two-node beam element with two degree of freedom per node is obtained based upon Hamiltonâ€™s principle. The influence of stiffnesses of the supports on the free vibration characteristics is investigated. For this purpose, the eigenvalues of the Timoshenko beam are calculated for various rigidity values of translational and rotational springs. The results obtained are discussed and compared with results obtained by other researchers.",
            "doi": "https://doi.org/10.26512/ripe.v2i34.21809"
        },
        {
            "title": "Finite Element Analysis of Shear-Deformation and Rotatory Inertia for Beam Vibrations.",
            "details": "Revista Interdisciplinar de Pesquisa em Engenharia, v. 2, p. 86-103, 2017.",
            "pdf_link": "publications/vasconcelos-azevedo-hoefel-2016-finite-element-analysis-of-shear-deformation-and-rotatory-inertia-for-beam-vibrations.pdf",
            "authors": "Ana Carolina Azevedo Vasconcelos, Anderson Soares da Costa AzevÃªdo, Simone dos Santos Hoefel",
            "abstract": "Vibration analysis of a beam is an important subject of study in engineering. All real physical structures, when subjected to loads or displacements, behave dynamically. In case of structure with large aspect ratio of height and length the Timoshenko beam theory (TBT) is used, instead of the Euler-Bernoulli theory (EBT), since it takes both shear and rotary inertia into account. Shear effect is extremely large in higher vibration modes due to reduced mode half wave length. In this paper, the full development and analysis of TBT for the transversely vibrating uniform beam are presented for classical boundary condition. Finally, a finite element is developed in terms of dimensionless parameters of rotatory and shear. The stiffness and mass matrices for a two-node beam element with two degree of freedom per node is obtained based upon Hamiltonâ€™s principle. Cubic and quadratic Lagrangian polynomials are made interdependent by requiring them to satisfy both of the homogeneous differential equations associated with TBT. Numerical examples are given for some boundary conditions. The results showed that for frequencies above critical frequency, Timoshenko beams presents distinct mode shapes behavior including the presence of double eigenvalues, shear mode or remarkably modes.",
            "doi": "https://doi.org/10.26512/ripe.v2i34.21810"
        }
    ],
    "conference_papers": [
        {
            "title": "Numerical Analysis of Surface Walls for Ground Vibration Attenuation Using the Perfectly Matched Layer Method.",
            "details": "In: Proceedings of 28th International Congress of Mechanical Engineering - COBEM, 2025, Curitiba.",
            "pdf_link": "publications/rodrigues-reis-hoefel-morais-labaki-2025-numerical-analysis-of-surface-walls-for-ground-vibration-attenuation-using-the-perfectly-matched-layer-method.pdf",
            "authors": "Isadora Rodrigues de Souza, Jenario Souza dos Reis, Simone dos Santos Hoefel, Amanda Morais de Oliveira, JosuÃ© Labaki",
            "abstract": "The dynamic response of structures interacting with the soil is a topic of significant interest, as vibrations propagating through the soil can compromise the performance and safety of vibration-sensitive facilities. The damaging effects of ground-borne vibration can be mitigated with the installation of surface walls, provided adequate geometric and constitutive properties are selected for the walls. The effect of constitutive and geometric parameters of surface walls in their vibration attenuation performance can be analyzed using various numerical techniques. This work presents an analysis of the vibration attenuation performance of surface walls using the Perfectly Matched Layer (PML) method. The PML method, widely used in fields such as electromagnetism, acoustics, and elastodynamics, uses a complex coordinate stretching formulation of energy-absorbing layers that can be incorporated into the boundaries of finite domains. These layers effectively absorb incident waves at any angle and frequency, thereby minimizing reflections at the model boundaries. The incorporation of these energy-absorbing layers causes finite domains to behave as unbounded domains, in the sense that they comply with Sommerfeld's radiation condition. Hence, the PML is an effective way to obtain an accurate representation of unbounded domains, like the soil, while using classical finite domain discretizations. This method is used in this paper to model the response of various configurations of surface walls interacting with the soil. Numerical results show excellent agreement with reference solutions, confirming the accuracy of the PML modeling. Additional simulations are performed to assess the influence of depth of wall embedment on ground vibration attenuation. The results demonstrate that partially buried walls enhance isolation performance and that increasing the depth of embedment shifts the insertion loss peak toward higher frequencies. The proposed formulation provides a reliable framework for analyzing dynamic soil-structure interaction problems involving vibration mitigation using embedded or surface structures.",
            "doi": "https://doi.org/10.26678/ABCM.COBEM2025.COB2025-0446"
        },
        {
            "title": "An Ibem-fem Model Of Multiple Surface Walls For Ground Vibration Attenuation.",
            "details": "In: Proceedings of 28th International Congress of Mechanical Engineering - COBEM, 2025, Curitiba.",
            "pdf_link": "publications/reis-rodrigues-hoefel-labaki-2025-an-ibem-fem-model-of-multiple-surface-walls-for-ground-vibration-attenuation.pdf",
            "authors": "Jenario Souza dos Reis JÃºnior, Isadora Rodrigues de Souza, Simone dos Santos Hoefel, JosuÃ© Labaki",
            "abstract": "Surface walls have been presented as an effective strategy to attenuate ground vibration and protect vibration-sensitive facilities. This attenuation is based on properties of the walls as locally-resonant bodies, the attenuation effectiveness of which is maximized at their natural bending and compression frequencies. This paper presents a numerical analysis of the effectiveness of a series of surface walls in attenuating ground vibration and modifying wave propagation in the soil. The model uses a classical Finite Element Method (FEM) formulation to represent the surface walls, coupled with Indirect Boundary Element Method (IBEM) formulation to accurately represent the soil as an unbounded, wave-propagating medium. Seismic excitation is represented by Rayleigh waves propagating along the surface of the soil. The results show that the spacing between the walls and the number of walls significantly influence the attenuation of ground vibrations induced by Rayleigh waves.",
            "doi": "https://doi.org/10.26678/ABCM.COBEM2025.COB2025-0341"
        },
        {
            "title": "Influence of Buried Foundations on the Ground Vibration Attenuation Performance of Surface Walls.",
            "details": "In: Proceedings of XX International Symposium on Dynamic Problems of Mechanics - DINAME, 2025, Ãguas de LindÃ³ia.",
            "pdf_link": "publications/reis-hoefel-labaki-2025-influence-of-buried-foundations-on-the-ground-vibration-attenuation-performance-of-surface-walls.pdf",
            "authors": "Jenario dos Santos Reis Junior, Simone dos Santos, Josue Labaki",
            "abstract": "This paper investigates the influence of buried foundations on the ground vibration attenuation performance of surface walls. Using a coupled IBEM-FEM model, we analyze the effects of a partially buried wall subjected to surface waves. The results show that embedding the wall alters its vibration attenuation performance by affecting its ability to scatter surface waves into bulk waves. These findings provide valuable insights for designing vibration mitigation solutions in environments where ground vibration is a concern.",
            "doi": "https://doi.org/10.26678/ABCM.DINAME2025.DIN2025-0072"
        },
        {
            "title": "Flexural Wave Propagation Analysis of a Locally Resonant Beam.",
            "details": "In: Proceedings of XII Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2024, Fortaleza.",
            "pdf_link": "publications/reis-rodrigues-hoefel-2024-flexural-wave-propagation-analysis-of-a-locally-resonant-beam.pdf",
            "authors": "Jenario Souza dos Reis JÃºnior, Isadora Rodrigues de Souza, Simone dos Santos Hoefel",
            "abstract": "Metamaterials have become a topic of considerable interest in the scientific and engineering communities in recent decades. Such artificially designed structures offer innovative solutions to complex problems related to wave propagation and vibration control, and have enormous potential for applications in various engineering fields. A topic that has received considerable attention in recent years is the ability to enhance emerging bandgaps due to Bragg scattering and local resonance, and thus improve the wave filtering ability of metamaterials. The present article proposes to analyze a locally resonant Euler-Bernoulli beam that is coupled to a large number of resonators with multiple degrees of freedom that are periodically distributed throughout the structure in order to increase the areas where wave attenuation is observed. Wave and Finite Element Method is applied in order to obtain the dispersion relation for wave propagation for the analysis of wave attenuation mechanisms. The results indicate the pronounced presence of Bragg scattering bandgaps and local resonance bandgaps. The influence of increasing the number of resonators is analyzed, resulting in an increase in the number of bandgaps. Effects of varying the length of the periodic unit on the attenuation property are also investigated. An increase of this parameter leads to an increment of the maximum attenuation coefficient and a new bandgap of the Bragg scattering is observed. In addition, the bandgap behavior is examined when the periodicity due to the presence of resonators is harmonized with the material periodicity, resulting from the use of two materials per unit cell. Finally, the vibration transmittance is determined by means of the classical Finite Element Method. The results of the vibration transmission show that the wave attenuation appears in the same frequency bands as those obtained by the Wave and Finite Element Method, which corroborates the efficient wave filtering performance of the locally resonant metamaterial beam.",
            "doi": "https://doi.org/10.26678/ABCM.CONEM2024.CON24-1502"
        },
        {
            "title": "Analysis Comparing the Pierson-Moskowitz and Bretschneider Spectra for the Morison Equation.",
            "details": "In: Proceedings of XII Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2024, Fortaleza.",
            "pdf_link": "publications/gomes-azevedo-hoefel-2024-analysis-comparing-the-pierson-moskowitz-and-bretschneider-spectra-for-the-morison-equation.pdf",
            "authors": "Davi KauÃª de Sousa Gomes, Anderson Soares da Costa Azevedo, Simone dos Santos Hoefel",
            "abstract": "Most wind power is generated on onshore structures, but in the last ten years, offshore wind turbines have gained prominence due to their superior wind quality and abundance of space in the ocean environment. This increase in demand for offshore structures show the importance of understanding how these facilities respond to the maritime environment. Recent studies have focused on analyzing the impact of loads from wind, currents and waves, highlighting the need for a precise formulation for each component of these forces. This article focuses on the elaboration of the distributed transverse fluid load, employing the semi-empirical equation developed by Morison to model the in-plane fluid force. The out-of-plane force, exemplified by the shedding of vortices, is approached in a simplified way, taking the form of a sine wave. To achieve this objective, random waves are modeled by the Airy linear wave theory, incorporating both the Pierson-Moskowitz (P-M) spectrum, Bretschneider spectrum, while also applying the central limit theorem. The P-M spectrum consideres only one parameter, the wind velocity, which can be interpreted as the significant wave height, whereas the Bretschneider spectrum incorporates two parameters, additionally considering the duration of the wind. This approach not only enables the accurate reproduction of wave profiles in the spatial and temporal domains, but also allows the observation of striking surface effects in shallow waters, contrasting with the smoother profiles in deep waters. Is numerically demonstrated that the wave profile curve shifts for both spectra as a result of the newly added parameter. This methodology facilitates the assessment of wave speeds in relation to depth. The evaluation of the out-of-plane force revealed it to be insignificant in situations of low Reynolds numbers, but it becomes noticeable at high Reynolds numbers, leading to oscillation of the fluid close to the structure due to the vortices. Finally, improvements in predicting this oscillation aid in preventing natural frequencies synchronization with shed vortices that could lead to structural collapse.",
            "doi": "https://doi.org/10.26678/ABCM.CONEM2024.CON24-1469"
        },
        {
            "title": "Dynamic Behavior of an Axially Loaded Timoshenko Beam on Elastic Foundation and Second Spectrum Analysis.",
            "details": "In: Proceedings of XI Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2022, Teresina.",
            "pdf_link": "publications/siqueira-cortez-hoefel-2022-dynamic-behavior-of-an-axially-loaded-timoshenko-beam-on-elastic-foundation-and-second-spectrum-analysis.pdf",
            "authors": "Lucas Oliveira Siqueira, Romulo Luz Cortez, Simone dos Santos Hoefel",
            "abstract": "The dynamic behavior of systems subject to soil-structure interaction is of great importance in civil engineering. Among the applications of this multiphysics problem can be highlighted railroad tracks, highway pavement, continuously supported pipelines and strip foundations. In this context, the aim of this paper is to use the vibration analysis by finite element method to study the behavior and the second spectrum of uniform beams supported on two-parameter elastic foundation. The first foundation parameter is modeled using linear springs similar to the Winkler foundation and the second foundation parameter is modeled as a shear layer as a function of the total slope of the beam. The effects of axial force, foundation stiffness parameters, transverse shear deformation and rotatory inertia are incorporated into the accurate vibration analysis. The motion equation is derived using Hamiltonâ€™s variational principle based on the finite element Method (FEM). A finite element is developed by means of the Rayleigh-Ritz using a cubic and quadratic approximated polynomial. The finite element and the analytic solutions are compared to verify the accuracy of the method in this kind of problem. The results obtained are discussed and compared with results obtained by other researchers. The rotary inertia parameter, the axial load parameter and the foundation stiffness influence in the frequency parameter are investigated. The results showed that the axial load decrease the frequency parameter and the foundation increase the frequency parameter. The second spectrum was studied for the hinged-hinged beam presenting a tiny difference for the addition of the foundation and the axial load. In addition, the second spectrum was not verified for the clamped-clamped beam, as expected. Finally, the finite element results present well agreement with the other researches results.",
            "doi": "https://doi.org/10.26678/ABCM.CONEM2022.CON22-0330"
        },
        {
            "title": "Free Vibration Analysis of a Tension Leg Platform Tendon.",
            "details": "In: Proceedings of XI Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2022, Teresina.",
            "pdf_link": "publications/pereira-abreu-hoefel-2022-free-vibration-analysis-of-a-tension-leg-platform-tendon.pdf",
            "authors": "JosÃ© Pereira Ramos Junior, Brendon Menezes de Abreu, Simone dos Santos Hoefel",
            "abstract": "The dynamic behavior in offshore structures is of great importance in the design, conception and operation phase, in order to predict failures, guarantee stability, safety and avoid environmental and financial impacts. An offshore structure consists of a fixing or support plot that departs from the sea soil to the surface of the water and connects to superstructures such as wind turbines, oil and natural gas platforms. In this article, the free vibration of a free-clamped uniform beam, similar to the tendons of a tension leg platform, is studied. Are evaluated beams not immersed and immersed in water, the influence of the dimensions of the cross-sectional and the contribution of the deck as an axial force applied at the free end. Four beam models, Euler-Bernoulli, Rayleigh's, Shear and Timoshenko are used to evaluate natural frequencies using the finite element method. To investigate the influence of axial load, natural frequencies are calculated for various percentages of critical load. The same material parameters are considered in the numerical examples. The results demonstrate that the frequencies obtained by Euler-Bernoulli, Rayleigh and shear surpass those obtained by the Timoshenko theory. In addition, the results indicate that the reduction of the cable cross-section, the influence of water and the contribution of the deck, decrease the natural frequencies of the tendons.",
            "doi": "https://doi.org/10.26678/ABCM.CONEM2022.CON22-0455"
        },
        {
            "title": "Fatigue Analysis of a Clamped Structure.",
            "details": "In: Proceedings of XXVIII Congresso Nacional de Estudantes de Engenharia MecÃ¢nica - CREEM, 2022, Santa Maria.",
            "pdf_link": "publications/pereira-hoefel-rodriguez-2022-fatigue-analysis-of-a-clamped-structure.pdf",
            "authors": "JosÃ© Pereira, Simone S. Hoefel, RenÃ© Q. Rodriguez",
            "abstract": "In engineering projects, specifically in the mechanical area, it is indispensable to consider how the loads act on the components, because they can present themselves in different ways and cause abrupt failures. Therefore, the study that promotes the development of safe structures and with a longer useful life, is of significant importance. In this work, using the modified Goodman criterion, fatigue damage is evaluated in a cantilever beam with a hole in the domain subjected to different load conditions. The formulation of the finite element method and the mentioned failure criterion are presented. The stress field is obtained using a linear quadrilateral element, with four nodes per element and two degrees of freedom per node. The results obtained in computer programming, show the effect of fatigue in the structure for three different load conditions, it is evidenced greater resistance to failure in application of distributed load and lesser resistance under oblique point load.",
            "doi": "https://doi.org/10.26678/ABCM.CREEM2022.CRE2022-0117"
        },
        {
            "title": "Fatigue Analysis Using the Finite Element Method.",
            "details": "In: Proceedings of XLII Ibero-Latin-American Congress on Computational Methods in Engineering - CILAMCE and III Pan-American Congress on Computational Mechanics - PANACM, 2021, Rio de Janeiro.",
            "pdf_link": "publications/pereira-rodriguez-hoefel-2021-fatigue-analysis-using-the-finite-element-method.pdf",
            "authors": "JosÃ© Pereira R. Junior, Rene Q. Rodriguez, Simone dos S. Hoefel",
            "abstract": "Fatigue failure analysis becomes a constant concern when intending to produce mechanical components subjected to alternating loads and stress concentration. Therefore, the study that provide the development of safe structures and with longer fatigue life proves to be of significant importance. This article presents the formulation of the finite element method applied to the fatigue problem in continuous structures from the modified Goodman, Gerber, and ASME-elliptic criteria. The stress field is obtained using a linear quadrilateral element, with four nodes per element and two degrees of freedom per node. It is considered two structures of optimized and non-optimized shape under boundary conditions of crimping and point loading at the free end. The numerical results obtained showed the effect of fatigue on the structures and among the various fatigue failure criteria. The modified Goodman criterion was more conservative, since it presented significantly higher results for the safety conditions considered, followed by the Gerber and, ASME-elliptic criteria, respectively.",
            "doi": "https://www.researchgate.net/publication/370857903"
        },
        {
            "title": "Vibration Analysis of an Axial-Loaded Euler-Bernoulli Beam on Two-Parameter Foundation.",
            "details": "In: Proceedings of XL Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2019, Natal.",
            "pdf_link": "publications/siqueira-cortez-hoefel-2019-vibration-analysis-of-an-axial-loaded-euler-bernoulli-beam-on-two-parameter-foundation.pdf",
            "authors": "Lucas Oliveira Siqueira, Romulo Luz Cortez, Simone dos Santos Hoefel",
            "abstract": "The studies of the Euler-Bernoulli beam on an elastic foundation is the basis for analysis of soil-structure interaction. In this paper is analyzed the free vibration of an Euler-Bernoulli beam resting on two-parameter foundation subject to an axial load. The frequency equations is obtained for several boundary conditions. A finite element is developed by mean of the Rayleigh-Ritz method using a cubic approximated polynomial. Numerical comparisons with others works are done for check the method accuracy for this kind of problem. The frequency parameters of the system and the mode shapes are obtained for classical and non-classical boundary conditions. Itâ€™s verified that the axial load decrease the frequency parameter and the foundation increase the frequency parameter.",
            "doi": "https://www.researchgate.net/publication/337110244"
        },
        {
            "title": "Nonlocal Finite Element Analysis for Free Vibration of Elastically Supported nanobeams.",
            "details": "In: Proceedings of XL Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2019, Natal.",
            "pdf_link": "publications/siqueira-hoefel-2019-nonlocal-finite-element-analysis-for-free-vibration-of-elastically-supported-nanobeams.pdf",
            "authors": "Aldemar P. Siqueira Neto, Simone dos Santos Hoefel",
            "abstract": "Nanobeams are nanoscale structures extensively used in nanotechnology applications. Due to the small scale effect, this nanostructures cannot be accurately modelled by traditional elastic theory. To overcome this difficulty, several continuous models including the material length scale effect were developed, like nonlocal elasticity theory. In this paper, a nonlocal finite element model for elastically supported Euler-Bernoulli (EBT) and Timoshenko (TBT) nanobeams is developed. Nonlocal differential constitutive equations of Eringen are considered to account for the small scale effect. The stiffness and mass matrices for a two-node nonlocal beam element with two degrees of freedom per node are obtained based upon Hamiltonâ€™s principle. The influence of nonlocal parameter, slenderness ratio and support stiffness on the free vibration characteristics is investigated. Numerical results obtained are discussed and compared with results obtained by other researchers.",
            "doi": "https://www.researchgate.net/publication/337317399"
        },
        {
            "title": "Dynamic Displacement and Strain Fields Within Trenched Soils: Post-Processing Quantities from Indirect-BEM's Ficticious Loads.",
            "details": "In: Proceedings of XL Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2019, Natal.",
            "pdf_link": "publications/carneiro-labaki-hoefel-barros-2019-dynamic-displacement-and-strain-fields-within-trenched-soils-post-processing-quantities-from-indirect-bems-ficticious-loads.pdf",
            "authors": "David A. S. Carneiro, Josue Labaki, Simone S. Hoefel, and Persio L. A. Barros",
            "abstract": "This work investigates time-harmonic strain and displacement fields within trenched soils through an Indirect-BEM (IBEM) approach. The method consists of a superposition of Greenâ€™s functions for surface and buried loads. Solutions for surface loads are used to discretize a rigid plate at the surface of the soil, on top of which time-harmonic vertical loads are applied. Solutions for buried load are used together with zero-stress boundary conditions to model the presence of trenches in the soil. The soil is modeled as homogeneous isotropic or transversely isotropic half-spaces, for which classical Greenâ€™s functions are available in the literature. Stress and displacement fields within the trenched half-space containing a surface plate are related through sets of fictitious loads. Post-processing from these loads yield quantities such as the displacement field anywhere in the half-space. This work uses these post-processed quantities to study how the ground vibration propagating from the loaded plate is affected by the presence of trenches.",
            "doi": "https://www.researchgate.net/publication/337317395"
        },
        {
            "title": "Optimization of the Natural Frequencies of Euler-Bernoulli Beams.",
            "details": "In: Proceedings of XL Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2019, Natal.",
            "pdf_link": "publications/blanche-hoefel-2019-optimization-of-the-natural-frequencies-of-euler-bernoulli-beams.pdf",
            "authors": "Juan G. Q. Blanche, Simone dos Santos Hoefel",
            "abstract": "Various types of engineering structures are subject to periodic loading such as offshore platform parts and wind turbine blades. One of the main causes of failure in these structures is due to the resonance effect, when the frequency of external loading coincides with some natural frequency of the structure. Therefore, the maximization of natural frequencies is an increasingly sought-after topic in the design of these components. In this paper a genetic algorithm is developed to maximize natural frequencies of Euler-Bernoulli beams. Genetic algorithms are stochastic search methods, which are based on biological concepts of adaptation, natural selection, fitness and evolution, to solve optimization problems. A beam population is created, each of them discretized in a mesh of cylindrical elements with different diameters, initially random. The natural frequencies of the beam are found by the Finite Element Method, and the one with the highest natural frequency creates a new generation of offsprings. In each offspring is applied a mutation scheme that changes the diameter of any random element, making the entire population change. So over the generations the algorithm finds out the best diameter combination that maximizes the natural frequency of the beam. Results present different shapes are obtained for several boundary conditions and different natural frequencies maximized",
            "doi": "https://www.researchgate.net/publication/337356020"
        },
        {
            "title": "Dynamic Behavior of an Axial-Loaded Timoshenko Beam on the Elastic Foundation.",
            "details": "In: Proceedings of 25th ABCM International Congress of Mechanical Engineering - COBEM, 2019, UberlÃ¢ndia.",
            "pdf_link": "publications/cortez-siqueira-hoefel-2019-dynamic-behavior-of-an-axial-loaded-timoshenko-beam-on-the-elastic-foundation.pdf",
            "authors": "RÃ´mulo Luz Cortez, Lucas Oliveira Siqueira, Simone dos Santos Hoefel",
            "abstract": "Timoshenko beam is one of the most complete beam models, so studies in this field are of great importance for the practical engineering. In this paper is analyzed the influence of the elastic foundation and the axial load on the dynamic behavior of the Timoshenko beam with uniform cross-section. A Finite Element is developed through of a cubic approximated polynomial. Numerical comparisons and examples are done for check the method performance and present a good agreement. The natural frequencies are obtained for several boundary conditions. It's investigated the slenderness ratio, the axial load parameter and the foundation stiffness influence in the frequency parameter. Finally, the results shows that the axial load decrease the frequency parameter and the foundation increase the frequency parameter.",
            "doi": "https://doi.org/10.26678/ABCM.COBEM2019.COB2019-2064"
        },
        {
            "title": "Dynamic Analysis of a jack-up platform under axial loads.",
            "details": "In: Proceedings of Encontro Unificado de ComputaÃ§Ã£o do PiauÃ­ - ENUCOMPI, 2018, Floriano.",
            "pdf_link": "publications/abreu-azevedo-hoefel-2019-dynamic-analysis-of-a-jack-up-platform-under-axial-loads.pdf",
            "authors": "Brendon M. Abreu, Anderson S. Azevedo, Simone dos Santos Hoefel",
            "abstract": "Dynamic behavior of offshore structures is an area of extensive research, since they are widely used to support superstructures like wind turbine, offshore platforms etc. This paper, the free vibration of a continuous, elastic model of a Jack-up Platform is studied. The model is considered non-immersed and immersed in water, is under going free transverse vibration in a plane. It is modeled as a uniform Timoshenko beam (TBT) which has an tip mass on one end and is fixed at the other end. Effects of shear deformation and rotary inertia are included in the beam. Such a model is representative of numerous applications. The analytical theory for Timoshenko beam is presented, the free vibration equation is derived using Hamiltonâ€™s variational principle based on Finite Element Method (FEM), which show a good agreement in results . At the end, an parametric study is carried out which provides an insight into the dependence of natural frequency on different configurations of the geometric and parameters of stiffnesses of the supports on the free vibration characteristics is investigated.",
            "doi": "https://www.researchgate.net/publication/328790038"
        },
        {
            "title": "Analysis of the Natural Frequencies and Mode Shape of Vibration of the Tendon of an Offshore Platform.",
            "details": "In: Proceedings of XIII SimpÃ³sio de MecÃ¢nica Computacional - SIMMEC, 2018, VitÃ³ria.",
            "pdf_link": "publications/abreu-luz-hoefel-2018-analysis-of-the-natural-frequencies-and-mode-shape-of-vibration-of-the-tendon-of-an-offshore-platform.pdf",
            "authors": "Brendon Menezes de Abreu, Bruno Ribeiro da Luz, Simone dos Santos Hoefel",
            "abstract": "Offshore oil platforms are large structures used for offshore drilling that house workers and machines required to drill wells in the ocean floor and for the extraction of oil and/ or natural gas. These structures can be modeled by flexible cable or beam. This paper presents a model for vibration analysis of a tendon of a floating platform, Tension Leg Platform (TLP). The model consists of a Euler-Bernoulli beam with composite elastic supports of translational and rotational spring and a mass concentrated at the free end. The equation of motion is derived from the Hamilton principle and the frequency equation is obtained analytically. Subsequently, a beam element with two degrees of freedom per node is developed. The influence of the rigidity of the elastic supports, as well as the effect of the inclusion of the water body is investigated through numerical examples.",
            "doi": " https://www.researchgate.net/publication/328789933"
        },
        {
            "title": "Second Spectrum of Timoshenko Beam on Pasternak Foundation.",
            "details": "In: Proceedings of XXXVIII Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2017, FlorianÃ³polis.",
            "pdf_link": "publications/kennedy-soares-hoefel-2017-second-spectrum-of-timoshenko-beam-on-pasternak-foundation.pdf",
            "authors": "Wallison Kennedy da Silva Bezerra, Lucas Silva Soares, Simone dos Santos Hoefel",
            "abstract": "In many soil-structure interaction problems, the soil medium model used is the Winkler foundation for mathematical simplicity. However, this foundation model cannot represent the behavior of foundation materials for all engineering applications. The Pasternak model can accomplish a more realistic and generalized description of the soil behavior. For structures with a large aspect ratio of height and length, Timoshenko beam theory is used, instead of Euler-Bernoulli theory, since it takes both shear and rotary inertia into account. This paper investigates the effects of the Pasternak foundation on the dynamic response of the Timoshenko beam. A finite element is developed using cubic and quadratic polynomials, which are made interdependent by requiring them to satisfy the static homogeneous differential equations associated with Timoshenko beam theory. The influence of the foundation on the second spectrum is concerned. The results showed that the presence of the foundation anticipates the second spectrum and does not have a significant influence in its frequencies. Also, the presence of the foundation permits a distinction between the two spectra for boundary conditions that do not factorize.",
            "doi": "https://www.researchgate.net/publication/321170583"
        },
        {
            "title": "Dynamic Analysis of Timoshenko Beam on Pasternak Foundation.",
            "details": "In: Proceedings of XXXVIII Ibero-Latin American Congress on Computational Methods in Engineering - CILAMCE, 2017, FlorianÃ³polis.",
            "pdf_link": "publications/soares-kennedy-hoefel-2017-dynamic-analysis-of-timoshenko-beam-on-pasternak-foundation.pdf",
            "authors": "Lucas Silva Soares, Wallison Kennedy da Silva Bezerra, Simone dos Santos Hoefel",
            "abstract": "Free vibration analysis of beams on the elastic foundation is necessary for an optimal design in many engineering applications. This paper analyzes the effect of Winkler and Pasternak foundations in the natural frequencies of a Timoshenko beam. For this purpose, the natural frequencies are obtained by solving the partial differential equation governing the problem. A finite element is developed using cubic and quadratic polynomials for transverse displacement and slope, respectively, for a two-node beam element with two degrees of freedom per node. The finite element and the analytic solutions are compared and discussed with some numerical examples. The results presented a high accuracy and reliability for the beam-foundation iteration problem. The presence of the Pasternak foundation increases the natural frequencies of the beam. The growth of the frequencies on Pasternak foundation is mostly due to the shear layer stiffness, and it reduces the influence of the elastic stiffness. The use of the Euler-Bernoulli beam on Winkler foundation instead of the Timoshenko beam on Pasternak foundation presents a significant inaccuracy, except for specific values of rotational inertia.",
            "doi": "https://www.researchgate.net/publication/321170582"
        },
        {
            "title": "Dynamic Analysis of a Viscoelastic Timoshenko Beam.",
            "details": "In: Proceedings of 24th ABCM International Congress of Mechanical Engineering - COBEM, 2017, Curitiba.",
            "pdf_link": "publications/azevedo-hoefel-2017-dynamic-analysis-of-viscoelastic-timoshenko-beam.pdf",
            "authors": "Anderson Soares da Costa AzevÃªdo, Simone dos Santos Hoefel",
            "abstract": "Viscoelastic materials are widely used for passive damping in a variety of engineering structures due to the need for structural stability and durability. Beams are often used as structural elements in many of those structures, like rotor blades, transmission shafts, frames and robotic arms. In this paper, the full development and analysis of Timoshenkoâ€™s beam for transversely vibrations uniform viscoelastic beam are presented for classical boundary conditions. The governing equation of motion is obtained based upon Hamiltonâ€™s principle and constitutive relations. The viscoelastic beam material is constituted by the Kelvin-Voigt rheological model. Finally, the influence of the viscous internal friction on the natural frequencies and waves dispersion are discussed and numerically demonstrated.",
            "doi": " https://www.researchgate.net/publication/321474521"
        },
        {
            "title": "Free Vibration Analysis for Euler-Bernoulli Beam on Pasternak Foundation.",
            "details": "In: Proceedings of 24th ABCM International Congress of Mechanical Engineering - COBEM, 2017, Curitiba.",
            "pdf_link": "publications/kennedy-soares-hoefel-2017-free-vibration-analysis-for-euler-bernoulli-beam-on-pasternak-foundation.pdf",
            "authors": "Wallison Kennedy da Silva Bezerra, Lucas Silva Soares, Simone dos Santos Hoefel",
            "abstract": "Free vibration analysis of beams on the elastic foundation is necessary for an optimal design in engineering applications, especially in the fields of transportation systems. This paper analyzes the influence of the foundation parameters and the boundary conditions configuration in the dynamic response of Euler-Bernoulli beam on Pasternak foundation. A finite element solution is developed and compared with the analytic solution to verify the reliability of the method in this kind of problem. The results showed that Pasternak foundation increases the frequency parameters of the beam. Also, the presence of the foundation reduces the normal mode amplitude and the clamped-free case is the most affected by the presence of a Pasternak foundation.",
            "doi": "https://doi.org/10.26678/ABCM.COBEM2017.COB17-1084"
        },
        {
            "title": "Dynamic Response of Timoshenko Beam on Pasternak Foundation.",
            "details": "In: Proceedings of 24th ABCM International Congress of Mechanical Engineering - COBEM, 2017, Curitiba.",
            "pdf_link": "publications/soares-kennedy-hoefel-2017-dynamic-response-of-timoshenko-beams-on-pasternak-foundation.pdf",
            "authors": "Lucas Silva Soares, Wallison Kennedy da Silva Bezerra, Simone dos Santos Hoefel",
            "abstract": "The dynamic response of beams on elastic foundation has been extensively studied in the modern engineering, especially in the fields of transportation systems. This approach is mainly used to model a railroad track. In this paper, a finite element is developed using cubic and quadratic polynomials. The finite element and the analytic solutions are compared to verify the reliability of the method in this kind of problem. The influence of the foundation parameters and the boundary conditions configuration are taken into account. The results showed that Pasternak foundation increases the frequency parameters of the beam. Also, the presence of the foundation reduces the normal mode amplitude and the clamped-free case is the most affected by the presence of a Pasternak foundation",
            "doi": "https://doi.org/10.26678/ABCM.COBEM2017.COB17-1571"
        },
        {
            "title": "Analysis of Rotatory Inertia and Shear-Deformation on Transverse Vibration of Beams.",
            "details": "In: Proceedings of IX Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2016, Fortaleza.",
            "pdf_link": "publications/azevedo-hoefel-2016-analysis-of-rotatory-inertia-and-shear-deformation-on-transverse-vibration-of-beams.pdf",
            "authors": "Anderson Soares da Costa AzevÃªdo, Simone dos Santos Hoefel",
            "abstract": "In the classical Bernoulli-Euler theory flexural vibrations of beam, the effect of rotatory inertia and shear are neglected. However, the equations obtained on these assumptions are inadequate for short and thin-webbed beams and for beams where higher modes are required, considerable errors may be incurred by use of equations. When a beam is subjected to lateral vibration so that depth of the beam is a significant proportion of the distance between two adjacent nodes, rotatory inertia of beam and transverse deformation arising from the severe contortions of the beam during vibration make significant contributions to the lateral deflection. Therefore rotatory inertia and shear effects must be taken into account in the and analysis of high-frequency vibration of all beams, and in all analyses of deep beams. In this work, the effect of rotatory inertia and transverse-shear deformation on beams are introduced and analysed. Frequency equation for each case are developed in terms of dimensionless parameters of rotatory and shear. Numerical examples presented in literature are re-examined.",
            "doi": "https://doi.org/10.20906/CPS/CON-2016-1101"
        },
        {
            "title": "Free Vibration Analysis of Euler-Bernoulli under Non-Classical Boundary Conditions.",
            "details": "In: Proceedings of IX Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2016, Fortaleza.",
            "pdf_link": "publications/fernandes-allende-hoefel-2016-free-vibration-analysis-of-euler-bernoulli-under-non-classical-boundary-conditions.pdf",
            "authors": "JoÃ£o Fernandes da Silva, Lucas Allende Dias do Nascimento, Simone dos Santos Hoefel",
            "abstract": "The flexible beams carrying attachments and non-classical boundary conditions often appear in engineering structures, modal analysis of those structures is important and necessary in structural design. The analysis of vibrating beams with ends elastically restrained against rotation and translation or with ends carrying concentrated masses or rotational inertias is of great interest in a variety of practical cases. In this analysis, the governing differential equations of the beam, which is a partial differential equation with variable coefficients, and that of the mass-spring system, which is an ordinary differential equation, are found. The exact solution of the problem is then obtained using classical and non-classical boundary conditions and the eigenvalues and eigenfunctions are found. Finally, some cases with available results in the literature are presented and analyzed.",
            "doi": "https://doi.org/10.20906/CPS/CON-2016-1053"
        },
        {
            "title": "The Second spectrum of Timoshenko beam.",
            "details": "In: Proceedings of IX Congresso Nacional de Engenharia MecÃ¢nica - CONEM, 2016, Fortaleza.",
            "pdf_link": "publications/vasconcelos-azevedo-hoefel-2016-the-second-spectrum-of-timoshenko-beam.pdf",
            "authors": "Ana Carolina Azevedo Vasconcelos, Anderson Soares da Costa AzevÃªdo, Simone dos Santos Hoefel",
            "abstract": "Early researchers reported that for hinged-hinged beam, two distinct natural frequencies correspond to the same spatial mode shape and that it establish the existence of a second distinct frequency spectrum. This phenomenon was received the terminology of the \"Second Spectrum of Timoshenko Beam\". However, some investigators reported that the single frequency spectrum interpretation has the same sets of frequencies calculated from the \"two spectra\". The objective of this paper is to provide an analysis of the solution of Timoshenko beam equations for higher modes and discuss their complex dynamical behavior. A numerical example presented in literature is re-examined.",
            "doi": "https://doi.org/10.20906/CPS/CON-2016-1050"
        },
        {
            "title": "Modal Analysis of Four Beam Theories.",
            "details": "In: Proceedings of 23rd ABCM International Congress of Mechanical Engineering - COBEM, 2015, Rio de Janeiro.",
            "pdf_link": "publications/azevedo-hoefel-2015-modal-analysis-of-four-beam-theories.pdf",
            "authors": "Anderson Soares da Costa AzevÃªdo, Simone dos Santos Hoefel",
            "abstract": "Beams are structural elements frequently used for support buildings, part of airplanes, ships, rotor blades and most engineering structures. In many projects it is assumed that these elements are subjected only to static loads, however dynamic loads induce vibrations, which changes the values of stresses and strains. Furthermore, these mechanical phenomenon cause noise, instabilities and may also develop resonance, which improves deflections and failure. Therefore study these structural behavior is fundamental in order to prevent the effects of vibration. The mechanical behavior of these structural elements may be described by differential equations, four widely used beam theories are Euler-Bernouli, Rayleigh, Shear and Timoshenko. This paper presents a comparison between these four beam theories for the free transverse vibration of uniform beam. Numerical examples are shown to beam models under classical boundary condition.",
            "doi": " https://www.researchgate.net/publication/315549591"
        }
    ]
}
``n

### Arquivo: .\data\team.json
`$Lang
{
  "research_team": [
    {
      "name": "Henrique Ezequiel",
      "role": "Member",
      "img": "images/team/henrique-ezequiel.jpg",
      "lattes": "https://lattes.cnpq.br/6235095559529771"
    },
    {
      "name": "Thierry Miqueias",
      "role": "Member",
      "img": "images/team/thierry-miqueias.jpeg",
      "lattes": "https://lattes.cnpq.br/1813366880479323"
    },
    {
      "name": "Clenilson Willames",
      "role": "Member",
      "img": "images/team/clenilson-willams.jpeg",
      "lattes": "https://lattes.cnpq.br/6647122618998177"    
    },
    {
      "name": "Natan Pereira",
      "role": "Member",
      "img": "images/team/natan-pereira.jpg",
      "lattes": "https://lattes.cnpq.br/3554901624610798"
    },
    {
      "name": "JosÃ© Fernando",
      "role": "Member",
      "img": "images/team/jose-fernando.jpg",
      "lattes": "https://lattes.cnpq.br/7941934147627776"
    },
    {
      "name": "Camile Ximenes",
      "role": "Member",
      "img": "images/team/camille-ximenes.jpeg",
      "lattes": "https://lattes.cnpq.br/8871321192624079"
    },    
    {
      "name": "Gabriel Garrett",
      "role": "Member",
      "img": "images/team/gabriel-garrett.jpeg",
      "lattes": "https://lattes.cnpq.br/5918209777651902"
    },
    {
      "name": "Luis (Calouro) Gustavo",
      "role": "Member",
      "img": "images/team/luiz-gustavo.jpeg",
      "lattes": "https://lattes.cnpq.br/1535344358224533"    
    },
    {
      "name": "Ãlvaro Francisco",
      "role": "Member",
      "img": "images/team/alvaro-francisco.jpeg",
      "lattes": "https://lattes.cnpq.br/2004547555402045"   
    }
  ],
  "alumni": [
    {
      "name": "ANA CAROLINA AZEVEDO VASCONCELOS",
      "role": "TU Delft",
      "img": "images/team/alumni/ana_azevedo.jpg",
      "lattes": "https://lattes.cnpq.br/9951249526205379",
      "bio": "<b>Current Position:</b> Ph.D. at Department of Maritime and Transport Technology, Delft University of Technology, Netherlands<br><br><b>Current Research Topic:</b> Design of a large-scale acoustic/elastic metamaterial for structural vibration control."
    },
    {
      "name": "ALDEMAR PONTES DE SIQUEIRA NETO",
      "role": "UNICAMP",
      "img": "images/team/alumni/aldemar-siqueira.png",
      "lattes": "https://lattes.cnpq.br/6028170655837066",
      "bio": "<b>Current Position:</b> Ph.D. student in Mechanical Engineering at the School of Mechanical Engineering of the University of Campinas.<br><br><b>Current Research Topic:</b> Topology optimization of buried structures"
    },
    {
      "name": "ANDERSON SOARES DA COSTA AZEVÃŠDO",
      "role": "USP",
      "img": "images/team/alumni/anderson-soares.jpg",
      "lattes": "https://lattes.cnpq.br/6094128754683896",
      "bio": "<b>Current Position:</b> Postdoctoral researcher at the Polytechnic School of the University of SÃ£o Paulo (POLI-USP)<br><br><b>Current Research Topic:</b> Topology optimization in fluid flow and fluid-structure interaction problems."
    },
    {
      "name": "BRUNO RICARDO DE MELO CAVALCANTE",
      "role": "Politecnico di Bari",
      "img": "images/team/alumni/bruno_cavalcante.jpg",
      "lattes": "https://lattes.cnpq.br/7339036860988217",
      "bio": "<b>Current Position:</b> Postdoctoral researcher at the Department of Mechanics, Mathematics, and Management (DMMM), Politecnico di Bari, Italy.<br><br><b>Current Research Topic:</b> Postdoctoral researcher at the Department of Mechanics, Mathematics, and Management (DMMM), Politecnico di Bari, Italy."
    },
    {
      "name": "DAVID ANDRADE SOARES CARNEIRO",
      "role": "KU Leuven",
      "img": "images/team/alumni/david-carneiro.jpg",
      "lattes": "https://lattes.cnpq.br/3371715889014722",
      "bio": "<b>Current Position:</b> Ph.D. student at KU Leuven (Belgium), MSc from UNICAMP.<br><br><b>Current Research Topic:</b> Ground vibration attenuation by heavy surface structures."
    },
    {
      "name": "IAGO CAVALCANTE GERALDO",
      "role": "UNICAMP",
      "img": "images/team/alumni/iago-cavalcante.jpg",
      "lattes": "https://lattes.cnpq.br/2298476587779658",
      "bio": "<b>Current Position:</b> Ph.D. student in Mechanical Engineering at the School of Mechanical Engineering of the Universit of Campinas.<br><br><b>Current Research Topic:</b> Currently working on 3D topology optimization in soil-structure interaction problems."
    },
    {
      "name": "KEALANÃƒ MOURA DE ARAÃšJO",
      "role": "USP",
      "img": "images/team/alumni/kaelana-moura.jpg",
      "lattes": "https://lattes.cnpq.br/5226009662750354",
      "bio": "<b>Current Position:</b> MSc in Mining and Petroleum Engineering at the Polytechnic School of the University of SÃ£o Paulo (POLI-USP).<br><br><b>Current Research Topic:</b> Oil well/fluid interaction from the hydraulic fracturing technique."
    },
    {
      "name": "LUCAS OLIVEIRA SIQUEIRA",
      "role": "USP",
      "img": "images/team/alumni/lucas-siqueira.jpeg",
      "lattes": "https://lattes.cnpq.br/6080651189096179",
      "bio": "<b>Current Position:</b> Ph.D student in Mechanical Engineering at the Polytechnic School of the University of SÃ£o Paulo - POLI USP. MSc in Aerospace Engineering by UFPE.<br><br><b>Current Research Topic:</b> Brazing of austenitic stainless steels using silver-based filler metals."
    },
    {
      "name": "RÃ”MULO LUZ CORTEZ",
      "role": "USP",
      "img": "images/team/alumni/romulo-cortez.jpg",
      "lattes": "https://lattes.cnpq.br/5123675321151394",
      "bio": "<b>Current Position:</b> Ph.D in Mechanical Engineering at the Polytechnic School of the University of SÃ£o Paulo - POLI USP.<br><br><b>Current Research Topic:</b> Topology optimization applied to multiphysics problems."
    },
    {
      "name": "JOSÃ‰ PEREIRA RAMOS JUNIOR",
      "role": "USP",
      "img": "images/team/alumni/jose_pereira.jpeg",
      "lattes": "https://lattes.cnpq.br/5617751176275363",
      "bio": "<b>Current Position:</b> PhD. Student in the Department of Naval Architecture and Ocean Engineering (PNV) at the Polytechnic School of the University of SÃ£o Paulo (POLI-USP).<br><br><b>Current Research Topic:</b> Topology optimization in fluid flow and structural problems."
    },
    {
      "name": "JENARIO SOUZA DOS REIS JUNIOR",
      "role": "UNICAMP",
      "img": "images/team/alumni/jenario-junior.jpeg",
      "lattes": "https://lattes.cnpq.br/7775332265007392",
      "bio": "<b>Current Position:</b> MSc. student in Mechanical Engineering at the School of Mechanical Engineering of the University of Campinas.<br><br><b>Current Research Topic:</b> Topology optimization in problems including interface and contact objective functions."
    },
    {
      "name": "ISADORA RODRIGUES DE SOUZA",
      "role": "UNICAMP",
      "img": "images/team/alumni/isadora-rodrigues.jpeg",
      "lattes": "https://lattes.cnpq.br/2300935877879392",
      "bio": "<b>Current Position:</b> MSc. student in Mechanical Engineering at the School of Mechanical Engineering of the University of Campinas.<br><br><b>Current Research Topic:</b> Seismic metamaterials for ground vibration attenuation."
    },
    {
      "name": "DÃRIO CARVALHO VIVEIROS",
      "role": "UNICAMP",
      "img": "images/team/alumni/dario-viveiros.jpg",
      "lattes": "https://lattes.cnpq.br/1999769284850412",
      "bio": "<b>Current Position:</b> MSc. student in Mechanical Engineering at the School of Mechanical Engineering of the University of Campinas.<br><br><b>Current Research Topic:</b> Dynamics of railway vehicles and railway components."
    },
    {
      "name": "DAVI KAUÃŠ DE SOUSA GOMES",
      "role": "USP",
      "img": "images/team/alumni/davi-kaue.jpg",
      "lattes": "https://lattes.cnpq.br/1999769284850412",
      "bio": "<b>Current Position:</b> MSc. student at Polytechnic School USP. <br><br><b>Current Research Topic:</b> Topology optimization, Wire arc additive manufacturing."
    }
  ],
  "professional_career": [
    {
      "name": "BRENDON MENEZES DE ABREU",
      "role": "Heineken Company",
      "img": "images/team/alumni/brendon-abreu.jpg",
      "lattes": "https://www.linkedin.com/in/brendon-menezes-de-abreu-440117a7/",
      "bio": "<b>Current Position:</b> Maintenance Engineer<br><br><b>Working Area:</b> Development and analysis of Projects such as 3D Printer, Automation and Instrumentation, and Control and Quality of Beer Production."
    },
    {
      "name": "L'HAUÃƒ BARBOSA PEREIRA DE MIRANDA",
      "role": "Codevasf",
      "img": "images/team/alumni/lhaua-barbosa.jpg",
      "lattes": "https://www.linkedin.com/in/l-hauÃ£-miranda-b748b3115/",
      "bio": "<b>Current Position:</b> Regional Development Analyst at Codevasf.<br><br>MSc. in Mechanical Engineering by UNICAMP, and graduated in Mechanical Engineering by UFPI."
    }
  ],
  "in_memoriam": [
    {
      "name": "JUAN GABRIEL QUEIROZ BLANCHE",
      "role": "In Memoriam",
      "img": "images/team/alumni/juan-blanches.jpg",
      "lattes": "https://lattes.cnpq.br/4066638612218564",
      "bio": "<i><b>There is no departure for those who are eternal. â™¥</b></i>"
    }
  ]
}
``n

### Arquivo: .\static\main.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {
    // Background DinÃ¢mico
    document.querySelectorAll('[data-background-image]').forEach((element) => {
        element.style.backgroundImage = element.dataset.backgroundImage;
    });

    // BotÃ£o Voltar ao Topo
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

    // LÃ³gica do Accordion para o Menu Mobile (Impede o clique de sumir com itens no celular)
    document.querySelectorAll('.navbar .dropdown > a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 900) {
                e.preventDefault();
                link.parentElement.classList.toggle('active');
            }
        });
    });

    // LÃ³gica do CSS Slider na Home
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

    // Novo Controlador GenÃ©rico de Sliders Data-Driven
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

    // LÃ³gica do Modal com Acessibilidade (A11y e Focus Trap)
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
            card.setAttribute('tabindex', '0'); // Permite navegaÃ§Ã£o por teclado
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
``n

### Arquivo: .\static\proceedings.js
`$Lang
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
        // Nova configuraÃ§Ã£o injetada
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
    
    // Substitui os textos com seguranÃ§a
    clone.querySelector('.js-title').textContent = article.title;
    clone.querySelector('.js-authors i').textContent = article.authors;
    
    const abstract = article.abstract || 'NÃ£o informado.';
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
    
    // Regula o botÃ£o de PDF
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
``n

### Arquivo: .\static\style.css
`$Lang
/* ==========================================================================
   Variáveis CSS
   ========================================================================== */
:root {
    --color-primary: #154c6b;
    --color-secondary: #267c94;
    --color-accent: #5ab1bb;
    --color-text-dark: #333333;
    --color-text-light: #ffffff;
    --color-text-muted: #666666;
    --color-bg-light: #f5f8fa;
    --color-bg-white: #ffffff;
    --color-highlight: #f1b348;
    --simcompi-green: #5ab1bb;
    --simcompi-bg-light: #d0eff3;
    --simcompi-text: #333333;
    --highlight-bg: #bdf5e6;
    --simcompi-bg-highlight: #d0eff3;
    
    --font-main: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --transition-speed: 0.3s;
    --layout-width-xl: 1200px;
    
    --spacing-sm: 1rem;
    --spacing-md: 2rem;
    --spacing-lg: 4rem;
    --border-radius: 8px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: var(--font-main);
    color: var(--color-text-dark);
    background-color: var(--color-bg-light);
    line-height: 1.6;
    position: relative;
}
a { color: inherit; text-decoration: none; }
.container { width: 100%; max-width: var(--layout-width-xl); margin: 0 auto; padding: 0 20px; box-sizing: border-box; }

/* Títulos Padronizados */
.section-title { color: var(--color-primary); background: transparent; border: 0; border-bottom: 2px solid var(--simcompi-green); border-radius: 0; display: flex; font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 700; letter-spacing: 0; line-height: 1.2; margin: 0 0 2rem; padding: 0 0 0.55rem; text-align: left; text-transform: none; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; }
.section-title-highlight { color: var(--color-primary); background: var(--color-accent); border: 0; border-radius: 0; display: inline-block; font-size: clamp(1.25rem, 2.2vw, 1.8rem); font-weight: 700; letter-spacing: 0; line-height: 1.25; margin: 0 0 1.35rem; padding: 0.55rem 0.8rem; text-align: left; text-transform: none; }
.section-title span, .section-title-highlight span { color: inherit; }
.page-header { background: linear-gradient(135deg, #154c6b, #44899c); color: white; padding: 40px 20px; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
.page-header h1 { margin: 0; font-size: 2.5rem; max-width: var(--layout-width-xl); margin-left: auto; margin-right: auto; color: white; }

/* Botões */
.btn { display: inline-block; padding: 10px 20px; border-radius: 4px; font-weight: 700; font-size: 0.9rem; border: none; cursor: pointer; transition: background var(--transition-speed), color var(--transition-speed); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-secondary); color: #fff; }
.btn-outline { background: transparent; border: 2px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary); color: #fff; }
.btn-text { padding: 0; background: transparent; color: var(--color-secondary); font-weight: 700; }
.btn-text:hover { color: var(--color-primary); }

/* Floating Back to Top Button */
.back-to-top-float { position: fixed; bottom: 30px; right: 30px; background-color: var(--color-primary); color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 1.5rem; z-index: 1000; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
.back-to-top-float.visible { opacity: 1; visibility: visible; }
.back-to-top-float:hover { background-color: var(--color-secondary); color: white; }

/* Navbar LAMEC */
.navbar { background-color: var(--color-bg-white); padding: 1rem 0; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); }
.navbar .nav-container { display: flex; align-items: center; justify-content: space-between; }
.navbar .logo-text { color: var(--color-primary); font-size: 2rem; font-weight: 700; letter-spacing: -1px; }
.navbar-brand-img { display: block; max-height: 50px; width: auto; }
.navbar .nav-links { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }
.navbar .nav-links > li { position: relative; }
.navbar .nav-links > li > a { display: block; padding: 10px 0; color: var(--color-primary); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; transition: color var(--transition-speed); }
.navbar .nav-links > li > a:hover, .navbar .nav-links > li > a.active { color: var(--color-secondary); font-weight: bold; }
.navbar .dropdown-menu { position: absolute; top: 100%; left: 0; display: none; min-width: 180px; margin: 0; padding: 10px 0; list-style: none; background: var(--color-bg-white); border-radius: 4px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); z-index: 1001; }
.navbar .dropdown:focus-within > .dropdown-menu, .navbar .dropdown:hover > .dropdown-menu { display: block; animation: navbarDropdownIn 0.2s ease-in; }
.navbar .dropdown-menu a { display: block; padding: 10px 20px; color: var(--color-primary); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; white-space: nowrap; transition: 0.3s; }
.navbar .dropdown-menu a:hover, .navbar .dropdown-menu a.active { color: var(--color-secondary); background: var(--color-bg-light); }
.navbar .dropdown > a i { margin-left: 5px; font-size: 0.7rem; }
@keyframes navbarDropdownIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* Navbar Mobile Toggle */
.mobile-menu-toggle { display: none; background: transparent; border: none; font-size: 1.5rem; color: var(--color-primary); cursor: pointer; }
.navbar-simcompi .mobile-menu-toggle { color: var(--color-text-light); }

/* Navbar SIMCOMPI */
.navbar-simcompi { background-color: var(--color-primary); }
.navbar-simcompi .logo-text, .navbar-simcompi .nav-links > li > a { color: var(--color-text-light); }
.navbar-simcompi .nav-links > li > a:hover, .navbar-simcompi .nav-links > li > a.active { color: var(--simcompi-green); }
.navbar-simcompi .back-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1.2rem; border: 2px solid var(--color-text-light); border-radius: 6px; color: var(--color-text-light); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; transition: all 0.3s; }
.navbar-simcompi .back-btn:hover { background-color: var(--color-text-light); color: var(--color-primary); }
.navbar-simcompi .dropdown-menu a { color: var(--color-primary); }

.navbar-simcompi .nav-links > li > a.back-btn { 
    padding: 0.45rem 2rem;
}

/* Navbar Exclusiva dos Anais (Simplificada) */
.navbar-proceedings { background-color: var(--color-primary); justify-content: flex-end; }
.navbar-proceedings .nav-links { margin-left: auto; display: flex; gap: 1rem;}

@media (max-width: 900px) { 
    .mobile-menu-toggle { display: block; }
    .navbar .nav-links { display: none; flex-direction: column; width: 100%; position: absolute; top: 100%; left: 0; background: var(--color-bg-white); box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 1rem; gap: 1rem; }
    .navbar .nav-links.show { display: flex; }
    .navbar-simcompi .nav-links { background: var(--color-primary); }
    
    /* Removemos a abertura por HOVER no Mobile */
    .navbar .dropdown:focus-within > .dropdown-menu, .navbar .dropdown:hover > .dropdown-menu { display: none; }
    
    /* Abertura controlada pelo JS com a classe .active */
    .navbar .dropdown.active > .dropdown-menu { display: block; position: static; box-shadow: none; padding-left: 20px; animation: none;}
    .navbar .dropdown > a { display: flex; justify-content: space-between; align-items: center; }
}

/* Acessibilidade: Prefere Movimento Reduzido (Labirintite, etc) */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

/* CSS Slider Home */
.css-slider { width: 100%; height: 60vh; min-height: 400px; position: relative; overflow: hidden; }
.css-slider .slide { width: 100%; height: 100%; position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 0.5s ease-in-out; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; color: white; z-index: 0; }
.css-slider .slide::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.3); z-index: 1; }
.css-slider .slider-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; justify-content: space-between; padding: 0 20px; z-index: 20; box-sizing: border-box; pointer-events: none; }
.css-slider .slider-nav a { pointer-events: auto; color: rgba(255, 255, 255, 0.7); font-size: 4rem; text-decoration: none; transition: color 0.3s; cursor: pointer; }
.css-slider .slider-nav a:hover { color: #ffffff; }

/* Hero Sections Gerais */
.hero { height: 60vh; min-height: 400px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; color: var(--color-text-light); position: relative; }
.hero::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 1; }
.hero-content { position: relative; z-index: 2; }
.hero h1 { font-size: 5rem; margin-bottom: 0.5rem; letter-spacing: 2px; color: white; }
.hero p { font-size: 1.2rem; font-weight: 300; letter-spacing: 1px; }
.slider-btn { position: absolute; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: rgba(255, 255, 255, 0.7); font-size: 4rem; cursor: pointer; z-index: 3; transition: color 0.3s; padding: 0 20px; }
.slider-btn:hover { color: #ffffff; }
.slider-prev { left: 20px; }
.slider-next { right: 20px; }

/* About Hero */
.about-hero { position: relative; width: 100%; height: 60vh; min-height: 600px; background-color: #ccc; background-image: url('images/backgrounds/home/home-horizontal-banner-1.jpg'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: flex-end; transition: background-image 0.5s ease-in-out; }
.about-hero::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 1; }
.hero-text-box { position: relative; z-index: 2; background: rgba(230, 235, 238, 0.85); padding: 50px; max-width: 650px; margin-right: 100px; border-radius: 4px; backdrop-filter: blur(5px); }
.hero-text-box h1 { color: var(--color-primary); font-size: 2.5rem; text-align: right; margin-bottom: 25px; font-weight: 800; }
.hero-text-box p { color: #444; font-size: 1.05rem; margin-bottom: 15px; line-height: 1.7; }

/* Simcompi Hero */
.simcompi-hero { background: linear-gradient(rgba(21, 76, 107, 0.6), rgba(21, 76, 107, 0.6)), url('images/simcompi/simcompi%203/banner-horizontal-iii-simcompi.png') center/cover; padding: 100px 20px 40px; text-align: center; position: relative; color: white; }
.logo-image { max-width: 100%; }
.past-edition-hero { padding: 60px 20px; display: flex; justify-content: center; align-items: center; background-color: var(--color-primary); position: relative;}
.past-edition-banner { min-height: 250px; background-position: center; background-repeat: no-repeat; background-size: contain; padding: 0; }

/* Zigue-Zague e Caixas (Home) */
.intro-section { padding: var(--spacing-lg) var(--spacing-sm); margin: 0 auto; text-align: center; }
.intro-box { background: var(--color-bg-white); padding: 3rem; box-shadow: 0 5px 15px rgba(0,0,0,0.05); font-size: 1.05rem; color: var(--color-text-muted); }
.features-section { padding: var(--spacing-md) var(--spacing-sm); display: flex; flex-direction: column; gap: 0.5rem; }
.feature-row { display: flex; gap: 0; align-items: stretch; min-height: 350px; }
.feature-row.reverse { flex-direction: row-reverse; }
.feature-image { flex: 1; background-size: cover; background-position: center; }
.logo-large { display: flex; align-items: center; justify-content: center; background-color: var(--color-bg-white); }
.logo-large h2 { font-size: 4rem; color: var(--color-primary); }
.feature-text { flex: 1; padding: 3rem; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
.dark-card { background-color: var(--color-primary); color: var(--color-text-light); }
.dark-card h3 { margin-bottom: 1rem; font-size: 1.5rem; }
.dark-card p { margin-bottom: 1.5rem; font-size: 0.95rem; opacity: 0.9; }
.quote-section { padding: var(--spacing-lg) var(--spacing-sm); max-width: 800px; margin: 0 auto; text-align: center;}
.quote-section .quote { font-style: italic; color: var(--color-primary); margin-bottom: 1.5rem; font-weight: 500; font-size: 1.1rem;}
.projects-section { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-bottom: var(--spacing-lg); }
.project-card { padding: 3rem; display: flex; flex-direction: column; justify-content: center; border-radius: var(--border-radius); background-size: cover; background-position: center; position: relative; z-index: 1; }
.project-card::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: -1; border-radius: inherit; }
.project-content { color: white; }
.project-content h2 { margin-bottom: 0.5rem; color: white; }
.project-content p { margin-bottom: 1.5rem; font-size: 0.95rem; }

/* Contato Global */
.contact-section { padding: var(--spacing-lg) var(--spacing-sm); }
.contact-grid { display: grid; grid-template-columns: 1fr; background: var(--color-bg-white); box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: var(--border-radius); overflow: hidden; max-width: var(--layout-width-xl); margin: 0 auto; text-align: left; }
.contact-info { padding: 3rem; }
.contact-info h4 { margin: 1.5rem 0 0.5rem 0; font-size: 1rem; color: var(--color-accent); }
.contact-info p { font-size: 0.95rem; opacity: 0.9; margin-bottom: 0.5rem; }
.social-icons { margin-top: 2rem; display: flex; justify-content: flex-start; gap: 1rem; }
.social-icons a { color: var(--color-text-light); font-size: 1.5rem; opacity: 0.8; transition: opacity var(--transition-speed); }
.social-icons a:hover { opacity: 1; }
.map-container { line-height: 0; margin-top: 2rem; }
.map-frame { border: 0; }

/* Sobre (About) */
.about-content { padding: 60px 20px 80px 20px; max-width: 1000px; margin: 0 auto; }
.about-text { font-size: 1.1rem; color: #444; line-height: 1.8; margin-bottom: 20px; text-align: justify; }
.about-text em { font-style: italic; color: var(--color-primary); font-weight: 600; }
.about-list { list-style: none; margin: 30px 0 30px 20px; }
.about-list li { font-size: 1.1rem; color: #444; margin-bottom: 15px; line-height: 1.8; }
.about-list li strong { color: var(--color-primary); }
.contact-action { text-align: center; margin-top: 60px; }

/* Equipe & Alumni (Cards e Modal) */
.head-section { display: flex; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 50px; border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform var(--transition-speed); }
.head-section:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
.head-img { width: 350px; min-height: 350px; background-size: cover; background-position: center; }
.head-info { padding: 40px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.head-title { color: var(--color-secondary); font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
.head-info h2 { margin: 0 0 15px 0; color: var(--color-primary); border: none; }
.head-info p { margin-bottom: 20px; color: #555; }
.stats-box { background: #e2e8f0; padding: 15px; display: inline-flex; gap: 30px; font-weight: bold; border-radius: 4px; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 30px; margin-bottom: 50px; }
.member-card { background: #fff; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform var(--transition-speed); }
.member-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.member-photo { width: 100%; aspect-ratio: 1 / 1; background-size: cover; background-position: center; background-repeat: no-repeat; transition: transform var(--transition-speed); }
.member-card:hover .member-photo { transform: scale(1.05); }
.member-name-banner { position: absolute; bottom: 0; width: 100%; background: rgba(21, 76, 107, 0.85); color: white; text-align: center; padding: 15px 10px; font-weight: 600; backdrop-filter: blur(4px); font-size: 0.9rem; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; opacity: 0; pointer-events: none; transition: opacity var(--transition-speed); }
.modal-overlay.active { opacity: 1; pointer-events: all; }
.modal-content { background: #fff; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-radius: 8px; position: relative; transform: translateY(20px); transition: transform var(--transition-speed); display: flex; flex-direction: column; }
.modal-overlay.active .modal-content { transform: translateY(0); }
.close-btn { position: absolute; top: 15px; right: 15px; background: var(--color-primary); color: white; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; z-index: 10; }
.modal-body { display: flex; flex-direction: column; }
.modal-img-container { height: 500px; background-size: cover; background-position: top center; }
.modal-text { padding: 30px; }
.modal-text h3 { margin: 0 0 10px 0; color: var(--color-primary); font-size: 1.3rem; line-height: 1.3; border: none; }
.modal-role { color: var(--color-secondary); font-weight: bold; margin-bottom: 15px; font-size: 1.1rem;}
.modal-bio { margin-bottom: 25px; color: #444; font-size: 0.95rem; }

/* SIMCOMPI (Evento & Submissões) */
.countdown-container { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; flex-wrap: wrap; }
.countdown-box { background: rgba(255, 255, 255, 0.85); padding: 20px 25px; border-radius: 8px; min-width: 100px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: var(--color-primary); text-align: center; }
.countdown-box span { display: block; font-size: 2.5rem; font-weight: bold; line-height: 1; }
.countdown-box small { font-size: 0.8rem; font-weight: bold; color: #555; text-transform: uppercase; }
.countdown-info { color: black; text-align: left; margin-left: 20px; font-size: 1.2rem; font-weight: 700; }
.simcompi-intro { padding: 60px 20px; max-width: 900px; margin: 0 auto; font-size: 1.05rem; }
.subscribe-btn-container { text-align: right; margin-top: 30px; }
.speakers-section { background-color: var(--simcompi-bg-light); padding: 60px 20px; }
.speakers-grid { display: flex; justify-content: center; gap: 50px; flex-wrap: wrap; background: #fff; padding: 50px; border-radius: 8px; max-width: 1000px; margin: 0 auto; }
.speaker-card { text-align: center; width: 160px; }
.speaker-photo { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.speaker-card h4 { color: #111; font-size: 1rem; }
.instagram-section { padding: 60px 20px; max-width: 1000px; margin: 0 auto; text-align: center; }
.insta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.insta-item { width: 100%; aspect-ratio: 1/1; background-size: cover; background-position: center; border-radius: 8px; }
.organizers-section { padding: 60px 20px; text-align: center; background: #fff; }
.organizers-section h3 { margin-bottom: 30px; font-size: 1.5rem; }
.logos-wrapper { padding: 60px 20px; background-color: #ffffff; text-align: center; }
.logos-wrapper h3 { font-size: 1.4rem; color: #000; margin-bottom: 25px; margin-top: 40px; }
.logos-wrapper h3:first-child { margin-top: 0; }
.logos-container { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 40px; max-width: 900px; margin: 0 auto 50px auto; }
.logos-container img { max-height: 100px; max-width: 250px; object-fit: contain; }
.important-dates { padding: 60px 20px; }
.dates-list { list-style: disc; padding-left: 20px; font-size: 1.05rem; color: #444; }
.dates-list li { margin-bottom: 8px; }
.dates-list li strong { color: #222; }
.bg-light-blue { background-color: var(--simcompi-bg-light); padding: 60px 0; }
.submission-section { padding: 0 20px; }
.even3-embed-container { max-width: 1200px; width: 100%; margin: 0 auto; min-height: 300px; display: flex; align-items: center; justify-content: center; color: #666; text-align: center; padding: 20px; }
.resources-section { padding: 60px 20px; background-color: #ffffff; }
.resource-block { margin-bottom: 40px; }
.resource-block h3 { color: var(--color-primary); font-size: 1.4rem; margin-bottom: 8px; }
.resource-block a { color: var(--simcompi-green); font-weight: bold; text-decoration: underline; font-size: 1.05rem; transition: color 0.2s; }
.resource-block a:hover { color: var(--color-secondary); }
.proceedings-section { padding: 0 20px; }
.proceedings-box { background-color: #ffffff; padding: 25px 30px; font-size: 1.05rem; color: #444; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); margin-bottom: 20px; }
.past-edition-description { max-width: 1100px; margin: 32px auto; padding: 0 20px; }
.schedule-section { display: flex; gap: 50px; padding: 60px 20px; max-width: 1100px; margin: 0 auto; }
.posters-column { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.posters-column img { width: 100%; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.text-column { flex: 1.2; }
.speaker-list { list-style: none; margin-bottom: 40px; }
.speaker-list li { margin-bottom: 0px; }
.speaker-list li strong { display: block; font-style: italic; color: #111; font-weight: 600; }
.speaker-list li span { color: #555; font-size: 0.95rem; }
.full-width-gallery { width: 100%; background-color: var(--color-primary); padding: 40px 0; text-align: center; overflow: hidden;}
.full-width-gallery img { max-width: 900px; width: 100%; height: auto; box-shadow: 0 5px 20px rgba(0,0,0,0.3); border-radius: 4px; }
.award-section { padding: 60px 20px; max-width: 1100px; margin: 0 auto; }
.award-text { font-size: 1.05rem; margin-bottom: 40px; }
.award-image-container { text-align: center; }
.award-image-container img { max-width: 800px; width: 100%; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }

/* ==========================================================================
   Anais do Evento (Proceedings Sidebar & Articles)
   ========================================================================== */
.proceedings-layout { display: grid; grid-template-columns: 260px 1fr; gap: 40px; padding: 50px 20px; align-items: start;}
.sidebar { position: sticky; top: 100px; align-self: start; }
.sidebar-widget { background: #ffffff; border: 1px solid #e0e0e0; margin-bottom: 25px; border-radius: 4px; overflow: hidden; }
.sidebar-title { background: #f4f4f4; padding: 12px 15px; font-size: 1.05rem; font-weight: bold; color: var(--color-text-dark); border-bottom: 1px solid #e0e0e0; }
.sidebar-content { padding: 15px; }
.search-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 2px; margin-bottom: 10px; font-family: inherit; }
.sidebar-menu { list-style: none; }
.sidebar-menu li { border-bottom: 1px solid #f0f0f0; }
.sidebar-menu li:last-child { border-bottom: none; }
.sidebar-menu li a { display: block; padding: 10px 0; color: var(--color-primary); font-size: 0.95rem; transition: color var(--transition-speed); }
.sidebar-menu li a:hover, .sidebar-menu li a.active { color: var(--simcompi-green); font-weight: bold; }
.edition-text { color: var(--color-primary); font-weight: 500; text-align: center; padding: 10px 0; }
.main-content { background: #ffffff; border: 1px solid #e0e0e0; padding: 40px 50px; border-radius: 4px; min-height: 500px;}
.text-content h1 { font-size: 2.2rem; color: var(--color-primary); margin-bottom: 30px; border-bottom: 2px solid var(--simcompi-green); padding-bottom: 10px; }
.text-content h2 { font-size: 1.6rem; color: var(--color-primary); margin: 35px 0 15px 0; font-weight: 600; }
.text-content p { margin-bottom: 15px; color: #444; font-size: 1.05rem; }
.text-content ul { margin-left: 20px; margin-bottom: 20px; }
.text-content li { margin-bottom: 8px; color: #444; font-size: 1.05rem; }
.text-content li strong { color: #222; }
.info-box { background-color: var(--simcompi-bg-highlight); border-radius: 8px; padding: 30px; margin-top: 40px; border-left: 6px solid var(--simcompi-green); }
.info-box h3 { color: var(--color-primary); font-size: 1.3rem; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border: none; }
.info-box ul { margin-left: 20px; margin-bottom: 0; }
.info-box li { color: #222; margin-bottom: 5px; }
.action-links { margin-top: 20px; display: flex; gap: 15px; flex-wrap: wrap; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; align-content: start; margin-bottom: 40px; }
.proc-card { background: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 40px 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.proc-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.proc-card h3 { font-size: 1.5rem; color: var(--color-text-dark); margin-bottom: 10px; border: none; }
.proc-card p { color: #555; font-size: 0.95rem; margin-bottom: 25px; }
.volume-section { margin-bottom: 60px; }
.volume-section:last-child { margin-bottom: 0; }
.volume-summary { display: grid; grid-template-columns: minmax(140px, 190px) 1fr; gap: 30px; align-items: center; padding: 25px; background: var(--color-bg-white); border: 1px solid #e0e0e0; border-radius: 4px; }
.volume-cover { display: block; width: 100%; max-width: 190px; aspect-ratio: 1 / 1.414; object-fit: cover; border: 1px solid #d9e0e5; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
.volume-details h1 { margin-bottom: 8px; color: var(--color-primary); font-size: 1.5rem;}
.volume-year { margin-bottom: 20px; color: var(--color-text-muted); }
.volume-details .btn, .volume-details .volume-articles-btn { margin: 4px 8px 4px 0; }
.article-volume { margin-bottom: 8px; color: var(--color-text-muted); font-size: 0.8rem; font-weight: 600; }
.article-results-group { margin-bottom: 30px; }
.edition-message { padding: 70px 30px; color: var(--color-primary); text-align: center; }
.edition-message i { margin-bottom: 16px; font-size: 2rem; }
.edition-message p { font-size: 1.15rem; }

.article-list { display: grid; gap: 20px; }
.article-card { background: var(--color-bg-white); border: 1px solid #ebebeb; border-radius: 4px; padding: 20px; margin-bottom: 15px; transition: box-shadow 0.2s; }
.article-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
.article-title { margin-bottom: 8px; color: var(--color-primary); font-size: 1.15rem; line-height: 1.3; font-weight: 700; }
.article-authors { margin-bottom: 8px; color: #555; font-size: 0.95rem; font-style: italic; }
.article-doi { margin-bottom: 15px; color: #888; font-size: 0.85rem; }
.article-doi a { color: var(--color-secondary); }
.article-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.article-details-container { margin-top: 15px; }
.abstract-text { overflow: hidden; color: #555; font-size: 0.9rem; line-height: 1.6; transition: max-height 0.25s ease; }
.abstract-text.collapsed { max-height: 3.2em; }
.abstract-text.expanded { max-height: 1000px; }

/* Comissões (Tabelas) */
.committees-section { padding: 60px 20px; }
.table-responsive { width: 100%; overflow-x: auto; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 8px; }
.styled-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; background-color: #ffffff; }
.styled-table thead tr { background-color: var(--color-primary); color: #ffffff; text-align: left; }
.styled-table th, .styled-table td { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; }
.styled-table tbody tr { transition: background-color 0.2s ease; }
.styled-table tbody tr:nth-of-type(even) { background-color: #f9fbfc; }
.styled-table tbody tr:hover { background-color: var(--simcompi-bg-light); }
.styled-table tbody td { color: #444; }
.styled-table tbody td strong { color: var(--color-primary); }

.info-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 40px; }
.info-card-header { background-color: var(--color-primary); color: white; padding: 15px 20px; font-size: 1.2rem; font-weight: bold; display: flex; align-items: center; gap: 10px; }
.info-card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 25px 20px; }
.info-list { list-style: none; }
.info-list ul { list-style: none; padding-left: 0; margin-top: 0.35rem; }
.info-list + .info-list { margin-top: 1.5rem; }
.info-list li { margin-bottom: 15px; font-size: 0.95rem; }
.info-list li strong { color: var(--color-primary); display: block; margin-bottom: 2px; }
.info-list li i { color: var(--simcompi-green); margin-right: 8px; width: 15px; text-align: center; }

/* Loading State Geral */
.loading-state { text-align: center; padding: 50px; color: #666; font-size: 1.2rem; }

/* Footer */
footer { background-color: var(--color-primary); color: var(--color-text-light); padding: 1.5rem 0; font-size: 0.8rem; text-align: center; margin-top: auto;}

/* Media Queries */
@media (max-width: 900px) {
    .proceedings-layout { grid-template-columns: 1fr; }
    .main-content { padding: 30px 20px; }
    .sidebar { position: static; }
}
@media (max-width: 850px) {
    .hero-content-split { flex-direction: column; text-align: center; }
    .schedule-section { flex-direction: column; }
}
@media (max-width: 768px) {
    .head-section { flex-direction: column; }
    .head-img { width: 100%; min-height: 250px; }
    .insta-grid { grid-template-columns: repeat(2, 1fr); }
    .tab-buttons { flex-direction: column; }
    .countdown-info { text-align: center; margin-left: 0; margin-top: 15px; width: 100%; }
    .info-card-body { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
    .volume-summary { grid-template-columns: 1fr; text-align: center;}
    .volume-cover { margin: 0 auto; }
}
@media (max-width: 480px) {
    .insta-grid { grid-template-columns: 1fr; }
}
``n

### Arquivo: .\build.py
`$Lang
import sys
from app import create_app
from flask_frozen import Freezer

app = create_app()
app.config['FREEZER_DESTINATION'] = '../dist'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_404_NOT_FOUND'] = False
# Trava de seguranÃ§a para SEO e arquivos limpos
app.config["JSON_AS_ASCII"] = False
app.config["FREEZER_DEFAULT_MIMETYPE"] = "text/html; charset=utf-8"

app.config['FREEZER_BASE_URL'] = 'https://lamec-ufpi.com.br'

freezer = Freezer(app)

@freezer.register_generator
def dynamic_routes():
    # Injeta a geraÃ§Ã£o de URLs dinÃ¢micas para os Anais (Volumes)
    from app.data.loader import load_proceedings_all
    from app.config import EVENT
    data = load_proceedings_all()
    for vol in data.get('volumes', []):
        yield 'proceedings.volume', {'volume_id': vol['id']}
    yield 'proceedings.volume', {'volume_id': EVENT["current_volume"]}

    # ForÃ§a o Freezer a gerar a nossa API, o mapa do Google e as rotas secretas
    yield 'main.proceedings_api', {}
    yield 'main.robots', {}
    yield 'main.sitemap', {}
    yield 'main.not_found', {}

if __name__ == '__main__':
    print("Iniciando build estÃ¡tico determinÃ­stico para /dist ...")
    freezer.freeze()
    print("Build finalizado com sucesso!")
    print("\nPara testar exatamente como vai pro GitHub Pages, rode o comando abaixo na pasta raiz:")
    print("  python -m http.server -d dist 8000")
``n

