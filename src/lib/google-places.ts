import "server-only";
export interface BusinessPlace {
  name: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: string[];
}
interface GooglePlaceResponse {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}
export async function getBusinessPlace(): Promise<BusinessPlace | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_MAPS_PLACE_ID;
  if (!apiKey || !placeId) return null;
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,formattedAddress,location,googleMapsUri,rating,userRatingCount,regularOpeningHours",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!response.ok) return null;
    const raw = (await response.json()) as GooglePlaceResponse;
    if (!raw.displayName?.text) return null;
    return {
      name: raw.displayName.text,
      formattedAddress: raw.formattedAddress,
      latitude: raw.location?.latitude,
      longitude: raw.location?.longitude,
      googleMapsUri: raw.googleMapsUri,
      rating: raw.rating,
      userRatingCount: raw.userRatingCount,
      openingHours: raw.regularOpeningHours?.weekdayDescriptions,
    };
  } catch {
    return null;
  }
}
