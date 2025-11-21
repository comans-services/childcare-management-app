import { Employee, Room, RoomData, EnteredEmployee, StatusType } from '@/types/childcare-monitor';
import { formatDate } from '@/utils/childcare-monitor/roomUtils';

// Mock employees with real names as specified
export const employees: Employee[] = [
  { id: '1', name: 'Sally Young' },
  { id: '2', name: 'Diane Duncan' },
  { id: '3', name: 'Sheridan Corke' },
  { id: '4', name: 'Anna Feleppa' },
  { id: '5', name: 'Bahini Paint' },
  { id: '6', name: 'Niki Shah' },
  { id: '7', name: 'Miro Yu' },
  { id: '8', name: 'Niluka Hewage' },
  { id: '9', name: 'Ruth Howard' },
  { id: '10', name: 'Siew Muk' },
  { id: '11', name: 'Ishani Hapuarachchi' },
  { id: '12', name: 'Maggie Yu' },
  { id: '13', name: 'Preeni Ranmuthugala' },
  { id: '14', name: 'Min Ji' },
  { id: '15', name: 'Saku Miriyagalla' },
  { id: '16', name: 'Laura Hillard' },
  { id: '17', name: 'Shuna Xing' },
  { id: '18', name: 'Yetta Knoff' },
  { id: '19', name: 'Gaya Kasundara' },
  { id: '20', name: 'Alice Lee' },
  { id: '21', name: 'Jasmine Lim' },
  { id: '22', name: 'Fransisca Anwari' },
  { id: '23', name: 'Tania Kehridakis' },
  { id: '24', name: 'Tiara Wijaya' },
  { id: '25', name: 'Krystal Chen' },
  { id: '26', name: 'Gina Fuentes Davila Leon' },
  { id: '27', name: 'Maggie Cao' },
  { id: '28', name: 'Joey Zhou' },
  { id: '29', name: 'Ling Lin' },
  { id: '30', name: 'Sineka Liyanage' },
  { id: '31', name: 'Nadeeshani Rajapriya' },
  { id: '32', name: 'Nadeeka Rathnayaka' },
  { id: '33', name: 'Alina Pepineva' },
  { id: '34', name: 'Menali Dharmasena' },
  { id: '35', name: 'Gimhani Jayasekara' },
  { id: '36', name: 'Meilian Lu' },
  { id: '37', name: 'Lakshi Rupasinghe' },
];

// Mock rooms with real names as specified
export const rooms: Room[] = [
  { id: '1', name: 'Wattle', macAddress: '00:11:22:33:44:55' },
  { id: '2', name: 'Waratah', macAddress: '66:77:88:99:AA:BB' },
  { id: '3', name: 'Jacaranda', macAddress: 'CC:DD:EE:FF:00:11' },
  { id: '4', name: 'Eucalyptus', macAddress: 'DD:EE:FF:00:11:22' },
];

// Initial room data with zero children
export const roomData: RoomData[] = [
  {
    id: '1',
    roomId: '1',
    roomName: 'Wattle',
    childrenOver3: 0,
    childrenUnder3: 0,
    timestamp: formatDate(new Date()),
  },
  {
    id: '2',
    roomId: '2',
    roomName: 'Waratah',
    childrenOver3: 0,
    childrenUnder3: 0,
    timestamp: formatDate(new Date()),
  },
  {
    id: '3',
    roomId: '3',
    roomName: 'Jacaranda',
    childrenOver3: 0,
    childrenUnder3: 0,
    timestamp: formatDate(new Date()),
  },
  {
    id: '4',
    roomId: '4',
    roomName: 'Eucalyptus',
    childrenOver3: 0,
    childrenUnder3: 0,
    timestamp: formatDate(new Date()),
  }
];

// Initial staff assignments (empty)
export const enteredEmployees: EnteredEmployee[] = [];

// Helper function to get the latest room data
export const getLatestRoomData = (roomId: string): RoomData | undefined => {
  return roomData.find(data => data.roomId === roomId);
};

// Helper function to get employees in a room
export const getEmployeesInRoom = (roomId: string): EnteredEmployee[] => {
  return enteredEmployees.filter(
    emp => emp.roomId === roomId && emp.status === StatusType.ENTER
  );
};

// Helper function to get a room by ID
export const getRoomById = (roomId: string): Room | undefined => {
  return rooms.find(room => room.id === roomId);
};

// Helper function to get an employee by ID
export const getEmployeeById = (employeeId: string): Employee | undefined => {
  return employees.find(emp => emp.id === employeeId);
};

// Helper function to check if an employee is already in a room
export const isEmployeeInAnyRoom = (employeeId: string): boolean => {
  return enteredEmployees.some(
    emp => emp.employeeId === employeeId && emp.status === StatusType.ENTER
  );
};

// Helper function to get which room an employee is currently in (if any)
export const getEmployeeCurrentRoom = (employeeId: string): Room | undefined => {
  const currentEntry = enteredEmployees.find(
    emp => emp.employeeId === employeeId && emp.status === StatusType.ENTER
  );

  if (currentEntry) {
    return getRoomById(currentEntry.roomId);
  }

  return undefined;
};

// Function to update room data (in a real app, this would be an API call)
export const updateRoomData = (newData: RoomData): void => {
  const index = roomData.findIndex(data => data.roomId === newData.roomId);

  if (index !== -1) {
    roomData[index] = newData;
  } else {
    roomData.push(newData);
  }
};

// Function to update staff presence (in a real app, this would be an API call)
export const updateStaffPresence = (newEntry: EnteredEmployee): void => {
  // Add the new entry to track the history
  enteredEmployees.push(newEntry);
};
