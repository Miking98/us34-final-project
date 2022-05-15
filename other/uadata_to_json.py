import pandas as pd
from time import time

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
dataset_whites = pd.read_csv('../data/union/cen_union_army_whites.csv', low_memory = False, nrows = n_rows)
dataset_whites.drop(dataset_whites.columns.difference(keep_columns), 1, inplace=True)
# dataset_blacks = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_expanded_usct_blacks_csv.csv', low_memory = False, nrows = n_rows)
# dataset_blacks.drop(dataset_blacks.columns.difference(keep_columns), 1, inplace=True)
# dataset_urban = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_urban_csv.csv', low_memory = False, nrows = n_rows)
# dataset_urban.drop(dataset_urban.columns.difference(keep_columns), 1, inplace=True)
# dataset = pd.merge([dataset_whites, dataset_blacks, dataset_urban])
print(dataset_whites.shape)
print("Time: "+str(time() - start)+" seconds")
with open('../data/union/ua_data.json', 'w') as outfile:
	outfile.write(dataset_whites.to_json(orient = 'records'))