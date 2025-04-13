import requests
import sqlite3

# Your API key
API_KEY = '683f7e6a2369b52e9a6afb689d3405cf9f08767f94d9eace76bc46942900d9f1'
HEADERS = {'X-API-Key': API_KEY}

# Base URL for the OpenAQ API v3
BASE_URL = "https://api.openaq.org/v3/locations"

# Parameters for the API request
PARAMS = {
    'limit': 100,     # Number of results per page
    'page': 1,        # Starting page
    'country': 'US'   # Country code for the United States
}

# Initialize SQLite database connection
#conn = sqlite3.connect("air_quality.sqlite")
conn = sqlite3.connect("patient.db")
cursor = conn.cursor()

# Create the stations table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY,
    name TEXT,
    country TEXT,
    city TEXT,
    latitude REAL,
    longitude REAL
)
''')

# Function to fetch data from the API
def fetch_data(params):
    response = requests.get(BASE_URL, headers=HEADERS, params=params)
    response.raise_for_status()  # Raise an error for bad status codes
    return response.json()

# Pagination loop to retrieve all pages of data
while True:
    data = fetch_data(PARAMS)
    locations = data.get('results', [])

    if not locations:
        break  # Exit loop if no more data

    # Insert data into the database
    for location in locations:
        station_id = location.get('id')
        name = location.get('name')
        country = location.get('country', {}).get('code')
        city = location.get('locality') or location.get('city')
        coordinates = location.get('coordinates', {})
        latitude = coordinates.get('latitude')
        longitude = coordinates.get('longitude')

        cursor.execute('''
            INSERT OR IGNORE INTO stations (id, name, country, city, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (station_id, name, country, city, latitude, longitude))

    # Commit the current batch of inserts
    conn.commit()

    # Check if there are more pages to fetch
    if len(locations) < PARAMS['limit']:
        break  # No more data to fetch

    # Move to the next page
    PARAMS['page'] += 1

# Close the database connection
conn.close()
