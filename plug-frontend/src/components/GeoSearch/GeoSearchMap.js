import { APIProvider, Map } from "@vis.gl/react-google-maps";

import { Loader2 } from "lucide-react";
import PoiMarkers from "./PoiMarkers";
import {useState} from "react";

function GeoSearchMap({
  locations = [],
  center = { lat: 22.54992, lng: 0 },
  zoom = 3,
  isMenuOpen = false,
  setCenter,
  setZoom,
  setSelectedMarker,
  selectedListItem,
}) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  return (
    <div className={`relative w-full lg:w-2/3 ${isMenuOpen ? "z-[-1]" : ""}`}>
      {/* Loader overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-80 z-10 rounded-[15px]">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            <p className="text-gray-700 font-medium">Loading Maps…</p>
          </div>
        </div>
      )}

      {/* Map or Street View container */}
      <div
        style={{ height: "100vh", borderRadius: "15px", overflow: "hidden" }}
      >
        <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ height: "100%", width: "100%" }}
            center={center}
            zoom={zoom}
            gestureHandling="greedy"
            mapId="a1f3c0b2d4e5c8b7"
            mapTypeId="roadmap"
            disableDefaultUI={false}
            onIdle={() => setIsMapLoaded(true)}
            onZoomChanged={(newZoom) => setZoom(newZoom)}
            onCameraChanged={(newCamera) => setCenter(newCamera.detail.center)}
          >
            <PoiMarkers
              setSelectedMarker={setSelectedMarker}
              pois={locations}
            />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

export default GeoSearchMap;
