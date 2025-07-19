// RoutingMachine.jsx
import { createControlComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const createRoutingLayer = ({ waypoints, ...options }) =>
    L.Routing.control({
        waypoints: waypoints.map(({ lat, lng }) => L.latLng(lat, lng)),
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving',
            timeout: 30000,
        }),
        lineOptions: { styles: [{ color: '#3B82F6', weight: 4 }] },
        createMarker: () => null,
        fitSelectedRoutes: false,
        showAlternatives: false,
        show: false,
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        removeRouteOnCancel: false,
        useZoomParameter: false,
        fitBounds: false,
        ...options,
    });

const RoutingMachine = createControlComponent(createRoutingLayer);
export default RoutingMachine;
