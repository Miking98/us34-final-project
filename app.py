from flask import Flask, redirect, render_template, request
import datetime
import random
from flask_login import LoginManager, login_required, login_user, logout_user
import os

from models import User, db

# Core Flask
app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# Flask-SQLAlchemy
if os.environ.get('IS_HEROKU'):
	uri = os.getenv("DATABASE_URL")  # or other relevant config var
	if uri and uri.startswith("postgres://"):
		uri = uri.replace("postgres://", "postgresql://", 1)
	app.config['SQLALCHEMY_DATABASE_URI'] = uri
else:
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db.init_app(app)

@login_manager.user_loader
def user_loader(user_id):
	# Need to convert user_id (str) -> (int) b/c looking up a "db.Integer"
	return User.query.get(int(user_id))

@app.route("/")
@app.route("/index")
def index():
	return render_template('index.html')

@app.route("/about")
def about():
	return render_template('about.html')

@app.route("/lottery")
@login_required
def lottery():
	winning_num = random.randint(0, 20)
	random_nums = [ random.randint(0, 20) for x in range(5) ]
	random_name = random.sample(['nice', 'generous', 'smart', 'kind'], 1)[0]
	return render_template('lottery.html', 
						winning_num=winning_num, 
						random_nums=random_nums, 
						random_name=random_name)

@app.route("/login", methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		data = request.form
		email = data.get('email')
		password = data.get('password')
		user = User.query.filter_by(email=email).first()
		if (
			(email is not None)
			and (password is not None) 
			and (user is not None)
			and (user.password == password)
		):
			# Valid password!
			login_user(user, remember=1)
			return redirect('index')
		else:
			# Invalid
			return render_template('login.html', is_error=True)
	return render_template('login.html')

@app.route("/logout")
@login_required
def logout():
	logout_user()
	return redirect('index')

@app.route("/register", methods=['GET', 'POST'])
def register():
	if request.method == 'POST':
		data = request.form
		email = data.get('email')
		password = data.get('password')
		user = User.query.filter_by(email=email).first()
		if (
			(email is not None)
			and (password is not None)
			and len(email) > 0
			and len(password) > 0
			and (user is None)
		):
			# Create new user
			user = User(email=email, password=password)
			db.session.add(user)
			db.session.commit()
			return render_template('register.html', is_success=True)
		else:
			# Invalid
			return render_template('register.html', is_error=True)
	return render_template('register.html')

@app.route("/feedback", methods=['GET', 'POST'])
def feedback():
	if request.method == 'POST':
		# Parse POST'd data
		data = request.form
		email = data.get('email')
		feedback = data.get('feedback')
		print("Email:", email)
		print("Feedback:", feedback)
		# Validate data
		if len(feedback) == 0 or len(email) == 0:
			return render_template('feedback.html', is_error=True)
		return render_template('feedback.html', is_success=True)
	else:
		# Return usual page for a GET request
		return render_template('feedback.html')

@app.context_processor
def inject_current_year():
	return {'current_year': datetime.date.today().year}

if __name__ == '__main__':
	app.run(debug=True,
			port=5000)
