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

# Nova Rota para a API (Sairá do HTML gigante)
@bp.route('/api/proceedings.json')
def proceedings_api():
    return jsonify(load_proceedings_all())

    

@bp.route('/robots.txt')
def robots():
    content = "User-agent: *\nAllow: /\nSitemap: https://lamec-ufpi.com.br/sitemap.xml"
    return Response(content, mimetype="text/plain")

@bp.route('/sitemap.xml')
def sitemap():
    # As principais páginas que o Google deve indexar
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
    return Response(xml_template, mimetype="text/xml") # <-- CORRIGIDO AQUI DE application PARA text

# Rota especial de erro que o GitHub Pages reconhece nativamente
@bp.route('/404.html')
def not_found():
    return render_template('pages/404.html')
