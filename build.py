import sys
from app import create_app
from flask_frozen import Freezer

app = create_app()
app.config['FREEZER_DESTINATION'] = '../dist'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_404_NOT_FOUND'] = False
# Trava de segurança para SEO e arquivos limpos
app.config["JSON_AS_ASCII"] = False
app.config["FREEZER_DEFAULT_MIMETYPE"] = "text/html; charset=utf-8"

app.config['FREEZER_BASE_URL'] = 'https://lamec-ufpi.com.br'

freezer = Freezer(app)

@freezer.register_generator
def dynamic_routes():
    # Injeta a geração de URLs dinâmicas para os Anais (Volumes)
    from app.data.loader import load_proceedings_all
    from app.config import EVENT
    data = load_proceedings_all()
    for vol in data.get('volumes', []):
        yield 'proceedings.volume', {'volume_id': vol['id']}
    yield 'proceedings.volume', {'volume_id': EVENT["current_volume"]}

    # Força o Freezer a gerar a nossa API, o mapa do Google e as rotas secretas
    yield 'main.proceedings_api', {}
    yield 'main.robots', {}
    yield 'main.sitemap', {}
    yield 'main.not_found', {}

if __name__ == '__main__':
    print("Iniciando build estático determinístico para /dist ...")
    freezer.freeze()
    print("Build finalizado com sucesso!")
    print("\nPara testar exatamente como vai pro GitHub Pages, rode o comando abaixo na pasta raiz:")
    print("  python -m http.server -d dist 8000")