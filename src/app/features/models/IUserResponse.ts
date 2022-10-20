export interface IUserResponse {
  success: true;
  errorMessage: string;
  debugMessage: string;
  data: {
    username: string;
    nome: string;
    cognome: string;
    email: string;
  };
}
