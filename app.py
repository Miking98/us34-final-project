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

@app.route("/get_letters_data_ngrams")
def get_letters_data_ngrams():
	response = send_from_directory('data/letters', 'ngrams_byyear.json')
	response.cache_control.max_age = 300000
	return response

@app.route("/get_letters_data_letters_count")
def get_letters_data_letters_count():
	response = send_from_directory('data/letters', 'letter_counts_byyear.json')
	response.cache_control.max_age = 300000
	return response




@app.route("/modern_trends")
def modern_trends():
	return render_template("modern_trends.html")




@app.route("/get_us_county_data")
def get_us_county_data():
	response = send_from_directory('data/union', 'us.json')
	response.cache_control.max_age = 300000
	return response

@app.route("/get_us_county_names_data")
def get_us_county_names_data():
	response = send_from_directory('data/union', 'us_county_names.tsv')
	response.cache_control.max_age = 300000
	return response

@app.route("/get_ua_data")
def get_ua_data():
	# Number of rows to return (default All)
	n_rows = None
	# Columns to return
	first_year = [6]
	all_years = [ x for x in range(9) ]
	relevant_vars = [('stanam', all_years), # State abbreviation
					('recnam', first_year), # Name
					('recgen', first_year), # Gender (M/F)
					('reccol', first_year), # Skin color (W,B,M,I), Indian, Mulatto
					('recbyr', [0]), # Birth year, only available in 1900 (int)
					('recmar', [5,6,8]), # Married in last year (X)
					('recocc', first_year), # Profession (variable)
					('reclan', [5,6,7]), # Value of real estate (int)
					('recprp', [6,7]), # Value of personal property (int)
					('recill', [5,6]), # Illiterate (X)
					('recarm', [1]), # Army veteran side (A,N)
					('recnav', [1]), # Navy veteran side (A,N)
					('ctynam', first_year), # County name
					('gen_ctynam_icpsr', first_year), #State/county code
					]
	keep_columns = []
	for (r, years) in relevant_vars:
		for i in years:
			keep_columns.append(r + '_' + str(i))
	start = time()
	dataset_whites = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_union_army_whites.csv', low_memory = False, nrows = n_rows)
	dataset_whites.drop(dataset_whites.columns.difference(keep_columns), 1, inplace=True)
	# dataset_blacks = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_expanded_usct_blacks_csv.csv', low_memory = False, nrows = n_rows)
	# dataset_blacks.drop(dataset_blacks.columns.difference(keep_columns), 1, inplace=True)
	# dataset_urban = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_urban_csv.csv', low_memory = False, nrows = n_rows)
	# dataset_urban.drop(dataset_urban.columns.difference(keep_columns), 1, inplace=True)
	# dataset = pd.merge([dataset_whites, dataset_blacks, dataset_urban])
	print(dataset_whites.shape)
	print("Time: "+str(time() - start)+" seconds")
	response = Response(
		response=dataset_whites.to_json(orient = 'records'),
		status=200,
		mimetype='application/json'
	)
	response.cache_control.max_age = 30000
	return response





if __name__ == '__main__':
	app.run(debug=True,
			port=5000)