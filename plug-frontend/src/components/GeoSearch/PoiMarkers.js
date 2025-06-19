import { PoiMarker } from "./PoiMarker";
import React from "react";

function PoiMarkers(props) {
  return (
    <>
      {props.pois.map((poi) => {
        return poi.positions.map((position) => {
          return (
            <PoiMarker
              key={poi?.position}
              poi={poi}
              position={position}
              setSelectedMarker={props.setSelectedMarker}
            />
          );
        });
      })}
    </>
  );
}

export default PoiMarkers;
