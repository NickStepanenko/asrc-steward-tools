export type PenaltyTableProps = {
  tableData: Car[];
  races: Race[];
};

export type Car = {
  id: number;
  carNumber: number;
  firstName: string;
  lastName: string;
  teamName: string;
  teamLogo: string;
  carImage: string;
  flagImage: string;
  penalty: [PenaltyPoints];
};

export type Race = {
  id: number;
  name: string;
  round: number;
  laps: number;
  mins: number;
  tyres: [string];
  trackMap: string;
  trackLogo: string;
  raceDateTime: string;
};

export type Championship = {
  id: number;
  title: string;
  logo: string;
  serverName: string;
  serverPass: string;
  leagueJoinQr: string;
  cars: [Car];
  races: [Race];
};

export type ChampionshipsListItem = {
  value: number | null;
  label: React.ReactElement;
};

export type PenaltyPoints = {
  id: number;
  raceId: number;
  carId: number;
  points: number;
}
