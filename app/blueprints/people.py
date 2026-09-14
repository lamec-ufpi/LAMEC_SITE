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