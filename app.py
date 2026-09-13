from flask import Flask, render_template, abort, request
from flask_frozen import Freezer
import json
import os

app = Flask(__name__)
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_404_NOT_FOUND'] = False
freezer = Freezer(app)

@app.context_processor
def inject_endpoint():
    return dict(current_endpoint=request.endpoint)

def get_proceedings_data():
    filepath = os.path.join(app.static_folder, 'proceedings_data.json')
    if os.path.exists(filepath):
        with open(filepath, encoding='utf-8') as f:
            return json.load(f)
    return {"volumes": []}

def get_team_data():
    filepath = os.path.join(app.static_folder, 'team.json')
    if os.path.exists(filepath):
        with open(filepath, encoding='utf-8') as f:
            return json.load(f)
    return {"research_team": [], "alumni": [], "professional_career": [], "in_memoriam": []}

def get_publications_data():
    filepath = os.path.join(app.static_folder, 'publications.json')
    if os.path.exists(filepath):
        with open(filepath, encoding='utf-8') as f:
            return json.load(f)
    return {"journal_papers": [], "conference_papers": []}

# Rotas LAMEC
@app.route('/')
def index(): return render_template('index.html')

@app.route('/publications/')
def publications():
    data = get_publications_data()
    return render_template('publications.html',
                           journal_papers=data.get('journal_papers', []),
                           conference_papers=data.get('conference_papers', []))

@app.route('/about/')
def about(): return render_template('about.html')

@app.route('/research-team/')
def research_team():
    data = get_team_data()
    return render_template('research_team.html', team=data.get('research_team', []))

@app.route('/alumni/')
def alumni():
    data = get_team_data()
    return render_template('alumni.html', 
                           alumni=data.get('alumni', []),
                           professional=data.get('professional_career', []),
                           memoriam=data.get('in_memoriam', []))

# Rotas Extensão
@app.route('/extension/bull-racing/')
def bull_racing(): return render_template('extension/bull_racing.html')

@app.route('/extension/faisca/')
def faisca(): return render_template('extension/faisca.html')

# Rotas SIMCOMPI
@app.route('/simcompi/')
def simcompi(): return render_template('simcompi/simcompi.html')

@app.route('/simcompi/submissions/')
def submissions(): return render_template('simcompi/submissions.html')

@app.route('/simcompi/committees/')
def committees(): return render_template('simcompi/committees.html')

@app.route('/simcompi/contact-us/')
def contact_us(): return render_template('simcompi/contact-us.html')

@app.route('/simcompi/edicoes-anteriores/i-simcompi/')
def i_simcompi(): return render_template('simcompi/i_simcompi.html')

@app.route('/simcompi/edicoes-anteriores/ii-simcompi/')
def ii_simcompi(): return render_template('simcompi/ii_simcompi.html')

# Rotas Anais
@app.route('/simcompi/proceedings/')
def proceedings(): return render_template('proceedings/proceedings.html')

@app.route('/simcompi/proceedings/apresentacao/')
def apresentacao(): return render_template('proceedings/apresentacao.html')

@app.route('/simcompi/proceedings/expediente/')
def expediente(): return render_template('proceedings/expediente.html')

@app.route('/simcompi/proceedings/normas/')
def normas(): return render_template('proceedings/normas.html')

@app.route('/simcompi/proceedings/contato/')
def contato_anais(): return render_template('proceedings/contato_anais.html')

@app.route('/simcompi/proceedings/arquivo/')
def arquivo(): 
    data = get_proceedings_data()
    return render_template('proceedings/arquivo.html', proceedings_data=data)

# Rota Dinâmica para os Volumes
@app.route('/simcompi/proceedings/volume/<volume_id>/')
def volume(volume_id):
    data = get_proceedings_data()
    vol = next((v for v in data.get('volumes', []) if v['id'] == volume_id), None)
    
    if not vol:
        if volume_id == 'vol_3':
            vol = {'id': 'vol_3', 'title': 'Vol. 3', 'year': '2027', 'categories': []}
        else:
            abort(404)
            
    return render_template('proceedings/volume.html', volume=vol)

# Gerador para o Freezer
@freezer.register_generator
def volume():
    data = get_proceedings_data()
    for vol in data.get('volumes', []):
        yield {'volume_id': vol['id']}
    yield {'volume_id': 'vol_3'}

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "build":
        freezer.freeze()
    else:
        app.run(debug=True)