
export interface Employee {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  macAddress: string;
}

export interface RoomData {
  id: string;
  roomId: string;
  roomName: string;
  childrenOver3: number;
  childrenUnder3: number;
  timestamp: string;
}

export interface EnteredEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  roomId: string;
  status: 'enter' | 'exit';
  timestamp: string;
}

export enum StatusType {
  ENTER = 'enter',
  EXIT = 'exit'
}

export interface RoomUpdateForm {
  status: StatusType;
  employeeId: string;
  roomId: string;
  childrenOver3: number;
  childrenUnder3: number;
}
