import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  StandaloneSearchBox,
  Marker,
} from "@react-google-maps/api";
import { useNavigate, Link } from "react-router-dom";
import './index.css';
import Sidebar from "./sideBar";

const API_URL = import.meta.env.VITE_API_URL;
const containerStyle = {
  width: "90%",
  height: "700px",
  margin: "0 auto",
};
const center = {
  lat: 37.7749,
  lng: -122.4194,
};

const RouteOptimizer: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  //const [addresses, setAddresses] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<{ id: number; address: string }[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [, setResult] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);

  const navigate = useNavigate();
  const markerIdRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [, setSidebarMode] = useState<'added' | 'optimized'>('added');
  const [, setSidebarAddresses] = useState<{ id: number; address: string }[]>([]);


  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
    const storedAddresses = JSON.parse(localStorage.getItem("temp_addresses") || "[]");
    setAddresses(storedAddresses);
  }, []);

  useEffect(() => {
    localStorage.setItem("temp_addresses", JSON.stringify(addresses));
  }, [addresses]);

  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/");
  };

  const routeOptimization = () => {
    console.log("🔍 routeOptimization called");

    if (addresses.length < 2) {
      alert("Please enter at least two addresses.");
      return;
    }

    const rawUserId = localStorage.getItem("user_id");
    const user_id = rawUserId? parseInt(rawUserId, 10) : null

    const payload = {
      raw_start: addresses[0].address,
      raw_stop: addresses[addresses.length - 1].address,
      raw_addresses: addresses.length > 2 ? addresses.slice(1, -1).map(a => a.address) : [],
      address_ids: [],
      start_address_id: null,
      stop_address_id: null,
      user_id: user_id,
    };
    console.log("Sending to backend:", payload); 

    axios
      .post(`${API_URL}/api/routes/optimize/`, payload)
      .then((res) => {
        console.log("Backend reponses: ", res.data);
        setResult(res.data);

        console.log("Optimized route(distance):", res.data["Optimized based on distance"] )
        drawRoute(res.data["Optimized based on distance"]);
        setSidebarAddresses(res.data["Optimized based on distance"]);
        setSidebarMode('optimized');
        setSidebarVisible(true);
      })
      .catch((err) => {
        console.error(err.response?.data);
        alert(err.response?.data?.detail || "Route optimization failed");
        });
  };

  const drawRoute = async (orderedAddresses: string[]) => {
    if (orderedAddresses.length < 2) {
        console.warn("Not enough addresses to draw a route.");
        return;
    }
   
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: orderedAddresses[0],
        destination: orderedAddresses[addresses.length - 1],
        waypoints: orderedAddresses.map((addr) => ({ location: addr })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("Could not display directions due to: ", status);
        }
      }
    );
  };

  const handleSearch = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const new_address = place.formatted_address;
        const location = place.geometry?.location;

        if (location && new_address) {
          const lat = location.lat();
          const lng = location.lng();

          const newMarker = {
            id: markerIdRef.current++,
            position: { lat, lng },
            address: new_address
          };
          console.log("Searched address: ",place);
          setMarkers(prev => [...prev, newMarker]);

          map?.panTo(newMarker.position);
          map?.setZoom(15);
        }
      }
    }
  };

  const handleMarkerClick = (markerId: number) => {
  const selected = markers.find(m => m.id === markerId);
  if (!selected || !map) return;

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="font-family: Arial, sans-serif; padding: 8px; max-width: 200px;">
                <h3 style="margin-bottom: 4px; font-size: 16px;">${selected.address}</h3>
                <div style="display: flex; justify-content: space-between;">
                  <button id="add-btn-${markerId}" style="padding: 4px 8px; margin-right: 4px; border-radius: 4px; border: 1px solid #ccc; background: #fff; cursor: pointer;">Add</button>
                  <button id="delete-btn-${markerId}" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; background: #fff; cursor: pointer;">Delete</button>
                </div>
              </div>`
  });

  infoWindow.setPosition(selected.position);
  infoWindow.open(map);

  google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
    const addBtn = document.getElementById(`add-btn-${markerId}`);
    const deleteBtn = document.getElementById(`delete-btn-${markerId}`);

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        setAddresses(prev => [...prev, {id: selected.id, address: selected.address}]);
        setSidebarAddresses(prev => [...prev, {id: selected.id, address: selected.address}]);
        setSidebarMode('added');
        setSidebarVisible(true);
        infoWindow.close();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        setMarkers(prev => prev.filter(m => m.id !== markerId));
        setAddresses(prev => prev.filter(addr => addr !== selected.address));
        setSidebarAddresses(prev => prev.filter(addr => addr.id !== markerId));
        infoWindow.close();
      });
    }
  });
};

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRemoveFromSidebar = (markerId: number) => {
    // 1. drop it from the sidebar list
    setAddresses(list => list.filter(e => e.id !== markerId));
    // 2. drop the marker from the map
    setMarkers(list => list.filter(m => m.id !== markerId));
  };

    const handleReset = () => {
        setMarkers([]);
        setAddresses([]);
        setSidebarAddresses([]);
        setSidebarVisible(false);
        setDirections(null);
        localStorage.removeItem("temp_addresses");
    };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!} libraries={["places"]}>
      <div className="relative min-h-screen">
        <header>
          <div className="header-container">
            <div className="logo-nav">
              <h1 style={{ marginRight: '1rem' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>🚗 FindRoutes</Link>
              </h1>
              <nav>
                <a href="/">Home</a>
                <a href="/pricing">Pricing</a>
                <a href="/support">Support</a>
                <a href="/docs">Docs</a>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
              </nav>
            </div>
            <div className="auth-buttons">
              {username ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>Welcome, {username}</span>
                  <button className="logout" onClick={logout}>Log Out</button>
                </>
              ) : (
                <>
                  <button className="login" onClick={() => navigate("/login")}>Login</button>
                  <button className="signup" onClick={() => navigate("/register")}>Sign-in</button>
                </>
              )}
            </div>
          </div>
        </header>

        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "1rem", marginBottom: "1rem", paddingLeft: "5%" }}>
          <div style={{
            position: "relative",
            display: "flex",
            width: "100%",
            maxWidth: "400px"
          }}>
            <StandaloneSearchBox onLoad={(ref) => setSearchBox(ref)}>
              <input
                ref={searchInputRef}
                placeholder="Search Google Maps"
                type="text"
                onKeyDown={handleKeyPress}
                style={{
                  width: "350px",
                  height: "44px",
                  padding: "0 50px 0 16px",
                  border: "none",
                  borderRadius: "25px",
                  fontSize: "16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  outline: "none"
                }}
              />
            </StandaloneSearchBox>
            <button
              onClick={handleSearch}
              title="Search"
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                height: "100%"
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20"
                viewBox="0 0 24 24"
                width="20"
                fill="#333"
              >
                <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.2 5.01 12.19 2 8.6 2S2 5.01 2 8.6 5.01 15.2 8.6 15.2c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6.9 0C6.01 14 4 11.99 4 9.6S6.01 5.2 8.6 5.2 13.2 7.21 13.2 9.6 11.19 14 8.6 14z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="h-[75vh]">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={mapInstance => setMap(mapInstance)}
          >
            {directions && <DirectionsRenderer directions={directions} options={{suppressMarkers:true}}/>}
            {markers.map(marker => (
              <Marker
                key={marker.id}
                position={marker.position}
                onClick={() => handleMarkerClick(marker.id)}
              />
            ))}
          </GoogleMap>
        </div>

        <main className="p-4 max-w-6xl mx-auto">
          <div className="flex justify-start mt-4 gap-2" style={{ width: "90%", margin: "0 auto" }}>
            <button className="bg-black text-white px-4 py-2 rounded shadow" onClick={routeOptimization}>Find Route</button>
            <button className="bg-gray-300 px-4 py-2 rounded">Download</button>
            <button className="bg-gray-300 px-4 py-2 rounded">Print</button>
            <button className="bg-gray-300 px-4 py-2 rounded">Share</button>
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={handleReset}>Reset</button>
          </div>
        </main>

        {sidebarVisible && (
          <Sidebar
            entries={addresses}
            onRemove={handleRemoveFromSidebar}
          />
        )}
      </div>
    </LoadScript>
  );
};

export default RouteOptimizer;
