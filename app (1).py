from flask import Flask, render_template, jsonify, request
import sqlite3
import os
from functools import wraps
import json

app = Flask(__name__)

# Database helper functions
def get_db_connection():
    """Create a database connection and return the connection object"""
    conn = sqlite3.connect('patient.db')
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    return conn

def query_db(query, args=(), one=False):
    """Query the database and return results as dictionaries"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        rv = [dict(row) for row in cur.fetchall()]
        conn.commit()
        return (rv[0] if rv else None) if one else rv
    finally:
        conn.close()

# Error handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error="Internal server error"), 500

# Routes
@app.route("/")
def index():
    """Render the main dashboard page"""
    return render_template("index.html")

@app.route("/api/data")
def get_data():
    """API endpoint to get all patient data"""
    try:
        print("handling /api/data endpoint")

        # Get patients data
        patients = query_db("SELECT * FROM patientinfo")
        
        # Format data for frontend
        formatted_data = []
        for patient in patients:
            formatted_data.append({
                'id': patient['id'],
                'Disease': patient['Disease'],
                'Fever': patient['Fever'],
                'Cough': patient['Cough'],
                'Fatigue': patient['Fatigue'],
                'Difficulty_Breathing': patient['Difficulty_Breathing'],
                'Age': patient['Age'],
                'Gender': patient['Gender'],
                'Blood_Pressure': patient['Blood_Pressure'],
                'Cholesterol_Level': patient['Cholesterol_Level'],
                'Outcome_Variable': patient['Outcome_Variable']
            })
        
        return jsonify(formatted_data)
    except Exception as e:
        app.logger.error(f"Error fetching data: {str(e)}")
        return jsonify({"error": "Failed to fetch data"}), 500


@app.route("/api/patients")
def get_patients():
    """API endpoint to get patient information with filtering options"""
    try:
        print("handling /api/patients endpoint")
        gender = request.args.get('gender', 'All')
          
        # Filter patients by gender
        query = "SELECT * FROM patientinfo"
        params = []
        
        if gender  :
            if gender != "All" :
                query += " WHERE Gender = ?"
                params.append(gender)
        
        print("query=" + query + ", params=" + str(params))

        # Execute query with filters
        patients = query_db(query, params)
        
        return jsonify(patients)
    except Exception as e:
        app.logger.error(f"Error fetching patients: {str(e)}")
        return jsonify({"error": "Failed to fetch patients"}), 500


if __name__ == "__main__":
    # Enable debug mode in development environment
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    #debug_mode = True
    app.run(debug=debug_mode)
