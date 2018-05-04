import json
import operator
import dateutil.parser
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import nltk
import string
from time import time
import sqlite3



sqlite_file = 'db_letters.sqlite'    # name of the sqlite database file
table_name1 = 'ngrams'  # name of the table to be created

# Connecting to the database file
conn = sqlite3.connect(sqlite_file)
c = conn.cursor()

START_YEAR = 1860
END_YEAR = 1865
NUM_YEARS = END_YEAR - START_YEAR + 1
NUM_seasonS = 12

dataset_warofrebellion = json.load(open('geographically-annotated-civil-war-corpus-by-vol.json'))
dataset_theo = pd.read_csv('theo.csv').to_dict('records')

words = {} # Maps strings => Array of years (1860-65), where each index is an Array of seasons (0-3), and each index number of occurences of that string in letters written that year
'''
words = {
    'God' : [   0 => [  0 => 12,
                        1 => 11,
                        ...
                        3 => 2
                ],
                1 => [  0 => 12,
                        1 => 11,
                        ...
                        3 => 2
                ],
                ...
                5 => [  0 => 12,
                        1 => 11,
                        ...
                        3 => 2
                ],
            ],
    'the,man' : [
                ...
            ],
}
'''


######################################################
######################################################
#   READ DATASOURCES, STORE IN PYTHON DICTIONARIES   #
######################################################
######################################################

FRESH_READ_DATA = True

MAX_NGRAM_SIZE = 2
START_YEAR = 1860
END_YEAR = 1865
NUM_YEARS = END_YEAR - START_YEAR + 1
NUM_SEASONS = 1

def count_words(words, letter_counts, date, text, ngram_size):
    # Get array-friendly version of letter date
    season, year = parse_date(date)
    # Make sure "date" parameter is specified for letter
    if season is None or year is None:
        return
    # Increment number of letters written in this seaons/year
    letter_counts[year][season] += 1

    # Store each individual word in word_counts array, where [0] => word, [1] => count
    word_counts = {}
    words_in_text = nltk.word_tokenize(text.translate(str.maketrans('','',string.punctuation)))
    for word in nltk.ngrams(words_in_text, ngram_size):
        # Make ngram
        w = []
        for i in range(ngram_size):
            w.append(word[i].lower())
        w = ','.join(w)
        # Add ngram to word_counts
        if w not in word_counts:
            word_counts[w] = 0
        word_counts[w] += 1
    # Store words in main array
    for w, c in word_counts.items():
        # Check if w is already in words array; If not, fill in element with array to store year and season counts
        if w not in words:
            words[w] = [ [ 0 for _ in range(NUM_SEASONS) ] for _ in range(NUM_YEARS) ]
        # Add count of w to proper location in words dictionary
        words[w][year][season] += c

# Input: String of format "december 20, 1860"
# Output: Season and Year, scaled down for array, i.e. 
#   season (0-11), year (1860-1865)
def parse_date(s):
    if s == '':
        return None, None
    year_encoded = dateutil.parser.parse(s).year-START_YEAR
    if year_encoded < 0 or year_encoded > 5:
        return None, None
    month = dateutil.parser.parse(s).month-1
    season_encoded = 0 #month;
    return season_encoded, year_encoded

ngrams = [] # Array of words, by ngram size, where [0] => { words } and 0 = ngram size of 1
letter_counts = [ [ 0 for _ in range(NUM_SEASONS) ] for _ in range(NUM_YEARS) ] # Array of count of letters by season/year

start = time()
if FRESH_READ_DATA:
    dataset_warofrebellion = json.load(open('geographically-annotated-civil-war-corpus-by-vol.json'))
    dataset_theo = pd.read_csv('theo.csv').to_dict('records')
    dataset_theo_2 = pd.read_csv('theo2.csv').to_dict('records')

    for ngram_size in range(1, MAX_NGRAM_SIZE+1):
        words = {} # Maps strings => Array of years (1860-65), where each index is an Array of seasons (0-11), and each index number of occurences of that string in letters written that year

        letter_counts = [ [ 0 for _ in range(NUM_SEASONS) ] for _ in range(NUM_YEARS) ]

        ######################################################
        #   READ DATASOURCES, STORE IN PYTHON DICTIONARIES   #
        ######################################################
        #
        # # Go through War of Rebellion dataset
        for volume in dataset_warofrebellion:
            # Parse JSON
            num = volume['vol']
            contents = volume['spans']
            
            for letter in contents:
                # Parse JSON
                span = letter['span']
                text = letter['text']
                centroid = letter['centroid']
                date = letter['date']
                counts = letter['counts']

                # Count words in text
                count_words(words, letter_counts, date, text, ngram_size)
        #
        # Go through Theo's letter dataset
        for letter in dataset_theo:
            side = letter['side']
            text = letter['text']
            date = letter['date']

            if date is None or side is None or text is None:
                continue

            # Count words in text
            count_words(words, letter_counts, date, text, ngram_size)
        #
        # Go through Theo's second letter dataset
        for letter in dataset_theo_2:
            text = letter['text']
            date = letter['date']

            if date is None or text is None:
                continue

            # Count words in text
            count_words(words, letter_counts, date, text, ngram_size)

        ngrams.append(words)

    with open('ngrams_byyear_max_2.json', 'w') as outfile:
        json.dump(ngrams, outfile)
    with open('letter_counts_byyear_max_2.json', 'w') as outfile:
        json.dump(letter_counts, outfile)
    print("Done JSON dumping")
