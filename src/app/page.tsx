"use client"
import PenaltyPointsTable from "../pages/PenaltyPointsTable";
import { useEffect, useState } from "react";
import { Select, Space } from "antd";

import type { Car, Championship, ChampionshipsListItem } from '@/types';

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
    console.log(champData);
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
