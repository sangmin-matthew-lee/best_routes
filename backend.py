from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from database import initialize_db 
import sqlite3
import requests
import hashlib
import os

# Initialize database
initialize_db()

# Set environment variables
load_dotenv()
GOOGLE_MAPS_PLATFORM_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
DATABASE = os.getenv("DATABASE_URL")

app = FastAPI (
    title = "Best Routes",
    description="Web-based Application for optimizing routes using Google Maps Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#FastAPI BaseModel classes
class Register(BaseModel):
    username : str
    password : str

class Login(BaseModel):
    username : str
    password : str

class OptimizeRoutesRequest(BaseModel):
    address_ids : List[int]
    start_address_id : int
    stop_address_id : int
    user_id : int = None    #Need to change only when user log in

#Database
def get_db():
    db_path = os.getenv("DATABASE_URL", "sqlite:///routesOptimizeApp.db").replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

#Get actual address by address_id in the database
def get_address_by_id(db, address_id:int):
    cursor = db.execute("SELECT address FROM addresses WHERE id = ?", (address_id,))
    row = cursor.fetchone()
    if row:
        return row["address"]
    else:
        return None
    
#User register - Encryt user's password to the hash value
def encrypt_password(password:str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

#Using Google Maps Platform, get optimized routes based on time and distance
#https://developers.google.com/maps/documentation/directions/get-directions
def optimize_routes(addresses: List[str], start: str, end: str):
    waypoints = "|".join(addresses)
    #Get shortest distance routes
    optimize_distance_base = f"https://maps.googleapis.com/maps/api/directions/json?origin={start}&destination={end}&waypoints=optimize:true|{waypoints}&key={GOOGLE_MAPS_PLATFORM_API_KEY}"
    
    #Make sure "departure_time" to get time based routes - It's advanced route method that I have to pay...
    #optimize_time_base = f"https://maps.googleapis.com/maps/api/directions/json?departure_time=now&origin={start}&destination={end}&waypoints=optimize:true|{waypoints}&key={GOOGLE_MAPS_PLATFORM_API_KEY}"
    
    #Replacing to distance routes request
    optimize_time_base = f"https://maps.googleapis.com/maps/api/directions/json?origin={start}&destination={end}&waypoints=optimize:true|{waypoints}&key={GOOGLE_MAPS_PLATFORM_API_KEY}"

    distance = requests.get(optimize_distance_base).json()
    time = requests.get(optimize_time_base).json()

    #Get only addresses
    if distance["routes"]:
        only_addresses_distance = distance["routes"][0]["waypoint_order"]
    else:
        only_addresses_distance = []

    if time["routes"]:
        only_addresses_time = time["routes"][0]["waypoint_order"]
    else:
        only_addresses_distance = []

    #get ordered formatted addresses
    optimized_routes_based_on_distance = []
    for i in only_addresses_distance:
        optimized_routes_based_on_distance.append(addresses[i])
    
    optimized_routes_based_on_time = []
    for i in only_addresses_time:
        optimized_routes_based_on_time.append(addresses[i])

    return optimized_routes_based_on_distance, optimized_routes_based_on_time

@app.get("/")
def root():
    return {"message": "Welcome to the Best Routes App!"}

@app.post("/api/users/register")
def register(register_user: Register, db : sqlite3.Connection = Depends(get_db)):
    encryted_password = encrypt_password(register_user.password)
    cursor = db.execute("INSERT INTO users (username, password) VALUES (?,?)", (register_user.username, encryted_password))
    db.commit()
    
    print("Thank you for being valuable member of FindRoutes!")
    print(f"Your user id is {cursor.lastrowid}")
    output = {
        "user_id":cursor.lastrowid
    }
    return output


@app.post("/api/users/login")
def login(login_user: Login, db : sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT id, username, password FROM users WHERE username = ?", (login_user.username, ))
    row = cursor.fetchone()
    
    #Check if user's username is correct
    if not row:
        raise HTTPException(status_code=401, detail="Invalid input - Please check your username")
    
    #Check if user's password is correct
    password = encrypt_password(login_user.password)
    if row["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid input - Please check your password")
    else:
        print(f"Welcome {login_user.username}!")
        output = {
            "user_id": row["id"],
            "username": row["username"]
        }
        return output

@app.get("/api/users")
def get_all_users(db : sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT id,username FROM users")
    rows = cursor.fetchall()
    
    if not rows:
        raise HTTPException(status_code=404, detail="Users not found")
    
    users = []
    for row in rows:
        users.append(dict(row))

    print("Get all users method success")
    return {"users" : users}

@app.get("/api/users/{user_id}")
def get_user_by_id(user_id:int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    else:
        print("Get user by id method success")
        return {"user" : dict(row)}

#===============For testing start===============
@app.get("/api/addresses")
def get_all_address(db:sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT id, address FROM addresses")
    rows = cursor.fetchall()
    print(rows)
    if not rows:
        raise HTTPException(status_code=404, detail="Addresses not found")
    
    addresses = []
    for address  in rows:
        addresses.append(dict(address))

    print("Get all addresses method success")
    return {"addresses": addresses}
    
@app.get("/api/addresses/{address_id}")
def get_address_by_id_t(address_id:int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT id, address FROM addresses WHERE id = ? ", (address_id,))
    row =cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Address not found")
    else:
        print("Get address by id method success")
        return {"address" : dict(row)}
#===============For testing end===============

@app.post("/api/address/")
def add_address_to_db(address:str, db:sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("INSERT INTO addresses (address) VALUES (?)", (address,))
    db.commit()

    print(f"address ID - {cursor.lastrowid}")
    return {"address_id":cursor.lastrowid}

@app.post("/api/routes/optimize/")
def request_optimize_route(optimize_route_request : OptimizeRoutesRequest, db: sqlite3.Connection = Depends(get_db)):
    #1. Get all actual address by address_id
    actual_addresses = []
    for address_id in optimize_route_request.address_ids:
        address = get_address_by_id(db,address_id)
        if not address:
            raise HTTPException(status_code=404, detail= f"Address ID {address_id} is not found")
        actual_addresses.append(address)
    
    if not actual_addresses:
        raise HTTPException(status_code=400, detail="At least one address id is invalid.")

    #2. Set start and end addresses
    start_address =  get_address_by_id(db, optimize_route_request.start_address_id)
    stop_address =  get_address_by_id(db, optimize_route_request.stop_address_id)

    if not start_address:
        raise HTTPException(status_code=400, detail="Invalid start address id")
    if not stop_address:
        raise HTTPException(status_code=400, detail="Invalid stop address id")
    
    #get optimized routes using Google Maps API. Note:Return to JSON file
    route_distance, route_time = optimize_routes(actual_addresses,start_address,stop_address)

    #Save the routes if user log in
    address_ids = ",".join(map(str,optimize_route_request.address_ids))
    if optimize_route_request.user_id:
        db.execute("INSERT INTO routes (user_id, start_id, end_id, address_ids, distance_route, time_route) VALUES (?, ?, ?, ?, ?, ?)",
                        (
                        optimize_route_request.user_id,
                        optimize_route_request.start_address_id,
                        optimize_route_request.stop_address_id,
                        address_ids,
                        str(route_distance),
                        str(route_time)
                        ) 
                   )
        db.commit()

    print(f"The best route for distance is: {route_distance}")
    print(f"The best route for time is: {route_time}")
    if optimize_route_request:
        message = "Routes have been saved to the database"
    else:
        message = "Routes are saved (Guest's request)"

    output = {
        "Optimized based on distance": route_distance,
        "Optimized based on time" : route_time,
        "message" : message
    }

    return output

@app.get("/api/users/{user_id}/records")
def get_records(user_id :int, db:sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("SELECT * FROM routes WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    
    if not rows:
        raise HTTPException(status_code=400, detail="Routes are not found")

    records = []
    for row in rows:
        records.append(dict(row))

    print("Get all records method success")
    return {"route":records}

@app.get("/api/users/{user_id}/records/{route_id}")
def get_record_by_id(user_id:int, route_id:int, db:sqlite3.Connection = Depends(get_db)):
    # The user_id input error is not handled since only logged-in users can use this method
    # When the user log in, the app will know the user_id
    cursor = db.execute("SELECT * FROM routes WHERE route_id = ? AND user_id = ?", (route_id, user_id))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Route Not Found")

    print("Get record by id method success")
    output = {
        "user_id":user_id,
        "route_id":route_id,
        "record": dict(row)
    }
    return output

@app.delete("/api/users/{user_id}/records/{route_id}")
def remove_record_by_id(user_id:int, route_id:int, db:sqlite3.Connection = Depends(get_db)):
    cursor = db.execute("DELETE FROM routes WHERE route_id = ? AND user_id = ?", (route_id,user_id))
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    
    print("Remove record by id method success")
    return {"message": f"Route {route_id} is deleted sucessfully"}