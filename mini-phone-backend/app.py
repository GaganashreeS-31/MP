import os
from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask import request
from datetime import datetime, timedelta, UTC
from google import genai
import json
from bson import ObjectId
from werkzeug.security import check_password_hash
from flask import session
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173","https://mp-alpha-azure.vercel.app"])
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["mini-phone"]

@app.route('/api/ping')
def ping():
    return {'message': 'Mini Phone backend is alive'}

@app.route('/api/db-check')
def db_check():
    try:
        client.admin.command('ping')
        return {'database': 'connected'}
    except Exception as e:
        return {'database': 'connection failed', 'error': str(e)}, 500

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('authenticated'):
            return {'error': 'not authenticated'}, 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/goals', methods=['POST'])
@login_required
def create_goal():
    data = request.get_json()

    timeframe = data.get('timeframe')
    now = datetime.now(UTC)

    if timeframe == 'weekly':
        period_end = now + timedelta(days=7)
    elif timeframe == 'monthly':
        period_end = now + timedelta(days=30)
    else:
        return {'error': 'timeframe must be "weekly" or "monthly"'}, 400

    goal = {
        'title': data.get('title'),
        'timeframe': timeframe,
        'target_count': data.get('target_count'),
        'target_unit': data.get('target_unit'),
        'progress_count': 0,
        'period_start': now,
        'period_end': period_end,
        'created_at': now,
        'status': 'active'
    }

    result = db.goals.insert_one(goal)
    goal['_id'] = str(result.inserted_id)

    return goal, 201

@app.route('/api/goals', methods=['GET'])
@login_required
def get_goals():
    goals = list(db.goals.find({'status': 'active'}))
    for goal in goals:
        goal['_id'] = str(goal['_id'])
    return goals

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.route('/api/todo-chat', methods=['POST'])
@login_required
def todo_chat():
    data = request.get_json()
    user_message = data.get('message')

    active_goals = list(db.goals.find({'status': 'active'}))
    goals_summary = [
        {
            'id': str(g['_id']),
            'title': g['title'],
            'progress_count': g['progress_count'],
            'target_count': g['target_count'],
            'target_unit': g['target_unit']
        }
        for g in active_goals
    ]

    prompt = f"""You are a to-do tracking assistant. The user has these active goals:
{json.dumps(goals_summary)}

The user just sent this daily update: "{user_message}"

Figure out which goal(s) this update applies to, and how much progress to add to each.
Respond with ONLY valid JSON, no other text, in this exact format:
{{
  "matches": [
    {{"goal_id": "the goal's id", "amount": number_to_add}}
  ],
  "reply": "a short friendly confirmation message to show the user"
}}

If the update doesn't clearly match any goal, return an empty matches list and set reply to a short clarifying question asking what the update relates to."""

    response = gemini_client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    raw_text = response.text.strip()
    if raw_text.startswith('```'):
        raw_text = raw_text.split('```')[1].replace('json', '', 1).strip()

    ai_result = json.loads(raw_text)

    for match in ai_result.get('matches', []):
        if ai_result.get('matches'):
            today_str = datetime.now(UTC).strftime('%Y-%m-%d')
        db.activity_log.update_one(
            {'date': today_str},
            {'$set': {'date': today_str}},
            upsert=True
        )
        db.goals.update_one(
            {'_id': ObjectId(match['goal_id'])},
            {'$inc': {'progress_count': match['amount']}}
        )

    return {'reply': ai_result.get('reply')}

@app.route('/api/todos/stats')
@login_required
def todo_stats():
    goals = list(db.goals.find({'status': 'active'}))
    goal_stats = []
    if ai_result.get('matches'):
        today_str = datetime.now(UTC).strftime('%Y-%m-%d')
        db.activity_log.update_one(
            {'date': today_str},
            {'$set': {'date': today_str}},
            upsert=True
        )

    for match in ai_result.get('matches', []):
        db.goals.update_one(
            {'_id': ObjectId(match['goal_id'])},
            {'$inc': {'progress_count': match['amount']}}
        )

    streak = 0
    check_date = datetime.now(UTC)
    while check_date.strftime('%Y-%m-%d') in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return {'goals': goal_stats, 'streak': streak}

