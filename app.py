from flask import (
    Flask,
    render_template,
    request,
    redirect,
    flash,
    session
)

from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

app = Flask(__name__)
app.secret_key = "expense_tracker_secret"

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expenses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )


class Expense(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    amount = db.Column(
        db.Integer,
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

@app.route('/register', methods=['GET', 'POST'])
def register():

    if request.method == 'POST':

        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if password != confirm_password:
            flash("Passwords do not match")
            return redirect('/register')

        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:
            flash("Email already exists")
            return redirect('/register')
        existing_username = User.query.filter_by(
            username=username
        ).first()

        if existing_username:
            flash("Username already exists")
            return redirect('/register')

        hashed_password = generate_password_hash(
            password
        )

        user = User(
            username=username,
            email=email,
            password=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        flash("Registration Successful")

        return redirect('/login')

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':

        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(
            email=email
        ).first()

        if user and check_password_hash(
            user.password,
            password
        ):

            session['user_id'] = user.id
            session['username'] = user.username

            return redirect('/')

        flash("Invalid Email or Password")

    return render_template('login.html')

@app.route('/logout')
def logout():

    session.clear()

    return redirect('/login')


with app.app_context():
    db.create_all()


@app.route('/', methods=['GET', 'POST'])
def home():

    if 'user_id' not in session:
        return redirect('/login')

    if request.method == 'POST':

        name = request.form['name']
        amount = request.form['amount']
        category = request.form['category']

        
        expense = Expense(
            name=name,
            amount=int(amount),
            category=category,
            user_id=session['user_id']
    )

        db.session.add(expense)
        db.session.commit()

        flash("Expense added successfully!")

        return redirect('/')

    expenses = Expense.query.filter_by(
        user_id=session['user_id']
    ).order_by(
        Expense.id.desc()
    ).all()

    total = sum(
        expense.amount
        for expense in expenses
    )

    transaction_count = len(expenses)

    highest_expense = max(
        [expense.amount for expense in expenses],
        default=0
    )

    average_expense = (
        total // transaction_count
        if transaction_count > 0
        else 0
    )

    category_totals = {
        "Food": 0,
        "Travel": 0,
        "Rent": 0,
        "Shopping": 0,
        "Fun": 0,
        "Other": 0
    }

    for expense in expenses:

        if expense.category in category_totals:
            category_totals[
                expense.category
            ] += expense.amount

    highest_category = max(
        category_totals,
        key=category_totals.get
    )

    highest_category_amount = (
        category_totals[highest_category]
    )

    monthly_summary = {
        "total": total,
        "transactions": transaction_count,
        "highest_expense": highest_expense,
        "average_expense": average_expense
    }

    return render_template(
        'index.html',
        expenses=expenses,
        total=total,
        transaction_count=transaction_count,
        highest_expense=highest_expense,
        average_expense=average_expense,
        category_totals=category_totals,
        highest_category=highest_category,
        highest_category_amount=highest_category_amount,
        monthly_summary=monthly_summary
    )


@app.route('/update/<int:id>', methods=['POST'])
def update(id):

    if 'user_id' not in session:
        return redirect('/login')

    expense = Expense.query.filter_by(
        id=id,
        user_id=session['user_id']
    ).first_or_404()

    expense.name = request.form['name']
    expense.amount = int(
        request.form['amount']
    )
    expense.category = request.form['category']

    db.session.commit()

    flash("Expense updated successfully!")

    return redirect('/')


@app.route('/delete/<int:id>')
def delete(id):

    if 'user_id' not in session:
        return redirect('/login')

    expense = Expense.query.filter_by(
        id=id,
        user_id=session['user_id']
    ).first_or_404()

    db.session.delete(expense)
    db.session.commit()

    flash("Expense deleted successfully!")

    return redirect('/')


if __name__ == '__main__':
    app.run(debug=True)