import { readHardinessZoneInfo } from "@/api/hardiness-zone";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import MapView, { Region } from "react-native-maps";

interface Coordinates {
  lat: string;
  lon: string;
}

interface HardinessZoneProps {
  zone: string | null;
  temperature_range: string | null;
  coordinates: Coordinates | null;
}

interface LocationProps {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const [address, setAddress] = useState<string>("");
  const [location, setLocation] = useState<Region | undefined>(undefined);
  const [hardinessData, setHardinessData] = useState<
    HardinessZoneProps | undefined
  >();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "25%"], []);
  const delta: number = 0.002;

  const getHardinessZoneInfo = async (location: LocationProps) => {
    try {
      const postalAddress = await reverseGeocodeAsync(location);
      const { data } = await readHardinessZoneInfo(
        postalAddress[0].postalCode as string
      );
      setLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      });
      setHardinessData(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch hardiness zone information.");
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Permission Denied",
        "Please update your location permission settings to allow access."
      );
      return;
    }

    let location = await getCurrentPositionAsync();

    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });
  };

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleLongPress = async (location: LocationProps) => {
    Keyboard.dismiss();
    await getHardinessZoneInfo(location);
    handlePresentModalPress();
  };

  const handleAddressChange = (code: string) => {
    setAddress(code);
  };

  const handleSubmitAddress = () => {
    console.log(address);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={() => {
          Keyboard.dismiss();
        }}
      />
    ),
    []
  );

  return (
    <>
      <MapView
        style={styles.map}
        initialRegion={location}
        onLongPress={({ nativeEvent }) =>
          handleLongPress(nativeEvent.coordinate)
        }
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <TextInput
            value={address}
            onChangeText={handleAddressChange}
            placeholder="Enter address"
            style={styles.input}
            onSubmitEditing={handleSubmitAddress}
          />
        </TouchableWithoutFeedback>
      </MapView>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={styles.contentContainer}>
            <View style={{ flexDirection: "row" }}>
              <Text>Hardiness Zone:</Text>
              <Text style={{ marginLeft: 4, fontWeight: "bold" }}>
                {hardinessData?.zone}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text>Temperature Range:</Text>
              <Text style={{ marginLeft: 4, fontWeight: "bold" }}>
                {`${hardinessData?.temperature_range} F`}
              </Text>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  input: {
    height: 56,
    borderColor: "gray",
    borderWidth: 1,
    width: "80%",
    marginBottom: 16,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: "white",
    marginTop: "20%",
    fontSize: 16,
  },
  infoContainer: {
    alignItems: "center",
  },
  map: {
    flex: 1,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
});
