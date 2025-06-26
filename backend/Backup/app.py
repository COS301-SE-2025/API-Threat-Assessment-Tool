from flask import Flask, jsonify, request
import test_api_authentication

app = Flask(__name__)

@app.route('/api/test-authentication', methods=['POST'])
def test_authentication():
    data = request.json
    url = data.get('url')
    auth_credentials = data.get('auth_credentials')

    if not url or not auth_credentials:
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        test_api_authentication.test_api_authentication(url, auth_credentials)
        return jsonify({'message': 'Authentication test successful'}), 200
    except AssertionError as e:
        return jsonify({'error': 'Authentication test failed'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8001)
