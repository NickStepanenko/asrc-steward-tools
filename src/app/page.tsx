"use client"
import Image from "next/image";
import PenaltyPointsTable from "../pages/penalty-points-table";
import { useEffect, useState } from "react";
import { Select, Space } from "antd";

type Championship = {
  id: number;
  title: string;
  logo: string;
  serverName: string;
  serverPass: string;
  leagueJoinQr: string;
  cars: [Car];
  races: [Race];
};
type Car = {
  carNumber: number;
  firstName: string;
  lastName: string;
  teamName: string;
  teamLogo: string;
  carImage: string;
  flagImage: string;
  penaltyPoints: { [key: number]: number };
};
type Race = {
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
type ChampionshipsListItem = {
  value: number | null;
  label: React.ReactElement;
};

export default function Home() {
  const [champData, setChampData] = useState<Championship[]>([]);
  const [champList, setChampList] = useState<ChampionshipsListItem[]>([]);
  const [carsData, setCarsData] = useState<Car[]>([]);
  const [selectedChamp, setSelectedChamp] = useState<Championship | null>(null);

  const handleChampionshipSelection = (id: number) => {
    const champ = champData.find((item) => item.id === id) || null;
    setSelectedChamp(champ);
    setCarsData(champ?.cars || []);
  };

  useEffect(() => {
    fetch('/api/championships')
      .then((res) => res.json())
      .then(setChampData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const items = champData.map((champ: Championship) => ({
      value: champ.id,
      label: (<span>{champ.title}</span>),
    }));

    setChampList([ { value: -1, label: (<span>Select championship</span>) }, ...items ]);
  }, [champData]);
  
  return (
    <div style={{ width: '80%', margin: 'auto', padding: '2rem' }}>
      <Space direction='vertical' size={10}>
        <Select
          defaultValue={null}
          placeholder="Select championship"
          optionFilterProp="label"
          options={champList}
          onChange={handleChampionshipSelection}
          popupMatchSelectWidth
          style={{ width: 300 }} />
        <PenaltyPointsTable
          tableData={carsData}
          races={selectedChamp?.races || []}
        />
      </Space>
    </div>
  );
}
