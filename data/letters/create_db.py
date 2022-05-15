import sqlite3

sqlite_file = 'db_letters.sqlite'    # name of the sqlite database file
table_name1 = 'ngrams'  # name of the table to be created

# Connecting to the database file
conn = sqlite3.connect(sqlite_file)
c = conn.cursor()

# Creating a new SQLite table with 1 column
c.execute('CREATE TABLE ngrams (id INTEGER PRIMARY KEY, term TEXT)')
c.execute('CREATE TABLE counts (id INTEGER, count INTEGER, month INTEGER, year INTEGER, FOREIGN KEY(id) REFERENCES ngrams(id))')

# Committing changes and closing the connection to the database file
conn.commit()
conn.close()