import sqlite3



def get_db():
    db = sqlite3.connect('https://s3.amazonaws.com/us34finalproject/db_letters.sqlite')
    db.row_factory = sqlite3.Row
    return db

def query_db(conn, query, args=(), one=False):
    cur = conn.execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

conn = get_db()

for user in query_db(conn, 'select id, term from ngrams LIMIT 1'):
    print(user['term'], 'has the id', user['id'])