@app.route('/api/profile', methods=['POST'])
@login_required
def set_profile():
    data = request.get_json()

    weight = data.get('weight_kg')
    height = data.get('height_cm')
    age = data.get('age')
    sex = data.get('sex')
    activity_level = data.get('activity_level')
    goal = data.get('goal')

    if sex == 'male':
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725
    }
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)

    if goal == 'lose':
        calorie_target = tdee - 500
    elif goal == 'gain':
        calorie_target = tdee + 500
    else:
        calorie_target = tdee

    protein_target = round((calorie_target * 0.30) / 4)
    fat_target = round((calorie_target * 0.30) / 9)
    carbs_target = round((calorie_target * 0.40) / 4)

    profile = {
        'weight_kg': weight,
        'height_cm': height,
        'age': age,
        'sex': sex,
        'activity_level': activity_level,
        'goal': goal,
        'daily_calorie_target': round(calorie_target),
        'protein_target_g': protein_target,
        'carbs_target_g': carbs_target,
        'fat_target_g': fat_target,
        'updated_at': datetime.now(UTC)
    }

    db.user_profile.update_one({}, {'$set': profile}, upsert=True)

    return profile

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    profile = db.user_profile.find_one({})
    if profile:
        profile['_id'] = str(profile['_id'])
        return profile
    return {}, 404

@app.route('/api/food-log', methods=['POST'])
@login_required
def food_log():
    data = request.get_json()
    user_message = data.get('message')
    today_str = datetime.now(UTC).strftime('%Y-%m-%d')

    prompt = f"""You are a food and health logging assistant. The user said: "{user_message}"

First, check if they mentioned their body weight (e.g. "I weigh 60kg" or "weight today is 59.5"). If so, extract it as a number in kg.

Then, extract every distinct food item mentioned (ignore weight mentions here), and which meal it belongs to (breakfast, lunch, snack, or dinner — infer from context, default to "snack" if unclear).
For each food item, estimate calories, protein (g), carbs (g), and fat (g) based on typical serving sizes.

Respond with ONLY valid JSON, no other text, in this exact format:
{{
  "weight_kg": number_or_null,
  "items": [
    {{"food_description": "name and quantity", "meal": "breakfast", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}}
  ],
  "reply": "a short friendly confirmation message summarizing what was logged"
}}"""

    response = gemini_client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    raw_text = response.text.strip()
    if raw_text.startswith('```'):
        raw_text = raw_text.split('```')[1].replace('json', '', 1).strip()

    ai_result = json.loads(raw_text)

    for item in ai_result.get('items', []):
        item['date'] = today_str
        item['logged_at'] = datetime.now(UTC)
        db.food_log.insert_one(item)

    if ai_result.get('weight_kg'):
        db.weight_log.update_one(
            {'date': today_str},
            {'$set': {
                'date': today_str,
                'weight_kg': ai_result['weight_kg'],
                'logged_at': datetime.now(UTC)
            }},
            upsert=True
        )

    return {'reply': ai_result.get('reply')}

@app.route('/api/food-log/today')
@login_required
def food_log_today():
    today_str = datetime.now(UTC).strftime('%Y-%m-%d')
    entries = list(db.food_log.find({'date': today_str}))

    totals = {'calories': 0, 'protein_g': 0, 'carbs_g': 0, 'fat_g': 0}
    for e in entries:
        totals['calories'] += e.get('calories', 0)
        totals['protein_g'] += e.get('protein_g', 0)
        totals['carbs_g'] += e.get('carbs_g', 0)
        totals['fat_g'] += e.get('fat_g', 0)
        e['_id'] = str(e['_id'])

    profile = db.user_profile.find_one({})
    calorie_target = profile.get('daily_calorie_target', 0) if profile else 0

    return {
        'entries': entries,
        'totals': totals,
        'calorie_target': calorie_target,
        'remaining': calorie_target - totals['calories']
    }

@app.route('/api/food-log/trends')
@login_required
def food_log_trends():
    seven_days_ago = (datetime.now(UTC) - timedelta(days=7)).strftime('%Y-%m-%d')

    food_entries = list(db.food_log.find({'date': {'$gte': seven_days_ago}}))
    daily_calories = {}
    for e in food_entries:
        d = e['date']
        daily_calories[d] = daily_calories.get(d, 0) + e.get('calories', 0)

    weight_entries = list(
        db.weight_log.find({'date': {'$gte': seven_days_ago}}).sort('date', 1)
    )
    weight_trend = [
        {'date': w['date'], 'weight_kg': w['weight_kg']}
        for w in weight_entries
    ]

    return {
        'daily_calories': daily_calories,
        'weight_trend': weight_trend
    }

