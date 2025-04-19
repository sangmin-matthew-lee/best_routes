import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import { useNavigate, Link } from "react-router-dom";
//import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import './index.css';

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
  const [addresses, setAddresses] = useState<string[]>([]);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [setResult] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const navigate = useNavigate();
  //const [loading, setLoading] = useState(true);
  
  //Debug
  //console.log("API KEY:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);


  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/");
  };

//   const handleAddAddress = () => {
//     if (addresses.length < 2) {
//       alert("Please enter at least two addresses.");
//       return;
//     }
//   };
  
    const payload = {
      raw_addresses: addresses.slice(1, -1),
      raw_start: addresses[0],
      raw_stop: addresses[addresses.length - 1],
      address_ids: [],
      start_address_id: null,
      stop_address_id: null,
      user_id: localStorage.getItem("user_id"),
    };
    
      axios
        .post("http://localhost:8000/api/routes/optimize/", payload)
        .then((res) => {
          setResult(res.data);
          drawRoute(res.data["Optimized based on distance"]);
        })
        .catch((err) =>
          alert(err.response?.data?.detail || "Route optimization failed")
        );


  const drawRoute = async (orderedAddresses: string[]) => {
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: addresses[0],
        destination: addresses[addresses.length - 1],
        waypoints: orderedAddresses.map((addr) => ({ location: addr })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
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

  const onPlacesChanged = () => {
    if (searchBox) {
      const searched_addrs = searchBox.getPlaces();
      if (searched_addrs && searched_addrs.length > 0) {
        const new_address = searched_addrs[0].formatted_address;
        if (new_address){
          setAddresses([...addresses, new_address])
        }
      }
    }
  };

//   const onDragEnd = (result: any) => {
//     if (!result.destination) return;
//     const reordered_addr = Array.from(addresses);
//     const [removed] = reordered_addr.splice(result.source.index, 1);
//     reordered_addr.splice(result.destination.index, 0, removed);
//     setAddresses(reordered_addr);
//   };

//   const removeAddress = (index: number) => {
//     const updated_addr = addresses.filter((_, i) => i !== index);
//     setAddresses(updated_addr);
//   };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!} libraries={["places"]}>
    <div className="relative min-h-screen">
        <header>
            <div className="header-container">
                <div className="logo-nav">
                <h1 style={{ marginRight: '1rem' }}>
                    <Link to="/" style={{textDecoration: 'none', color: 'ingerit'}}>🚗 FindRoutes
                    </Link>
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

      <div style={{ height: "20px" }} />
      <main className="p-4 max-w-6xl mx-auto">
      <StandaloneSearchBox onLoad={(ref) => setSearchBox(ref)} onPlacesChanged={onPlacesChanged}>
        <input
            className="search-input"
            placeholder="Enter address"
            type="text"
        />
      </StandaloneSearchBox>

        <div className="h-[75vh]">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </div>

        <div className="flex justify-start mt-4 gap-2" style={{ width: "90%", margin: "0 auto" }}>
          <button className="bg-black text-white px-4 py-2 rounded shadow">Find Route</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Download</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Print</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Share</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Reset</button>
        </div>
      </main>
    </div>
  </LoadScript>
  );
};

export default RouteOptimizer;
