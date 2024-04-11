import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { jwtDecode } from "jwt-decode";

function App() {
  const [user, setUser] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          fetchNearbyHospitals(latitude, longitude);
        },
        error => {
          console.error("Error getting user's location:", error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      /* global google */
      google.accounts.id.initialize({
        client_id: "735027817981-l91aln3qlcb2khp38nca4v53urau1g86.apps.googleusercontent.com",
        callback: handleCallbackResponse
      });

      google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { theme: "outline", size: "large" }
      );
    };
    document.body.appendChild(script);
  }, []);

  function handleCallbackResponse(response) {
    var userObject = jwtDecode(response.credential);
    setUser(userObject);
    setIsLoggedIn(true);
    document.getElementById("signInDiv").hidden = true;
  }

  const fetchNearbyHospitals = async (latitude, longitude) => {
    const apiKey = "AIzaSyCECoiX-zVd7ziVcNWwMqXEMMEYyBcaMwg";
    const radius = 5000; // in meters (adjust as needed)
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=hospital&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch nearby hospitals');
      }
      const data = await response.json();
      setNearbyHospitals(data.results);
    } catch (error) {
      console.error("Error fetching nearby hospitals:", error);
      // Set 5 blank rows if fetching fails
      setNearbyHospitals(Array.from({ length: 5 }, (_, index) => ({ place_id: `blank-${index}` })));
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-400 to-indigo-600 min-h-screen flex flex-col items-center justify-center">
      <header className="text-center py-8">
        <h1 className="text-3xl font-bold text-white">Welcome to My Beautiful Map App</h1>
        <p className="text-lg text-gray-100 mt-2">Explore the world with ease</p>
      </header>
      <div id="signInDiv" className="mt-8"></div>
      {isLoggedIn && <UserInfo user={user} />}
      {isLoggedIn && <Maps currentLocation={currentLocation} nearbyHospitals={nearbyHospitals} />}
    </div>
  );
}

function UserInfo({ user }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <img src={user.picture} alt="Profile" className="rounded-full w-16 h-16 mx-auto mb-2" />
      <h2 className="text-xl font-semibold text-gray-800 text-center">{user.name}</h2>
      <p className="text-sm text-gray-600 text-center">{user.email}</p>
    </div>
  );
}

function Maps({ currentLocation, nearbyHospitals }) {
  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = currentLocation || { lat: 37.78825, lng: -122.4324 };

  // Determine which array to use based on nearbyHospitals length
  const hospitalsToDisplay = nearbyHospitals.length > 0 ? nearbyHospitals : Array.from({ length: 5 }, (_, index) => ({ place_id: `blank-${index}` }));

  return (
    <LoadScript googleMapsApiKey="AIzaSyCECoiX-zVd7ziVcNWwMqXEMMEYyBcaMwg">
      <div className="mx-auto w-full md:w-3/4 lg:w-2/3">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={currentLocation ? 15 : 10}
        >
        </GoogleMap>
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-white">Nearby Hospitals</h2>
          <table className="w-full border-collapse border border-white">
            <thead>
              <tr>
                <th className="border border-white px-4 py-2 text-white">Name</th>
                <th className="border border-white px-4 py-2 text-white">Address</th>
              </tr>
            </thead>
            <tbody>
              {hospitalsToDisplay.map(hospital => (
                <tr key={hospital.place_id}>
                  <td className="border border-white px-4 py-2 text-white">{hospital.name || ''}</td>
                  <td className="border border-white px-4 py-5 text-white">{hospital.vicinity || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LoadScript>
  );
}

export default App;