else:
    with open('ngrams_byyear_max_2.json', 'r') as infile:
        ngrams = json.load(infile)
    with open('letter_counts_byyear_max_2.json', 'r') as infile:
        letter_counts = json.load(infile)

print("DONE READING")

WRITE_TO_CSV = True
if WRITE_TO_CSV:
    with open('ngrams_byyear_max_2.csv', 'w') as outfile:
        outfile.write('term' + "," + 'year_0' + "," + 'year_1' + "," + 'year_2' + "," + 'year_3' + "," + 'year_4' + "," + 'year_5\n')
        for words in ngrams:
            for term, info in words.items():
                outfile.write(term.replace(',','-') + "," + str(info[0][0]) + "," + str(info[1][0]) + "," + str(info[2][0]) + "," + str(info[3][0]) + "," + str(info[4][0]) + "," + str(info[5][0])+'\n')
    outfile.close()

print("Time: "+str(time() - start)+" seconds")

exit()

# Write ngrams to SQLite3 databse
WRITE_TO_DB = False
if WRITE_TO_DB:
    for words in ngrams:
        for term, info in words.items():
            print(term)
            print(info)
            c.execute('INSERT INTO ngrams (term) VALUES (?)', (term,))
            term_id = c.lastrowid
            for year, year_data in enumerate(info):
                for month, month_data in enumerate(year_data):
                    count = month_data
                    c.execute('INSERT INTO counts (id, count, month, year) VALUES (?,?,?,?)', (term_id, count, month, year))
# Committing changes and closing the connection to the database file
conn.commit()
conn.close()

print("Done writing to SQLite database")

######################################################
######################################################
#                ANALYSIS OF WORD CHOICE             #
######################################################
######################################################


# Flag interesting terms (with high counts or dropoffs)
totals = {} # Maps word => total count over all years
changes = {}
words = ngrams[0]
for w in words:
    info = words[w]
    year_counts = []
    for year in info:
        # Sum up counts of this term for all seasons of year, adjusted for # of letters written in year
        year_counts.append(np.sum(year))
    total = np.sum(year_counts)
    totals[w] = total
    change = np.abs(np.sum(year_counts[0:3])/float(np.sum(letter_counts[0:3])) - np.sum(year_counts[3:])/float(np.sum(letter_counts[3:])))
    changes[w] = change

# Print top 10 most used terms
totals = sorted(totals.items(), key=operator.itemgetter(1), reverse = True)
print(totals[0:10])

# Print top 10 most changed terms
changes = sorted(changes.items(), key=operator.itemgetter(1), reverse = True)
print(changes[0:10])


######################################################
######################################################
#                    MAKE PLOTS                      #
######################################################
######################################################


# Make plots
term = 'god'
granularity = 'year'
x_vals = []
y_vals = []
if granularity == 'year':
    # Set x_vals to be years
    x_vals = [ x for x in range(START_YEAR, END_YEAR+1) ]
    # Set y_vals to be count of word over course of entire year (all 12 seasons)
    info = words[term]
    for year, year_counts in enumerate(info):
        print(year_counts)
        # Mentions per letter of term: Sum up counts of term for all seasons of year, divide by # of letters per year
        y_vals.append(np.sum(year_counts)/float(np.sum(letter_counts[year])))
elif granularity == 'season':
    pass
elif granularity == 'season':
    pass
else:
    print("ERROR: Invalid granularity")

plt.title("Change in frequency of the term \""+term+"\" from 1860-5 in Civil War military correspondence")
plt.xlabel("Year" if granularity == 'year' else "season" if granularity == "season" else "Season" if granularity == "season" else "Invalid granularity")
plt.ylabel("Mentions per letter")
plt.plot(x_vals, y_vals, 's')
plt.show()






