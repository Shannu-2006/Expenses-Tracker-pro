from datetime import datetime
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
class Budget(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    amount = db.Column(
        db.Integer,
        nullable=False
    )

    month = db.Column(
        db.Integer,
        nullable=False
    )

    year = db.Column(
        db.Integer,
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
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
@app.route('/delete_budget')
def delete_budget():
    if 'user_id' not in session:
        return redirect('/login')

    current_month = datetime.now().month
    current_year = datetime.now().year

    budget = Budget.query.filter_by(
        user_id=session['user_id'],
        month=current_month,
        year=current_year
    ).first()

    if budget:

        db.session.delete(budget)
        db.session.commit()

        flash("Budget deleted successfully!")

    else:

        flash("No budget found for this month.")

    return redirect('/')

    return redirect('/login')
@app.route('/reset_budget')
def reset_budget():

    if 'user_id' not in session:
        return redirect('/login')

    current_month = datetime.now().month
    current_year = datetime.now().year

    budget = Budget.query.filter_by(
        user_id=session['user_id'],
        month=current_month,
        year=current_year
    ).first()

    if budget:

        budget.amount = 0
        db.session.commit()

        flash("Budget reset successfully!")

    else:

        flash("No budget found for this month.")

    return redirect('/')
@app.route('/set_budget', methods=['POST'])
def set_budget():

    if 'user_id' not in session:
        return redirect('/login')

    amount = int(request.form['budget'])

    current_month = datetime.now().month
    current_year = datetime.now().year

    budget = Budget.query.filter_by(
        user_id=session['user_id'],
        month=current_month,
        year=current_year
    ).first()

    if budget:

        budget.amount = amount

    else:

        budget = Budget(
            amount=amount,
            month=current_month,
            year=current_year,
            user_id=session['user_id']
        )

        db.session.add(budget)

    db.session.commit()

    flash("Budget Saved Successfully!")

    return redirect('/')
    current_month = datetime.now().month
    current_year = datetime.now().year

    budget = Budget.query.filter_by(
        user_id=session['user_id'],
        month=current_month,
        year=current_year
    ).first()

    budget_amount = 0

    if budget:
        budget_amount = budget.amount

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

    # -----------------------------
    # Get Current Month Budget
    # -----------------------------

    current_month = datetime.now().month
    current_year = datetime.now().year

    budget = Budget.query.filter_by(
        user_id=session['user_id'],
        month=current_month,
        year=current_year
    ).first()

    budget_amount = 0

    if budget:
        budget_amount = budget.amount

    # -----------------------------
    # Get Expenses
    # -----------------------------

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
    budget_used = total

    remaining_budget = budget_amount - total

    if remaining_budget < 0:
        remaining_budget = 0

       # -----------------------------
    # Budget Progress Percentage
    # -----------------------------

    actual_budget_percentage = 0
    budget_percentage = 0
    budget_status = "healthy"

    if budget_amount > 0:

        actual_budget_percentage = (
            budget_used / budget_amount
        ) * 100

        budget_percentage = min(
            actual_budget_percentage,
            100
        )

        if actual_budget_percentage >= 100:
            budget_status = "danger"

        elif actual_budget_percentage >= 80:
            budget_status = "warning"

        else:
            budget_status = "healthy"

    # -----------------------------
    # Current Budget Information
    # -----------------------------

    month_name = datetime.now().strftime("%B")
    current_year = datetime.now().year

    if budget_amount > 0:
        budget_state = "Active"
    else:
        budget_state = "No Budget Set"

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
        monthly_summary=monthly_summary,
        budget_amount=budget_amount,
        budget_used=budget_used,
        remaining_budget=remaining_budget,
        budget_percentage=budget_percentage,
        budget_status=budget_status,
        actual_budget_percentage=actual_budget_percentage,
        month_name=month_name,
        current_year=current_year,
        budget_state=budget_state
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