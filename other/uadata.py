'''
Data from: http://uadata.org/complete_downloads/#
'''

import json
import operator
import dateutil.parser
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import json

dataset = pd.read_csv('/Users/mwornow/Desktop/usdata/cen_all_csv/cen_union_army_whites.csv', nrows = 100)

state_info = {}
states = dataset['stanam_5'].unique()
for s in states:
    subset = dataset['stanam_5']

    # Data points
    count = subset.value_counts()
    married = subset.count('recmar')
    profession = subset.count('recocc')
    val_realestate = subset.count('reclan')
    val_personalprop = subset.count('recprp')

    states_info[s] = { 'count' : count,
                        }

print(list(dataset.columns.values))

print(.to_dict())






