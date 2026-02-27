export interface RegisterUserRequest {
  email: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  positionCode: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
}

export interface RegisteredUserResponse {
  id: number;
  email: string;
  fullName: string;
  idNumber: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  positionCode: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  sysStatus: string;
}
