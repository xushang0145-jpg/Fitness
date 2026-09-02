declare module 'react-native-amap3d' {
  import { Component } from 'react';
  import { ViewStyle, ColorValue, StyleProp } from 'react-native';

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface CameraPosition {
    target?: LatLng;
    zoom?: number;
    bearing?: number;
    tilt?: number;
  }

  export enum MapType {
    Standard = 0,
    Satellite = 1,
    Night = 2,
    Navi = 3,
    Bus = 4,
  }

  export interface MapViewProps {
    style?: StyleProp<ViewStyle>;
    mapType?: MapType;
    initialCameraPosition?: CameraPosition;
    myLocationEnabled?: boolean;
    scrollGesturesEnabled?: boolean;
    zoomGesturesEnabled?: boolean;
    rotateGesturesEnabled?: boolean;
    tiltGesturesEnabled?: boolean;
    compassEnabled?: boolean;
    scaleControlsEnabled?: boolean;
    distanceFilter?: number;
    children?: React.ReactNode;
  }

  export class MapView extends Component<MapViewProps> {
    moveCamera(cameraPosition: CameraPosition, duration?: number): void;
  }

  export interface PolylineProps {
    points: LatLng[];
    width?: number;
    color?: ColorValue;
    colors: ColorValue[];
    zIndex?: number;
    gradient?: boolean;
    geodesic?: boolean;
    dotted?: boolean;
    onPress?: () => void;
  }

  export class Polyline extends Component<PolylineProps> {}

  export namespace AMapSdk {
    function init(apiKey?: string): void;
    function getVersion(): Promise<string>;
  }
}
