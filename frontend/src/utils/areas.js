// Ratnagiri Urban Areas with approximate coordinates for proximity calculation
// Coordinates are approximate lat/lng of each neighborhood center
export const AREAS = [
  'Rajiwada',
  'Mirjole',
  'Kothawade',
  'Mandvi',
  'Nachane',
  'Bhatye',
  'Maruti Mandir',
  'Udyam Nagar',
  'Zaver Baug',
  'Teli Aali',
  'Karbude',
  'Shirke Nagar',
  'Fishtail',
  'Bhagoji Keer',
];

// Proximity graph - for each area, lists nearby areas in order of closeness
// Based on actual Ratnagiri urban geography
export const AREA_PROXIMITY = {
  'Rajiwada': ['Mandvi', 'Teli Aali', 'Zaver Baug', 'Mirjole', 'Kothawade', 'Maruti Mandir', 'Bhagoji Keer', 'Udyam Nagar', 'Shirke Nagar', 'Bhatye', 'Fishtail', 'Nachane', 'Karbude'],
  'Mirjole': ['Kothawade', 'Zaver Baug', 'Rajiwada', 'Maruti Mandir', 'Teli Aali', 'Mandvi', 'Udyam Nagar', 'Bhagoji Keer', 'Shirke Nagar', 'Nachane', 'Bhatye', 'Fishtail', 'Karbude'],
  'Kothawade': ['Mirjole', 'Zaver Baug', 'Maruti Mandir', 'Rajiwada', 'Udyam Nagar', 'Teli Aali', 'Mandvi', 'Shirke Nagar', 'Bhagoji Keer', 'Nachane', 'Bhatye', 'Fishtail', 'Karbude'],
  'Mandvi': ['Rajiwada', 'Teli Aali', 'Bhagoji Keer', 'Zaver Baug', 'Mirjole', 'Fishtail', 'Kothawade', 'Maruti Mandir', 'Bhatye', 'Udyam Nagar', 'Shirke Nagar', 'Nachane', 'Karbude'],
  'Nachane': ['Karbude', 'Shirke Nagar', 'Udyam Nagar', 'Maruti Mandir', 'Kothawade', 'Mirjole', 'Zaver Baug', 'Bhatye', 'Rajiwada', 'Teli Aali', 'Mandvi', 'Bhagoji Keer', 'Fishtail'],
  'Bhatye': ['Fishtail', 'Mandvi', 'Bhagoji Keer', 'Rajiwada', 'Teli Aali', 'Zaver Baug', 'Mirjole', 'Kothawade', 'Maruti Mandir', 'Udyam Nagar', 'Shirke Nagar', 'Nachane', 'Karbude'],
  'Maruti Mandir': ['Udyam Nagar', 'Kothawade', 'Mirjole', 'Shirke Nagar', 'Zaver Baug', 'Rajiwada', 'Nachane', 'Teli Aali', 'Mandvi', 'Bhagoji Keer', 'Karbude', 'Bhatye', 'Fishtail'],
  'Udyam Nagar': ['Maruti Mandir', 'Shirke Nagar', 'Kothawade', 'Mirjole', 'Nachane', 'Zaver Baug', 'Karbude', 'Rajiwada', 'Teli Aali', 'Mandvi', 'Bhagoji Keer', 'Bhatye', 'Fishtail'],
  'Zaver Baug': ['Mirjole', 'Rajiwada', 'Kothawade', 'Teli Aali', 'Maruti Mandir', 'Mandvi', 'Udyam Nagar', 'Bhagoji Keer', 'Shirke Nagar', 'Nachane', 'Bhatye', 'Fishtail', 'Karbude'],
  'Teli Aali': ['Rajiwada', 'Mandvi', 'Zaver Baug', 'Mirjole', 'Bhagoji Keer', 'Kothawade', 'Maruti Mandir', 'Udyam Nagar', 'Bhatye', 'Fishtail', 'Shirke Nagar', 'Nachane', 'Karbude'],
  'Karbude': ['Nachane', 'Shirke Nagar', 'Udyam Nagar', 'Maruti Mandir', 'Kothawade', 'Mirjole', 'Zaver Baug', 'Rajiwada', 'Teli Aali', 'Mandvi', 'Bhagoji Keer', 'Bhatye', 'Fishtail'],
  'Shirke Nagar': ['Udyam Nagar', 'Maruti Mandir', 'Nachane', 'Karbude', 'Kothawade', 'Mirjole', 'Zaver Baug', 'Rajiwada', 'Teli Aali', 'Mandvi', 'Bhagoji Keer', 'Bhatye', 'Fishtail'],
  'Fishtail': ['Bhatye', 'Bhagoji Keer', 'Mandvi', 'Rajiwada', 'Teli Aali', 'Zaver Baug', 'Mirjole', 'Kothawade', 'Maruti Mandir', 'Udyam Nagar', 'Shirke Nagar', 'Nachane', 'Karbude'],
  'Bhagoji Keer': ['Mandvi', 'Teli Aali', 'Rajiwada', 'Bhatye', 'Fishtail', 'Zaver Baug', 'Mirjole', 'Kothawade', 'Maruti Mandir', 'Udyam Nagar', 'Shirke Nagar', 'Nachane', 'Karbude'],
};

// Get nearest facilities sorted by proximity from user's area
export function getNearestFacilities(facilities, userArea) {
  if (!userArea || !AREA_PROXIMITY[userArea]) return facilities;

  const proximityOrder = [userArea, ...AREA_PROXIMITY[userArea]];

  return [...facilities].sort((a, b) => {
    const aIdx = proximityOrder.indexOf(a.area);
    const bIdx = proximityOrder.indexOf(b.area);
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    return aRank - bRank;
  });
}
