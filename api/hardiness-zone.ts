const url = "https://phzmapi.org/";

export const readHardinessZoneInfo = async (zipCode: string) => {
  try {
    const response = await fetch(`${url}${zipCode}.json`);
    const data = await response.json();

    return { ok: response.ok, data };
  } catch (error) {
    return { data: null, error };
  }
};
