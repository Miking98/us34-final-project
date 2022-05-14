from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password = db.Column(db.String(1000), unique=False, nullable=False)
    email = db.Column(db.String(1000), unique=True, nullable=False)

    def __repr__(self):
        return '<User %r>' % self.email