@app.route('/api/food-log/saved-foods')
@login_required
def saved_foods():
    query = request.args.get('query', '').lower()
    all_entries = list(db.food_log.find().sort('logged_at', -1))

    seen = {}
    for e in all_entries:
        key = e['food_description'].lower()
        if key not in seen:
            seen[key] = e

    results = []
    for key, e in seen.items():
        if query in key:
            results.append({
                'food_description': e['food_description'],
                'meal': e['meal'],
                'calories': e['calories'],
                'protein_g': e['protein_g'],
                'carbs_g': e['carbs_g'],
                'fat_g': e['fat_g'],
            })

    return results[:20]

@app.route('/api/food-log/quick-add', methods=['POST'])
@login_required
def quick_add_food():
    data = request.get_json()
    today_str = datetime.now(UTC).strftime('%Y-%m-%d')

    entry = {
        'food_description': data.get('food_description'),
        'meal': data.get('meal'),
        'calories': data.get('calories'),
        'protein_g': data.get('protein_g'),
        'carbs_g': data.get('carbs_g'),
        'fat_g': data.get('fat_g'),
        'date': today_str,
        'logged_at': datetime.now(UTC)
    }

    db.food_log.insert_one(entry)
    return {'message': 'added'}, 201

@app.route('/api/food-log/progress')
@login_required
def food_log_progress():
    range_param = request.args.get('range', 'week')
    today = datetime.now(UTC)

    if range_param == 'today':
        start = end = today
    elif range_param == 'yesterday':
        start = end = today - timedelta(days=1)
    elif range_param == 'custom':
        start = datetime.strptime(request.args.get('start'), '%Y-%m-%d')
        end = datetime.strptime(request.args.get('end'), '%Y-%m-%d')
    else:
        start = today - timedelta(days=6)
        end = today

    start_str = start.strftime('%Y-%m-%d')
    end_str = end.strftime('%Y-%m-%d')

    entries = list(
        db.food_log.find({'date': {'$gte': start_str, '$lte': end_str}})
    )

    daily_calories = {}
    for e in entries:
        daily_calories[e['date']] = daily_calories.get(e['date'], 0) + e.get('calories', 0)

    days_logged = len(daily_calories)
    total_calories = sum(daily_calories.values())
    avg_calories = round(total_calories / days_logged) if days_logged else 0

    activity_dates = set(
        e['date'] for e in db.food_log.find({}, {'date': 1})
    )

    streak = 0
    check_date = today

    while check_date.strftime('%Y-%m-%d') in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return {
        'daily_calories': daily_calories,
        'days_logged': days_logged,
        'avg_calories': avg_calories,
        'streak': streak
    }

@app.route('/api/todos/progress')
@login_required
def todos_progress():
    range_param = request.args.get('range', 'week')
    today = datetime.now(UTC)

    if range_param == 'today':
        start = end = today
    elif range_param == 'yesterday':
        start = end = today - timedelta(days=1)
    elif range_param == 'custom':
        start = datetime.strptime(request.args.get('start'), '%Y-%m-%d')
        end = datetime.strptime(request.args.get('end'), '%Y-%m-%d')
    else:
        start = today - timedelta(days=6)
        end = today

    start_str = start.strftime('%Y-%m-%d')
    end_str = end.strftime('%Y-%m-%d')

    days_logged = db.activity_log.count_documents(
        {'date': {'$gte': start_str, '$lte': end_str}}
    )

    activity_dates = set(
        e['date'] for e in db.activity_log.find({}, {'date': 1})
    )

    streak = 0
    check_date = today

    while check_date.strftime('%Y-%m-%d') in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return {
        'days_logged': days_logged,
        'streak': streak
    }

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')

    if check_password_hash(os.getenv("PASSWORD_HASH"), password):
        session['authenticated'] = True
        return {'message': 'logged in'}
    else:
        return {'error': 'incorrect password'}, 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('authenticated', None)
    return {'message': 'logged out'}

@app.route('/api/auth-check')
def auth_check():
    return {'authenticated': bool(session.get('authenticated'))}

@app.route('/api/goals/<goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    db.goals.delete_one({'_id': ObjectId(goal_id)})
    return {'message': 'deleted'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)