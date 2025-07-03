from flask import Flask, request, jsonify

app = Flask(__name__)
sessions = {}

@app.route('/webhook', methods=['POST'])
def telegram_webhook():
    data = request.json
    if 'callback_query' in data:
        cb = data['callback_query']
        action, session_id = cb['data'].split('_', 1)
        sessions[session_id] = 'approved' if action == 'approve' else 'rejected'
    return jsonify(ok=True)

@app.route('/check/<session_id>', methods=['GET'])
def check_approval(session_id):
    return jsonify(status=sessions.get(session_id, 'waiting'))

if __name__ == '__main__':
    app.run(port=5000)
