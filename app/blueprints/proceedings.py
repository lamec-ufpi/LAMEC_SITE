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