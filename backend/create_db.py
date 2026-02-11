import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
import sys

# Force stdout to utf-8
sys.stdout.reconfigure(encoding='utf-8')

# Don't load .env yet, we want to try our own passwords
# load_dotenv()

COMMON_PASSWORDS = ['postgres', 'root', 'admin', 'password', '1234', '']

def try_connect(password):
    print(f"Trying password: '{password}'...")
    try:
        con = psycopg2.connect(
            dbname='postgres', 
            user='postgres', 
            host='localhost', 
            password=password,
            port=5432
        )
        con.close()
        return True
    except psycopg2.OperationalError as e:
        # Check if it's an authentication error
        msg = str(e)
        if "password authentication failed" in msg or "authentification" in msg.lower():
            return False
        # If it's a connection refused, postgres might not be running at all
        print(f"Connection error (not auth): {msg}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def update_env_file(password):
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    print(f"Updating {env_path} with found password...")
    
    new_url = f"DATABASE_URL=postgresql://postgres:{password}@localhost/spotify_db"
    
    with open(env_path, 'w') as f:
        f.write(new_url)
    print("Updated .env successfully.")

def main():
    print("Attempting to find PostgreSQL password...")
    
    found_password = None
    
    for pwd in COMMON_PASSWORDS:
        if try_connect(pwd):
            print(f"SUCCESS! Password is '{pwd}'")
            found_password = pwd
            break
            
    if found_password is not None:
        update_env_file(found_password)
        # Now create the DB
        create_database(found_password)
    else:
        print("Could not find correct password in common list.")
        print("Please manually update .env with the correct password.")

def create_database(password):
    try:
        con = psycopg2.connect(
            dbname='postgres', 
            user='postgres', 
            host='localhost', 
            password=password,
            port=5432
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        database = 'spotify_db'
        print(f"Checking if database '{database}' exists...")
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{database}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {database}...")
            cur.execute(f"CREATE DATABASE {database}")
            print(f"Database {database} created.")
        else:
            print(f"Database {database} already exists.")
            
        cur.close()
        con.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    main()
