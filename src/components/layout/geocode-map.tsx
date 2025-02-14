import { Circle, Map, Placemark, useYMaps } from "@pbe/react-yandex-maps";
import { useState } from "react";
import { Flex, Typography } from "antd";
import styled from "styled-components";
import { IGeocodeResult } from "yandex-maps";

type CoordinatesType = Array<number>;

interface IMapClickEvent {
  get: (key: string) => CoordinatesType;
}

interface IAddress {
  location: string;
  route: string;
}

const CardWithGeocodeMap = styled(Flex)`
  width: 100%;
  flex-direction: column;
`;

const CardWithMapWrapper = styled(Flex)`
  height: 400px;
  gap: 6px;
`;

const MapWithGeocode = styled(Map)`
  width: 75%;
  border: 1px solid black;
  border-radius: 10px;
  overflow: hidden;
`;

const LocationInfoCard = styled(Flex)`
  width: 25%;
  justify-content: center;
  align-items: center;
  border: 1px solid black;
  border-radius: 10px;
  padding: 6px;
`;

const AddressWithCoordinates = styled(Flex)`
  flex-direction: column;
`;

const InfoWithPanoramaWrapper = styled(Flex)`
  width: 100%;
  height: 100%;
`;

const EmptyAddressMessage = styled(Typography.Title)`
  width: 100%;
  text-align: center;
`;

const CENTER = [59.94077030138753, 30.31197058944388];
const ZOOM = 12;

const CIRCLE_CENTER = [59.93202159282082, 30.36077988978569];
const CIRCLE_RADIUS = 3000;
const OFFICE_ADDRESS = "Санкт-Петербург, ул. Восстания, 1Б";

const GeocodeMap = () => {
  const [coordinates, setCoordinates] = useState<CoordinatesType | null>(null);
  const [address, setAddress] = useState<IAddress | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState<boolean | null>(null);

  const ymaps = useYMaps(["geocode"]);

  const formattedCoordinates = coordinates
    ? `${coordinates[0]?.toFixed(6)}, ${coordinates[1]?.toFixed(6)}`
    : null;

  const handleClickMap = (e: IMapClickEvent) => {
    const coords = e.get("coords");

    if (coords) {
      setCoordinates(coords);
    }

    ymaps
      ?.geocode(coords)
      .then((result) => {
        const foundAddress = handleGeoResult(result);

        if (foundAddress) setAddress(foundAddress);
      })
      .catch((error: unknown) => {
        console.log("Ошибка геокодирования", error);
        setAddress(null);
      });

    if (coords) {
      checkIfInsideRadius(coords);
    }
  };

  function handleGeoResult(result: IGeocodeResult) {
    const firstGeoObject = result.geoObjects.get(0);

    if (firstGeoObject) {
      const properties = firstGeoObject.properties;

      const location = String(properties.get("description", {}));
      const route = String(properties.get("name", {}));

      const foundAddress = {
        location,
        route
      };

      return foundAddress;
    }
  }

  function checkIfInsideRadius(coord: CoordinatesType) {
    if (ymaps) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const distance = (ymaps as any).coordSystem.geo.getDistance(
        CIRCLE_CENTER,
        coord
      );
      const isPointInsideRadius = distance <= CIRCLE_RADIUS;

      setIsInsideRadius(isPointInsideRadius);
    }
  }

  // function checkIfInsideRadius(coord: CoordinatesType) {
  //   if (coord) {
  //     // Вычисляем расстояние между двумя точками с помощью формулы Хаверсинуса
  //     const distance = getDistanceBetweenPoints(CIRCLE_CENTER, coord);
  //     const isPointInsideRadius = distance <= CIRCLE_RADIUS;
  //     setIsInsideRadius(isPointInsideRadius);
  //   }
  // }

  // // Функция для вычисления расстояния между двумя точками (в метрах)
  // function getDistanceBetweenPoints(
  //   point1: CoordinatesType,
  //   point2: CoordinatesType
  // ): number {
  //   const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  //   const [lat1, lon1] = point1;
  //   const [lat2, lon2] = point2;

  //   const R = 6371000; // Радиус Земли в метрах
  //   const dLat = toRadians(lat2 - lat1);
  //   const dLon = toRadians(lon2 - lon1);

  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(toRadians(lat1)) *
  //       Math.cos(toRadians(lat2)) *
  //       Math.sin(dLon / 2) *
  //       Math.sin(dLon / 2);

  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  //   return R * c; // Расстояние в метрах
  // }

  return (
    <CardWithGeocodeMap>
      <CardWithMapWrapper>
        <LocationInfoCard>
          {address ? (
            <InfoWithPanoramaWrapper vertical>
              <AddressWithCoordinates>
                <Typography.Text>{`Локация: ${address?.location}`}</Typography.Text>
                <Typography.Text> {`Адрес: ${address?.route}`}</Typography.Text>
                <Typography.Text>
                  {`Координаты: ${formattedCoordinates}`}
                </Typography.Text>

                {isInsideRadius !== null && (
                  <Typography.Title level={3} style={{ textAlign: "center" }}>
                    {isInsideRadius
                      ? "Метка внутри радиуса доставки"
                      : "Метка вне радиуса доставки"}
                  </Typography.Title>
                )}
              </AddressWithCoordinates>
            </InfoWithPanoramaWrapper>
          ) : (
            <EmptyAddressMessage>Выберите точку на карте</EmptyAddressMessage>
          )}
        </LocationInfoCard>

        <MapWithGeocode
          defaultState={{
            center: CENTER,
            zoom: ZOOM
          }}
          onClick={(e: IMapClickEvent) => handleClickMap(e)}
        >
          {coordinates && <Placemark geometry={coordinates} />}

          <Placemark
            geometry={CIRCLE_CENTER}
            properties={{
              balloonContent: `Офис: ${OFFICE_ADDRESS}`
            }}
            options={{ preset: "islands#redIcon" }}
          />

          <Circle
            geometry={[CIRCLE_CENTER, CIRCLE_RADIUS]}
            options={{
              draggable: false,
              fillColor: "#DB709377",
              strokeColor: "#990066",
              strokeOpacity: 0.8,
              strokeWidth: 2,
              interactivityModel: "default#transparent"
            }}
          />
        </MapWithGeocode>
      </CardWithMapWrapper>
    </CardWithGeocodeMap>
  );
};

export default GeocodeMap;
