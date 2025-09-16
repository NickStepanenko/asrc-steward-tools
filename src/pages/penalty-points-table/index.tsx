import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Button, Form, Input, Popconfirm, Space, Table } from 'antd';
import type { Car, Race, PenaltyTableProps } from '@/types'

type FormInstance<T> = GetRef<typeof Form<T>>;
const EditableContext = React.createContext<FormInstance<any> | null>(null);
type ColumnTypes = Exclude<TableProps<Car>['columns'], undefined>;

interface EditableRowProps {
  index: number;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: string;
  record: any;
  handleSave: (record: any) => void;
  races: Race[];
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

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  dataIndex,
  record,
  handleSave,
  races,
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

  const now = new Date();
  const raceRound = parseInt(dataIndex); // since race columns are named '1', '2', etc.

  const race = races.find(r => r.round === raceRound);
  const raceDate = race ? new Date(race.raceDateTime) : null;
  const diffDays = raceDate ? (now.getTime() - raceDate.getTime()) / (1000 * 60 * 60 * 24) : 0;
  const isRecent = raceDate && diffDays >= 0 && diffDays <= 28;

  const backgroundColor = editable
    ? isRecent
      ? '#f2ce40ff' // Yellow
      : '#c2c2c2ff' // Grey
    : undefined;

  let childNode = restProps.children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={`r${dataIndex}`}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input
          ref={inputRef}
          size="small"
          onPressEnter={save}
          onBlur={save}
          style={{ textAlign: 'center' }}
        />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          padding: 0,
          margin: 0,
          width: '100%',
          height: '100%',
          backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleEdit}
      >
        {record[`r${dataIndex}`] ?? 0}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

const flattenPenaltyPoints = (car: Car & { penaltyPoints: Record<number, number> }, raceRounds: number[]) => {
  const flattened = { ...car, key: car.id } as any;
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
    .map((race, index) => ({
      title: race ? race.name.slice(0, 3).toUpperCase() : `R${index + 1}`,
      dataIndex: `${race.round}`,
      editable: true,
      width: 50,
      align: 'center',
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
      cell: (props: EditableCellProps) => <EditableCell {...props} races={races} />,
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
        races, // 👈 ADD THIS
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
        bordered
        pagination={false}
        components={components}
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        rowClassName={() => 'editable-row'}
      />
    </Space>
  );
};

export default PenaltyPointsTable;
