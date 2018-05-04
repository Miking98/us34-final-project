from flask import Flask, Response, render_template, request, jsonify, redirect, url_for, send_file, abort, send_from_directory
from werkzeug.utils import secure_filename
import json
import operator
import dateutil.parser
import numpy as np
import pandas as pd
import json
import nltk
import string
from time import time

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.debug = True

# LETTERS_DATABASE = 'data/letters/db_letters.sqlite'

# def get_db():
#     db = getattr(g, '_database', None)
#     if db is None:
#         db = g._database = sqlite3.connect(DATABASE)
#     db.row_factory = sqlite3.Row
#     return db

# def query_db(query, args=(), one=False):
#     cur = get_db().execute(query, args)
#     rv = cur.fetchall()
#     cur.close()
#     return (rv[0] if rv else None) if one else rv

# @app.teardown_appcontext
# def close_connection(exception):
#     db = getattr(g, '_database', None)
#     if db is not None:
#         db.close()



@app.route("/")
def hello():
	return render_template('index.html')



@app.route("/union_recruits")
def union_recruits():
	return render_template("union_recruits.html")



@app.route("/letters")
def letters():
	return render_template("letters.html")




@app.route("/modern_trends")
def modern_trends():
	return render_template("modern_trends.html")




@app.route("/get_ua_data")
def get_ua_data():
	response = send_from_directory('data/union', 'ua_data.json')
	response.cache_control.max_age = 300000
	return response
	





if __name__ == '__main__':
	app.run(debug=True,
			port=5000)