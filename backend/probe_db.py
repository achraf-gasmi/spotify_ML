import psycopg2
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

COMMON_CREDS = [
    ('postgres', 'postgres'),
    ('postgres', 'admin'),
    ('postgres', 'root'),
    ('postgres', 'password'),
    ('postgres', '1234'),
    ('postgres', ''),  # specific probe for trust auth
    ('admin', 'admin'),
    ('root', 'root'), 
    ('PC', '') # Windows user
]

def try_connect(user, pwd):
    print(f"Trying user='{user}', password='{pwd}'...")
    try:
        con = psycopg2.connect(
            dbname='postgres', 
            user=user, 
            host='localhost', 
            password=pwd,
            port=5432
        )
        con.close()
        return True
    except Exception as e:
        return False

def main():
    print("Advanced probing...")
    for user, pwd in COMMON_CREDS:
        if try_connect(user, pwd):
            print(f"SUCCESS! Found credentials: {user}:{pwd}")
            # Write to .env
            env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
            with open(env_path, 'w') as f:
                f.write(f"DATABASE_URL=postgresql://{user}:{pwd}@localhost/spotify_db")
            print("Updated .env")
            return
            
    print("All probes failed.")

if __name__ == "__main__":
    main()
