import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Button, Form, Input, Popconfirm, Space, Table } from 'antd';

type FormInstance<T> = GetRef<typeof Form<T>>;
const EditableContext = React.createContext<FormInstance<any> | null>(null);
type ColumnTypes = Exclude<TableProps<Car>['columns'], undefined>;

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableRowProps {
  index: number;
}

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
};

interface DataType {
  key: React.Key;
  name: string;
  age: string;
  address: string;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    }
    catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type PenaltyTableProps = {
  tableData: Car[];
  races: Race[];
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

const flattenPenaltyPoints = (car: Car & { penaltyPoints: Record<number, number> }, raceRounds: number[]) => {
  const flattened = { ...car, key: car.carNumber } as any;
  raceRounds.forEach((round) => {
    flattened[`r${round}`] = car.penaltyPoints[round] ?? 0;
  });
  return flattened;
};

const unflattenPenaltyPoints = (row: any, raceRounds: number[]) => {
  const penaltyPoints: Record<number, number> = {};
  raceRounds.forEach((round) => {
    penaltyPoints[round] = Number(row[`r${round}`]) || 0;
  });

  const { carNumber, firstName, lastName, teamName, teamLogo, carImage, flagImage } = row;

  return {
    carNumber,
    firstName,
    lastName,
    teamName,
    teamLogo,
    carImage,
    flagImage,
    penaltyPoints,
  };
};


const PenaltyPointsTable: React.FC<PenaltyTableProps> = (params) => {
  const {
    tableData,
    races,
  } = params;

  const raceRounds = races.map((r) => r.round);
  const [dataSource, setDataSource] = useState<any[]>(() =>
    tableData.map((car) => flattenPenaltyPoints(car, raceRounds))
  );
  const now = new Date();
  const recentRounds = races
    .filter((race) => {
      const raceDate = new Date(race.raceDateTime);
      const diffDays = (now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 28;
    })
    .map((r) => r.round);

  const baseColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
    {
      title: '#',
      dataIndex: 'carNumber',
      width: 80,
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      width: 150,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      width: 40,
      render: (_, record: any) => {
        const points = record.penaltyPoints || {};
        const sum = Object.entries(points)
          .filter(([round]) => recentRounds.includes(Number(round)))
          .reduce((acc: any, [, val]) => acc + val, 0);
        return sum;
      },
    },
    {
      title: 'Passive',
      dataIndex: 'passive',
      width: 40,
      render: (_, record: any) => {
        const points = record.penaltyPoints || {};
        const sum = Object.entries(points)
          .filter(([round]) => !recentRounds.includes(Number(round)))
          .reduce((acc: any, [, val]) => acc + val, 0);
        return sum;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      width: 40,
      render: (_, record: any) => {
        const points = record.penaltyPoints || {};
        const sum = Object.values(points).reduce((acc: number, val: any) => acc + val, 0);
        return sum;
      },
    },
  ];

  const raceColumns = races
    .sort((a, b) => a.round - b.round)
    .map((race) => ({
      title: race.name.slice(0, 3).toUpperCase(),
      dataIndex: String(race.round),
      editable: true,
      render: (text: any, record: any) => {
        const value = record.penaltyPoints?.[race.round] ?? 0;
        const raceDate = new Date(race.raceDateTime);
        const diffDays = (now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24);
        const isRecent = diffDays >= 0 && diffDays <= 28;

        return (
          <div
            style={{
              backgroundColor: isRecent ? '#fde721ff' : '#b9b9b9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {value}
          </div>
        );
      },
    }));

  const defaultColumns = [...baseColumns, ...raceColumns];

  const handleSave = (row: any) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => item.carNumber === row.carNumber);
    if (index > -1) {
      newData[index] = { ...newData[index], ...row };
      setDataSource(newData);
    }
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  useEffect(() => {
    setDataSource(tableData.map((car) => flattenPenaltyPoints(car, raceRounds)));
  }, [tableData, races]);

  return (
    <Space direction='vertical' size={10}>
      <Button
        type="primary"
        onClick={() => {
          const finalData = dataSource.map((row) => unflattenPenaltyPoints(row, raceRounds));
          console.log('Saved data:', finalData);
          // you can now send `finalData` to API, export, or pass to parent
        }}
        style={{ marginBottom: 16 }}
      >
        Save Changes
      </Button>
      <Table
        size="small"
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        pagination={false}
      />
    </Space>
  );
};

export default PenaltyPointsTable;
