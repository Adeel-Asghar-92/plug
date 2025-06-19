import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";

import markerIcon from "../../assets/img/pointer.png";
import { useState } from "react";

export const PoiMarker = ({ poi, setSelectedMarker,position }) => {
  const [InfoWindowOpen, setInfoWindowOpen] = useState(false);

  const handleMarkerClick = () => {
    setInfoWindowOpen(!InfoWindowOpen);
    setSelectedMarker(poi?.id);
  };

  const closeHandler = () => {
    setInfoWindowOpen(false);
  };

  return (
    <>
      <AdvancedMarker position={position} onClick={handleMarkerClick}>
        <img src={markerIcon} width={32} height={32} alt="marker icon" />
      </AdvancedMarker>
      {InfoWindowOpen && (
        <InfoWindow
          onClose={closeHandler}
          key={poi?.key}
          position={position}
        >
          <div className="bg-white p-2 rounded-lg shadow-md text-black">
            <h3 className="font-bold text-md mb-1">{poi?.keyword}</h3>
            <p className="text-sm">
              <strong>Area:</strong> {poi?.community}
            </p>
            <p className="text-sm">
              <strong>Searches:</strong> {poi?.searches}
            </p>
            <p className="text-sm">
              <strong>Zip:</strong> {poi?.zipcode}
            </p>
            <p className="text-sm">
              <strong>Date:</strong>{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
            {poi.subcategory && (
              <p className="text-sm">
                <strong>Subcategory:</strong> {poi?.subcategory}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};
