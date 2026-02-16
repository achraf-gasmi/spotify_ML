from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .database import get_db
from .models import User
import os
from dotenv import load_dotenv

load_dotenv()

# Pydantic Models for Auth
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-please-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def verify_password(plain_password, hashed_password):
    # Bcrypt has a 72-byte limit. We truncate to avoid ValueError.
    # Note: 72 chars might be > 72 bytes in UTF-8.
    pwd_bytes = plain_password.encode('utf-8')[:71] # Use 71 to be absolutely safe
    try:
        return pwd_context.verify(pwd_bytes, hashed_password)
    except Exception as e:
        print(f"Auth Error (verify): {e}")
        return False

def get_password_hash(password):
    # Bcrypt has a 72-byte limit. We truncate to avoid ValueError.
    pwd_bytes = password.encode('utf-8')[:71]
    try:
        return pwd_context.hash(pwd_bytes)
    except Exception as e:
        print(f"Auth Error (hash): {e}")
        raise e

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
